import { connection } from "next/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PaginatedTableBody } from "@/components/paginated-table-body";
import { SaleForm } from "./sale-form";
import { deleteSale, setSaleReturn, updateSale } from "@/app/actions";
const br=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
export default async function SalesPage({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}){
 const p=await searchParams;
 await connection();
 const db=await createClient();
 const [{data:brands},{data:sales},{data:rates}]=await Promise.all([
  db.from("brands").select("id,name,default_commission").order("name"),
  db.from("sales").select("id,brand_id,sale_amount,commission_rate,commission_amount,sold_at,is_return,brands(name)").order("sold_at",{ascending:false}).limit(200),
  db.from("brand_commissions").select("brand_id,month_start,commission_rate")
 ]);
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(new Date());
 const brandName=(id:string)=>brands?.find(b=>b.id===id)?.name??"Marca";
 return <AppShell active="/sales">
  <div className="mb-8"><p className="text-sm text-[#7b857c]">Acompanhe suas conversões</p><h1 className="mt-1 text-3xl font-semibold">Vendas</h1><p className="mt-2 text-sm text-[#7b857c]">Edite registros, sinalize devoluções e acompanhe as comissões.</p></div>
  {p.success&&<p role="status" className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{p.success==="deleted"?"Venda removida.":p.success==="updated"?"Venda atualizada.":"Venda registrada com sucesso."}</p>}
  {p.error&&<p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir a operação. Confira os dados e tente novamente.</p>}
  <section className="mb-8 rounded-2xl border border-[#e4e4dd] bg-white p-5"><h2 className="font-semibold">Registrar venda</h2><p className="mt-1 text-xs text-[#8a928a]">A comissão é preenchida pela taxa vigente no mês da venda e pode ser editada.</p>
   {(brands??[]).length?<SaleForm brands={brands??[]} rates={rates??[]} today={today}/>:<p className="mt-4 text-sm text-[#737d73]">Cadastre uma marca antes. <a className="underline" href="/brands">Ir para marcas</a></p>}
  </section>
  <section className="overflow-hidden rounded-2xl border border-[#e4e4dd] bg-white">
   <div className="border-b border-[#eeeee9] px-5 py-5"><h2 className="font-semibold">Gerenciamento de vendas</h2><p className="mt-1 text-xs text-[#8a928a]">Últimas 200 vendas. Devoluções ficam no histórico, mas não entram nos totais.</p></div>
   {(sales??[]).length?<div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-[#fafaf7] text-xs text-[#8a928a]"><tr>{["Data","Marca","Valor","Taxa","Comissão","Status","Ações"].map(x=><th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead><PaginatedTableBody colSpan={7} rows={(sales??[]).map(s=><tr key={s.id} className={`border-t border-[#f0f0eb] ${s.is_return?"bg-amber-50/50":""}`}>
     <td className="px-4 py-4">{new Date(s.sold_at+"T12:00:00").toLocaleDateString("pt-BR")}</td>
     <td className="px-4 py-4 font-medium">{(s.brands as unknown as {name:string}|null)?.name??brandName(s.brand_id)}</td>
     <td className="px-4 py-4">{br(Number(s.sale_amount))}</td><td className="px-4 py-4">{Number(s.commission_rate)}%</td><td className="px-4 py-4 font-medium">{br(Number(s.commission_amount))}</td>
     <td className="px-4 py-4"><span className={s.is_return?"rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-800":"text-xs text-emerald-700"}>{s.is_return?"Devolução":"Válida"}</span></td>
     <td className="px-4 py-3"><div className="flex items-center gap-2">
      <details className="relative"><summary className="cursor-pointer rounded-lg border border-[#dedfd7] px-3 py-2 text-xs">Editar</summary><div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-[#dedfd7] bg-white p-4 shadow-xl"><form action={updateSale} className="space-y-3"><input type="hidden" name="sale_id" value={s.id}/><label className="block text-xs">Marca<select name="brand_id" defaultValue={s.brand_id} required className="mt-1 w-full rounded-lg border p-2">{(brands??[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="block text-xs">Data<input name="sold_at" type="date" defaultValue={s.sold_at} required className="mt-1 w-full rounded-lg border p-2"/></label><label className="block text-xs">Valor da venda (R$)<input name="sale_amount" type="number" min="0.01" step="0.01" defaultValue={Number(s.sale_amount)} required className="mt-1 w-full rounded-lg border p-2"/></label><label className="block text-xs">Comissão (%)<input name="commission_rate" type="number" min="0" max="100" step="0.01" defaultValue={Number(s.commission_rate)} required className="mt-1 w-full rounded-lg border p-2"/></label><button className="w-full rounded-lg bg-[#26372c] px-3 py-2 text-xs text-white">Salvar alterações</button></form></div></details>
      <form action={setSaleReturn}><input type="hidden" name="sale_id" value={s.id}/><input type="hidden" name="is_return" value={s.is_return?"false":"true"}/><button className="rounded-lg border border-[#dedfd7] px-3 py-2 text-xs">{s.is_return?"Desfazer devolução":"Marcar devolução"}</button></form>
      <form action={deleteSale}><input type="hidden" name="sale_id" value={s.id}/><ConfirmDeleteButton>Excluir</ConfirmDeleteButton></form>
     </div></td>
    </tr>)} />
   </table></div>:<p className="px-5 py-12 text-center text-sm text-[#8a928a]">Nenhuma venda registrada ainda.</p>}
  </section>
 </AppShell>;
}