"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numeric(formData: FormData, key: string) {
  const value = Number(text(formData, key).replace(",", "."));
  return Number.isFinite(value) ? value : NaN;
}

function monthStart(date: string) {
  return `${date.slice(0, 7)}-01`;
}

async function getSupabaseUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}

export async function createBrand(formData: FormData) {
  const name = text(formData, "name");
  const coupon = text(formData, "coupon");
  const url = text(formData, "url");
  const defaultCommission = numeric(formData, "default_commission");

  if (!name || !coupon || !url || !Number.isFinite(defaultCommission) || defaultCommission < 0 || defaultCommission > 100) {
    redirect("/brands?error=invalid");
  }

  let normalizedUrl = url;
  if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = `https://${normalizedUrl}`;
  try {
    new URL(normalizedUrl);
  } catch {
    redirect("/brands?error=url");
  }

  const { supabase, user } = await getSupabaseUser();
  const { data: brand, error } = await supabase
    .from("brands")
    .insert({ user_id: user.id, name, coupon, url: normalizedUrl, default_commission: defaultCommission })
    .select("id")
    .single();

  if (error || !brand) redirect("/brands?error=save");

  const currentMonth = monthStart(new Date().toISOString().slice(0, 10));
  await supabase.from("brand_commissions").insert({
    brand_id: brand.id,
    month_start: currentMonth,
    commission_rate: defaultCommission,
  });

  revalidatePath("/brands");
  revalidatePath("/dashboard");
  redirect("/brands?success=created");
}

export async function updateMonthlyCommission(formData: FormData) {
  const brandId = text(formData, "brand_id");
  const rate = numeric(formData, "commission_rate");
  const month = text(formData, "month");

  if (!brandId || !/^\d{4}-\d{2}$/.test(month) || !Number.isFinite(rate) || rate < 0 || rate > 100) {
    redirect("/brands?error=invalid");
  }

  const { supabase } = await getSupabaseUser();
  const { data: brand } = await supabase.from("brands").select("id, default_commission").eq("id", brandId).maybeSingle();
  if (!brand) redirect("/brands?error=brand");

  const { error } = await supabase.from("brand_commissions").upsert({
    brand_id: brandId,
    month_start: `${month}-01`,
    commission_rate: rate,
    updated_at: new Date().toISOString(),
  }, { onConflict: "brand_id,month_start" });

  if (error) redirect("/brands?error=save");
  revalidatePath("/brands");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  redirect("/brands?success=commission");
}

export async function createSale(formData: FormData) {
  const brandId = text(formData, "brand_id");
  const soldAt = text(formData, "sold_at");
  const amount = numeric(formData, "sale_amount");
  const customRate = text(formData, "commission_rate");

  if (!brandId || !/^\d{4}-\d{2}-\d{2}$/.test(soldAt) || !Number.isFinite(amount) || amount <= 0) {
    redirect("/sales?error=invalid");
  }

  const { supabase, user } = await getSupabaseUser();
  const { data: brand } = await supabase.from("brands").select("id, default_commission").eq("id", brandId).maybeSingle();
  if (!brand) redirect("/sales?error=brand");

  const month = monthStart(soldAt);
  const { data: existing } = await supabase
    .from("brand_commissions")
    .select("commission_rate")
    .eq("brand_id", brandId)
    .eq("month_start", month)
    .maybeSingle();

  let rate = existing?.commission_rate;
  if (rate === undefined || rate === null) {
    rate = brand.default_commission;
    await supabase.from("brand_commissions").upsert({
      brand_id: brandId,
      month_start: month,
      commission_rate: rate,
    }, { onConflict: "brand_id,month_start", ignoreDuplicates: true });
    const { data: initialized } = await supabase
      .from("brand_commissions")
      .select("commission_rate")
      .eq("brand_id", brandId)
      .eq("month_start", month)
      .single();
    if (initialized) rate = initialized.commission_rate;
  }

  if (customRate !== "") {
    const parsedRate = Number(customRate.replace(",", "."));
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100) redirect("/sales?error=invalid");
    rate = parsedRate;
  }

  const { error } = await supabase.from("sales").insert({
    user_id: user.id,
    brand_id: brandId,
    sale_amount: amount,
    commission_rate: rate,
    sold_at: soldAt,
  });

  if (error) redirect("/sales?error=save");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  redirect("/sales?success=created");
}

export async function createPublication(formData: FormData) {
  const brandId = text(formData, "brand_id");
  const format = text(formData, "format");
  const platform = text(formData, "platform");
  const publishedAt = text(formData, "published_at");

  if (!brandId || !["story", "reel"].includes(format) || !["instagram", "tiktok"].includes(platform) || !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
    redirect("/publications?error=invalid");
  }

  const { supabase, user } = await getSupabaseUser();
  const { data: brand } = await supabase.from("brands").select("id").eq("id", brandId).maybeSingle();
  if (!brand) redirect("/publications?error=brand");

  const { error } = await supabase.from("publications").insert({
    user_id: user.id,
    brand_id: brandId,
    format,
    platform,
    published_at: publishedAt,
  });

  if (error) redirect("/publications?error=save");
  revalidatePath("/publications");
  revalidatePath("/dashboard");
  redirect("/publications?success=created");
}
