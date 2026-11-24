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
function currentBrazilDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
function monthStart(date: string) { return `${date.slice(0, 7)}-01`; }
function nextMonth(date: string) {
  const [year, month] = date.slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}
async function getSupabaseUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}
function refreshTracker() {
  revalidatePath("/brands"); revalidatePath("/sales"); revalidatePath("/publications"); revalidatePath("/dashboard");
}

export async function createBrand(formData: FormData) {
  const name=text(formData,"name"), coupon=text(formData,"coupon"), url=text(formData,"url");
  const defaultCommission=numeric(formData,"default_commission");
  if(!name||!coupon||!url||text(formData,"default_commission")===""||!Number.isFinite(defaultCommission)||defaultCommission<0||defaultCommission>100) redirect("/brands?error=invalid");
  let normalizedUrl=url;
  if(!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl=`https://${normalizedUrl}`;
  try { const parsed=new URL(normalizedUrl); if(!["http:","https:"].includes(parsed.protocol)) redirect("/brands?error=url"); }
  catch { redirect("/brands?error=url"); }
  const {supabase,user}=await getSupabaseUser();
  const {data:brand,error}=await supabase.from("brands").insert({user_id:user.id,name,coupon,url:normalizedUrl,default_commission:defaultCommission}).select("id").single();
  if(error||!brand) redirect("/brands?error=save");
  const {error:rateError}=await supabase.from("brand_commissions").insert({brand_id:brand.id,month_start:monthStart(currentBrazilDate()),commission_rate:defaultCommission});
  if(rateError) redirect("/brands?error=save");
  refreshTracker(); redirect("/brands?success=created");
}

export async function updateMonthlyCommission(formData: FormData) {
  const brandId=text(formData,"brand_id"), rate=numeric(formData,"commission_rate"), month=text(formData,"month");
  const scope=text(formData,"commission_scope");
  if(!brandId||!/^\d{4}-\d{2}$/.test(month)||!Number.isFinite(rate)||rate<0||rate>100||!["future","all"].includes(scope)) redirect("/brands?error=invalid");
  const {supabase}=await getSupabaseUser();
  const {data:brand}=await supabase.from("brands").select("id").eq("id",brandId).maybeSingle();
  if(!brand) redirect("/brands?error=brand");
  const start=`${month}-01`, end=nextMonth(start);
  const {error:rateError}=await supabase.from("brand_commissions").upsert({brand_id:brandId,month_start:start,commission_rate:rate,updated_at:new Date().toISOString()},{onConflict:"brand_id,month_start"});
  if(rateError) redirect("/brands?error=save");
  if(scope==="all"){
    const {data:monthSales,error:readError}=await supabase.from("sales").select("id,sale_amount").eq("brand_id",brandId).gte("sold_at",start).lt("sold_at",end);
    if(readError) redirect("/brands?error=save");
    for(const sale of monthSales??[]){
      const cents=Math.round(Number(sale.sale_amount)*rate);
      const {error:updateError}=await supabase.from("sales").update({commission_rate:rate,commission_cents:cents}).eq("id",sale.id);
      if(updateError) redirect("/brands?error=save");
    }
  }
  refreshTracker(); redirect("/brands?success=commission");
}

export async function createSale(formData: FormData) {
  const brandId=text(formData,"brand_id"),soldAt=text(formData,"sold_at"),amount=numeric(formData,"sale_amount"),customRate=text(formData,"commission_rate");
  if(!brandId||!/^\d{4}-\d{2}-\d{2}$/.test(soldAt)||!Number.isFinite(amount)||amount<=0) redirect("/sales?error=invalid");
  const {supabase,user}=await getSupabaseUser();
  const {data:brand}=await supabase.from("brands").select("id,default_commission").eq("id",brandId).maybeSingle();
  if(!brand) redirect("/sales?error=brand");
  const month=monthStart(soldAt);
  const {data:existing}=await supabase.from("brand_commissions").select("commission_rate").eq("brand_id",brandId).eq("month_start",month).maybeSingle();
  let rate=existing?.commission_rate??brand.default_commission;
  if(customRate!==""){rate=Number(customRate.replace(",","."));if(!Number.isFinite(rate)||rate<0||rate>100)redirect("/sales?error=invalid");}
  const {error}=await supabase.from("sales").insert({user_id:user.id,brand_id:brandId,sale_amount:amount,commission_rate:rate,gross_amount_cents:Math.round(amount*100),commission_cents:Math.round(amount*rate),sold_at:soldAt,is_return:formData.get("is_return")==="on"});
  if(error) redirect("/sales?error=save");
  refreshTracker(); redirect("/sales?success=created");
}

export async function updateSale(formData: FormData) {
  const id=text(formData,"sale_id"),brandId=text(formData,"brand_id"),soldAt=text(formData,"sold_at"),amount=numeric(formData,"sale_amount"),rate=numeric(formData,"commission_rate");
  if(!id||!brandId||!/^\d{4}-\d{2}-\d{2}$/.test(soldAt)||!Number.isFinite(amount)||amount<=0||!Number.isFinite(rate)||rate<0||rate>100) redirect("/sales?error=invalid");
  const {supabase}=await getSupabaseUser();
  const {data:brand}=await supabase.from("brands").select("id").eq("id",brandId).maybeSingle();
  if(!brand) redirect("/sales?error=brand");
  const {error}=await supabase.from("sales").update({brand_id:brandId,sold_at:soldAt,sale_amount:amount,commission_rate:rate,gross_amount_cents:Math.round(amount*100),commission_cents:Math.round(amount*rate)}).eq("id",id);
  if(error) redirect("/sales?error=save");
  refreshTracker(); redirect("/sales?success=updated");
}
export async function deleteSale(formData: FormData) {
  const id=text(formData,"sale_id"); if(!id) redirect("/sales?error=invalid");
  const {supabase}=await getSupabaseUser();
  const {error}=await supabase.from("sales").delete().eq("id",id);
  if(error) redirect("/sales?error=delete");
  refreshTracker(); redirect("/sales?success=deleted");
}
export async function setSaleReturn(formData: FormData) {
  const id=text(formData,"sale_id"),isReturn=text(formData,"is_return")==="true";
  if(!id) redirect("/sales?error=invalid");
  const {supabase}=await getSupabaseUser();
  const {error}=await supabase.from("sales").update({is_return:isReturn}).eq("id",id);
  if(error) redirect("/sales?error=save");
  refreshTracker(); redirect("/sales?success=updated");
}

export async function createPublication(formData: FormData) {
  const brandId=text(formData,"brand_id"),format=text(formData,"format"),platform=text(formData,"platform"),publishedAt=text(formData,"published_at");
  if(!brandId||!["story","reel"].includes(format)||!["instagram","tiktok"].includes(platform)||!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) redirect("/publications?error=invalid");
  const {supabase,user}=await getSupabaseUser();
  const {data:brand}=await supabase.from("brands").select("id").eq("id",brandId).maybeSingle();
  if(!brand) redirect("/publications?error=brand");
  const {error}=await supabase.from("publications").insert({user_id:user.id,brand_id:brandId,format,platform,published_at:publishedAt});
  if(error) redirect("/publications?error=save");
  refreshTracker(); redirect("/publications?success=created");
}
export async function deletePublication(formData: FormData) {
  const id=text(formData,"publication_id"); if(!id) redirect("/publications?error=invalid");
  const {supabase}=await getSupabaseUser();
  const {error}=await supabase.from("publications").delete().eq("id",id);
  if(error) redirect("/publications?error=delete");
  refreshTracker(); redirect("/publications?success=deleted");
}
