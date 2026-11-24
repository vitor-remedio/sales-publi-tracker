import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { createBrand, updateMonthlyCommission } from "@/app/actions";

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const db = await createClient();
  const [{ data: brands }, { data: rates }] = await Promise.all([
    db.from("brands").select("id,name,coupon,url,default_commission").order("name"),
    db.from("brand_commissions").select("brand_id,commission_rate").eq("month_start", new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()).slice(0, 7) + "-01"),
  ]);
  const month = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()).slice(0, 7);
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());
  return <AppShell active="/brands">
    <div className="mb-8"><p className="text-sm text-[#7b857c]">Parcerias e programas de afiliados</p><h1 className="mt-1 text-3xl font-semibold">Marcas</h1><p className="mt-2 text-sm text-[#7b857c]">Cadastre suas marcas e gerencie a comissão vigente.</p></div>
    {params.success && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{params.success === "created" ? "Marca cadastrada." : "Comissão atualizada."}</p>}
    {params.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Não foi possível salvar. Confira os dados.</p>}
    <section className="mb-8 rounded-2xl border border-[#e4e4dd] bg-white p-5"><h2 className="font-semibold">Adicionar marca</h2><p className="mt-1 text-xs text-[#8a928a]">A taxa padrão será usada como base em cada novo mês.</p>
      <form action={createBrand} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium">Nome da marca<input name="name" required placeholder="Pose" className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] px-3 text-sm font-normal"/></label>
        <label className="text-sm font-medium">Cupom<input name="coupon" required placeholder="VITOR10" className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] px-3 text-sm font-normal"/></label>
        <label className="text-sm font-medium">URL<input name="url" type="url" required placeholder="https://marca.com" className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] px-3 text-sm font-normal"/></label>
        <label className="text-sm font-medium">Comissão padrão (%)<input name="default_commission" type="number" min="0" max="100" step="0.01" required placeholder="12" className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] px-3 text-sm font-normal"/></label>
        <div className="sm:col-span-2 xl:col-span-4"><button className="rounded-xl bg-[#26372c] px-5 py-3 text-sm font-medium text-white">Salvar marca</button></div>
      </form>
    </section>
    <div className="mb-4"><h2 className="font-semibold">Suas marcas</h2><p className="mt-1 text-xs text-[#8a928a]">Comissão vigente em {monthName}</p></div>
    <div className="grid gap-4 xl:grid-cols-2">{(brands ?? []).map((b) => { const rate = (rates ?? []).find((x) => x.brand_id === b.id)?.commission_rate ?? b.default_commission; return <article key={b.id} className="rounded-2xl border border-[#e4e4dd] bg-white p-5"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{b.name}</h3><p className="mt-1 text-xs text-[#8a928a]">Cupom: {b.coupon}</p></div><a href={b.url} target="_blank" rel="noreferrer" className="text-xs text-[#657b68]">Abrir site ↗</a></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f7f7f3] p-3"><p className="text-xs text-[#8a928a]">Comissão padrão</p><p className="mt-1 text-lg font-semibold">{Number(b.default_commission)}%</p></div><div className="rounded-xl bg-[#f7f7f3] p-3"><p className="text-xs text-[#8a928a]">Vigente no mês</p><p className="mt-1 text-lg font-semibold">{Number(rate)}%</p></div></div><form action={updateMonthlyCommission} className="mt-4 space-y-3 border-t border-[#efefe9] pt-4"><input type="hidden" name="brand_id" value={b.id}/><input type="hidden" name="month" value={month}/><label className="block text-xs font-medium text-[#687268]">Nova comissão (%)<input name="commission_rate" type="number" min="0" max="100" step="0.01" required defaultValue={Number(rate)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dedfd7] px-3 text-sm text-[#202720]"/></label>
<fieldset className="space-y-2"><legend className="text-xs font-medium text-[#687268]">Aplicar alteração a</legend>
<label className="flex items-start gap-2 text-xs text-[#4e594f]"><input type="radio" name="commission_scope" value="future" defaultChecked className="mt-0.5"/> <span><strong>Apenas vendas futuras</strong><span className="block text-[#8a928a]">Mantém as comissões das vendas já registradas.</span></span></label>
<label className="flex items-start gap-2 text-xs text-[#4e594f]"><input type="radio" name="commission_scope" value="all" className="mt-0.5"/> <span><strong>Todas as vendas do mês</strong><span className="block text-[#8a928a]">Recalcula também as vendas já registradas neste mês.</span></span></label>
</fieldset><button className="h-10 rounded-lg border border-[#d8ddd6] px-4 text-sm">Atualizar comissão</button></form></article>})}</div>
    {!(brands ?? []).length && <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[#8a928a]">Suas marcas aparecerão aqui.</div>}
  </AppShell>;
}