import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { DashboardFilters } from "./dashboard-filters";
import { BrandBars, EffortReturnChart, PublicationMix, RevenueChart } from "./dashboard-charts";

type Period = "today" | "week" | "month" | "30d" | "custom" | "all";

function dateInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function startOfWeek(date: string) {
  const d = new Date(date + "T12:00:00");
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function subtractDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function periodLabel(period: Period, from: string | null, to: string) {
  if (period === "today") return "Hoje";
  if (period === "week") return "Esta semana";
  if (period === "month") return "Este mês";
  if (period === "30d") return "Últimos 30 dias";
  if (period === "custom" && from) {
    return `${new Date(from + "T12:00:00").toLocaleDateString("pt-BR")} a ${new Date(to + "T12:00:00").toLocaleDateString("pt-BR")}`;
  }
  return "Todo o período";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; brands?: string; from?: string; to?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const db = await createClient();
  const today = dateInSaoPaulo();
  const period = (["today", "week", "month", "30d", "custom", "all"].includes(params.period || "")
    ? params.period
    : "month") as Period;

  let from: string | null = null;
  let to = today;

  if (period === "today") from = today;
  if (period === "week") from = startOfWeek(today);
  if (period === "month") from = `${today.slice(0, 7)}-01`;
  if (period === "30d") from = subtractDays(today, 29);
  if (period === "custom" && params.from && params.to && params.from <= params.to) {
    from = params.from;
    to = params.to;
  }
  if (period === "custom" && !from) {
    from = `${today.slice(0, 7)}-01`;
  }

  const { data: brands, error: brandsError } = await db
    .from("brands")
    .select("id,name")
    .order("name");

  if (brandsError) throw new Error("Não foi possível carregar as marcas.");

  const selectedBrandIds = (params.brands || "")
    .split(",")
    .filter((id) => brands.some((brand) => brand.id === id));

  let salesQuery = db
    .from("sales")
    .select("brand_id,sale_amount,commission_amount,sold_at,is_return")
    .eq("is_return", false);

  let postsQuery = db
    .from("publications")
    .select("brand_id,format,platform,published_at");

  if (from) {
    salesQuery = salesQuery.gte("sold_at", from).lte("sold_at", to);
    postsQuery = postsQuery.gte("published_at", from).lte("published_at", to);
  } else {
    salesQuery = salesQuery.lte("sold_at", to);
    postsQuery = postsQuery.lte("published_at", to);
  }

  if (selectedBrandIds.length) {
    salesQuery = salesQuery.in("brand_id", selectedBrandIds);
    postsQuery = postsQuery.in("brand_id", selectedBrandIds);
  }

  const [{ data: sales, error: salesError }, { data: posts, error: postsError }] = await Promise.all([
    salesQuery,
    postsQuery,
  ]);

  if (salesError || postsError) {
    throw new Error("Não foi possível carregar os dados do dashboard.");
  }

  const validSales = sales ?? [];
  const publications = posts ?? [];
  const totalSales = validSales.reduce((sum, sale) => sum + Number(sale.sale_amount), 0);
  const totalCommission = validSales.reduce((sum, sale) => sum + Number(sale.commission_amount), 0);
  const publicationCount = publications.length;
  const returnPerPublication = publicationCount ? totalCommission / publicationCount : 0;

  const brandData = brands
    .filter((brand) => !selectedBrandIds.length || selectedBrandIds.includes(brand.id))
    .map((brand) => {
      const brandSales = validSales.filter((sale) => sale.brand_id === brand.id);
      const brandPosts = publications.filter((post) => post.brand_id === brand.id);
      return {
        name: brand.name,
        commission: brandSales.reduce((sum, sale) => sum + Number(sale.commission_amount), 0),
        publications: brandPosts.length,
      };
    })
    .filter((brand) => brand.commission > 0 || brand.publications > 0);

  const salesByDate = new Map<string, number>();
  validSales.forEach((sale) => {
    salesByDate.set(sale.sold_at, (salesByDate.get(sale.sold_at) || 0) + Number(sale.sale_amount));
  });

  const revenuePoints = Array.from(salesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value,
    }));

  const stories = publications.filter((post) => post.format === "story").length;
  const reels = publications.filter((post) => post.format === "reel").length;
  const instagram = publications.filter((post) => post.platform === "instagram").length;
  const tiktok = publications.filter((post) => post.platform === "tiktok").length;
  const activeBrandCount = selectedBrandIds.length || brands.length;
  const selectedLabel = selectedBrandIds.length === 1
    ? brands.find((brand) => brand.id === selectedBrandIds[0])?.name
    : selectedBrandIds.length
      ? `${selectedBrandIds.length} marcas`
      : "Todas as marcas";

  return (
    <AppShell active="/dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#7b857c]">Seu desempenho</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Visão geral</h1>
          <p className="mt-2 text-sm text-[#7b857c]">
            {periodLabel(period, from, to)} · {selectedLabel}
          </p>
        </div>
        <div className="rounded-full border border-[#dedfd7] bg-white px-3 py-1.5 text-xs text-[#687268]">
          {activeBrandCount} {activeBrandCount === 1 ? "marca" : "marcas"} analisada{activeBrandCount === 1 ? "" : "s"}
        </div>
      </div>

      <DashboardFilters brands={brands} />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Vendas", money(totalSales), `${validSales.length} registros válidos`],
          ["Comissões", money(totalCommission), "Retorno financeiro das vendas"],
          ["Publicações", String(publicationCount), `${stories} stories · ${reels} reels`],
          ["Retorno / publi", money(returnPerPublication), publicationCount ? "Comissão média por publicação" : "Sem publicações no período"],
        ].map(([label, value, description]) => (
          <article key={label} className="rounded-2xl border border-[#e4e4dd] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#7b857c]">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-[#9a9f98]">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-[#e4e4dd] bg-white p-5 shadow-sm">
        <RevenueChart points={revenuePoints} />
      </section>

      <section className="mt-6 rounded-2xl border border-[#e4e4dd] bg-white p-5 shadow-sm">
        <BrandBars data={brandData} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_.8fr]">
        <article className="rounded-2xl border border-[#e4e4dd] bg-white p-5 shadow-sm">
          <EffortReturnChart data={brandData} />
        </article>
        <article className="rounded-2xl border border-[#e4e4dd] bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold">Mix de publicações</h3>
            <p className="mt-1 text-xs text-[#8a928a]">Formato e plataforma no período</p>
          </div>
          <PublicationMix stories={stories} reels={reels} instagram={instagram} tiktok={tiktok} />
        </article>
      </section>
    </AppShell>
  );
}
