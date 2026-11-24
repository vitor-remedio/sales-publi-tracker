import { connection } from "next/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { createPublication, deletePublication } from "@/app/actions";
type Period="all"|"month"|"week";
function dateInSaoPaulo(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(new Date());}
function startOfWeek(date:string){const d=new Date(date+"T12:00:00");const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10);}
export default async function PublicationsPage({searchParams}:{searchParams:Promise<{success?:string;error?:string;period?:string}>}){
 const p=await searchParams;await connection();const period:Period=p.period==="month"||p.period==="week"?p.period:"all";const today=dateInSaoPaulo();const monthStart=`${today.slice(0,7)}-01`;const weekStart=startOfWeek(today);
 const db=await createClient();const {data:brands}=await db.from("brands").select("id,name,created_at").order("name");
 const {data:firstPage,error:firstError}=await db.from("publications").select("id,brand_id,format,platform,published_at,brands(name)").order("published_at",{ascending:false}).range(0,999);
 if(firstError) throw new Error("Não foi possível carregar as publicações.");
 const posts=[...(firstPage??[])];
 for(let offset=1000;(firstPage?.length??0)===1000;offset+=1000){
  const {data:nextPage,error}=await db.from("publications").select("id,brand_id,format,platform,published_at,brands(name)").order("published_at",{ascending:false}).range(offset,offset+999);
  if(error) throw new Error("Não foi possível carregar todas as publicações.");
  posts.push(...(nextPage??[]));
  if((nextPage?.length??0)<1000) break;
 }
 const filtered=(posts??[]).filter(post=>{
  const brand=brands?.find(b=>b.id===post.brand_id);const start=period==="month"?monthStart:period==="week"?weekStart:(brand?.created_at?.slice(0,10)??"0000-01-01");
  return post.published_at>=start&&post.published_at<=today;
 });
 const storyCount=filtered.filter(x=>x.format==="story").length;const reelCount=filtered.filter(x=>x.format==="reel").length;
 const periodLabel=period==="all"?"Desde o início de cada parceria":period==="month"?"Neste mês":"Nesta semana";
 return <AppShell active="/publications">
  <div className="mb-8"><p className="text-sm text-[#7b857c]">Seu calendário de conteúdo</p><h1 className="mt-1 text-3xl font-semibold">Publicações</h1><p className="mt-2 text-sm text-[#7b857c]">Acompanhe stories e reels publicados por marca.</p></div>
  {p.success&&<p role="status" className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{p.success==="deleted"?"Publicação removida.":"Publicação registrada com sucesso."}</p>}
  {p.error&&<p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir a operação. Confira os dados.</p>}
  <section className="mb-8 rounded-2xl border border-[#e4e4dd] bg-white p-5"><h2 className="font-semibold">Registrar publicação</h2>
   {(brands??[]).length?<form action={createPublication} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <label className="text-sm font-medium">Marca<select name="brand_id" required className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] bg-white px-3 text-sm"><option value="">Selecione</option>{(brands??[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <label className="text-sm font-medium">Formato<select name="format" className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] bg-white px-3 text-sm"><option value="story">Story</option><option value="reel">Reel</option></select></label>
    <label className="text-sm font-medium">Plataforma<select name="platform" className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] bg-white px-3 text-sm"><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select></label>
    <label className="text-sm font-medium">Data da publicação<input name="published_at" type="date" required defaultValue={today} className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] px-3 text-sm"/></label>
    <div className="sm:col-span-2 xl:col-span-4"><button className="rounded-xl bg-[#26372c] px-5 py-3 text-sm font-medium text-white">Salvar publicação</button></div>
   </form>:<p className="mt-4 text-sm text-[#737d73]">Cadastre uma marca antes. <a className="underline" href="/brands">Ir para marcas</a></p>}
  </section>
  <section className="mb-8 rounded-2xl border border-[#e4e4dd] bg-white p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Resumo de publicações</h2><p className="mt-1 text-xs text-[#8a928a]">{periodLabel}</p></div>
    <nav className="flex rounded-xl border border-[#dedfd7] p-1 text-xs">{([{id:"all",label:"Desde o início"},{id:"month",label:"Mês"},{id:"week",label:"Semana"}] as const).map(x=><a key={x.id} href={`/publications?period=${x.id}`} className={`rounded-lg px-3 py-2 ${period===x.id?"bg-[#26372c] text-white":"text-[#667166]"}`}>{x.label}</a>)}</nav>
   </div>
   <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#f7f7f3] p-4"><p className="text-xs text-[#8a928a]">Total de publicações</p><p className="mt-1 text-2xl font-semibold">{filtered.length}</p></div><div className="rounded-xl bg-[#f7f7f3] p-4"><p className="text-xs text-[#8a928a]">Stories</p><p className="mt-1 text-2xl font-semibold">{storyCount}</p></div><div className="rounded-xl bg-[#f7f7f3] p-4"><p className="text-xs text-[#8a928a]">Reels</p><p className="mt-1 text-2xl font-semibold">{reelCount}</p></div></div>
   <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead className="text-xs text-[#8a928a]"><tr>{["Marca","Stories","Reels","Total"].map(x=><th key={x} className="border-b px-3 py-3 font-medium">{x}</th>)}</tr></thead><tbody>{(brands??[]).map(b=>{const items=filtered.filter(x=>x.brand_id===b.id);const stories=items.filter(x=>x.format==="story").length;const reels=items.filter(x=>x.format==="reel").length;return <tr key={b.id} className="border-b border-[#f0f0eb]"><td className="px-3 py-3 font-medium">{b.name}</td><td className="px-3 py-3">{stories}</td><td className="px-3 py-3">{reels}</td><td className="px-3 py-3 font-semibold">{items.length}</td></tr>})}</tbody></table></div>
  </section>
  <section className="overflow-hidden rounded-2xl border border-[#e4e4dd] bg-white"><div className="border-b border-[#eeeee9] px-5 py-5"><h2 className="font-semibold">Gerenciamento de publicações</h2><p className="mt-1 text-xs text-[#8a928a]">Histórico completo de publicações</p></div>
   {(posts??[]).length?<div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-[#fafaf7] text-xs text-[#8a928a]"><tr>{["Data","Marca","Formato","Plataforma","Ações"].map(x=><th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead><tbody>{(posts??[]).map(x=><tr key={x.id} className="border-t border-[#f0f0eb]"><td className="px-4 py-4">{new Date(x.published_at+"T12:00:00").toLocaleDateString("pt-BR")}</td><td className="px-4 py-4 font-medium">{(x.brands as unknown as {name:string}|null)?.name??"Marca"}</td><td className="px-4 py-4">{x.format==="story"?"Story":"Reel"}</td><td className="px-4 py-4">{x.platform==="instagram"?"Instagram":"TikTok"}</td><td className="px-4 py-3"><form action={deletePublication}><input type="hidden" name="publication_id" value={x.id}/><ConfirmDeleteButton>Excluir</ConfirmDeleteButton></form></td></tr>)}</tbody></table></div>:<p className="px-5 py-12 text-center text-sm text-[#8a928a]">Nenhuma publicação registrada ainda.</p>}
  </section>
 </AppShell>;
}