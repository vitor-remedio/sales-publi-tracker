"use client";
import { useMemo, useState } from "react";
import { createSale } from "@/app/actions";
type Brand={id:string;name:string;default_commission:number};
type Rate={brand_id:string;month_start:string;commission_rate:number};
export function SaleForm({brands,rates,today}:{brands:Brand[];rates:Rate[];today:string}){
 const [brandId,setBrandId]=useState("");const [soldAt,setSoldAt]=useState(today);const [rate,setRate]=useState("");
 const suggested=useMemo(()=>{if(!brandId)return "";const month=soldAt.slice(0,7)+"-01";const current=rates.find(x=>x.brand_id===brandId&&x.month_start===month);const brand=brands.find(x=>x.id===brandId);return String(current?.commission_rate??brand?.default_commission??"");},[brandId,soldAt,rates,brands]);
 return <form action={createSale} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 <label className="text-sm font-medium">Marca<select name="brand_id" required value={brandId} onChange={e=>{setBrandId(e.target.value);setRate("");}} className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] bg-white px-3 text-sm"><option value="">Selecione</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
 <label className="text-sm font-medium">Valor da venda (R$)<input name="sale_amount" type="number" min="0.01" step="0.01" required className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] px-3 text-sm"/></label>
 <label className="text-sm font-medium">Comissão (%)<input name="commission_rate" type="number" min="0" max="100" step="0.01" value={rate===""?suggested:rate} onChange={e=>setRate(e.target.value)} required={Boolean(brandId)} className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] px-3 text-sm"/><span className="mt-1 block text-[11px] font-normal text-[#969d95]">Preenchida pela taxa vigente. Você pode editar.</span></label>
 <label className="text-sm font-medium">Data da venda<input name="sold_at" type="date" required value={soldAt} onChange={e=>{setSoldAt(e.target.value);setRate("");}} className="mt-2 h-11 w-full rounded-xl border border-[#dedfd7] px-3 text-sm"/></label>
 <div className="sm:col-span-2 xl:col-span-4"><button className="rounded-xl bg-[#26372c] px-5 py-3 text-sm font-medium text-white">Salvar venda</button></div>
 </form>;
}