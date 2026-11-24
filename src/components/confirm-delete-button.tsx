"use client";
export function ConfirmDeleteButton({children}:{children:React.ReactNode}){
 return <button type="submit" onClick={event=>{if(!window.confirm("Tem certeza de que deseja excluir este registro? Esta ação não pode ser desfeita.")) event.preventDefault();}} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700">{children}</button>;
}