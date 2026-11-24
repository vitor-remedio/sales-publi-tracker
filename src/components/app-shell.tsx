import Link from "next/link";
import { BarChart3, Building2, Clapperboard, ReceiptText } from "lucide-react";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

const navigation = [
  { href: "/dashboard", label: "Visão geral", icon: BarChart3 },
  { href: "/brands", label: "Marcas", icon: Building2 },
  { href: "/sales", label: "Vendas", icon: ReceiptText },
  { href: "/publications", label: "Publicações", icon: Clapperboard },
];

export function AppShell({ children, active }: { children: React.ReactNode; active: string }) {
  return (
    <div className="min-h-screen bg-[#f5f4f0] text-[#202720] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-[#e4e3dc] bg-[#202c25] px-5 py-5 text-white lg:flex lg:min-h-screen lg:flex-col lg:border-b-0 lg:px-6 lg:py-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d7b76d] text-lg font-semibold text-[#202c25]">S</span>
          <span><span className="block text-sm font-semibold tracking-wide">Sales &amp; Publi</span><span className="block text-xs text-white/55">TRACKER</span></span>
        </Link>
        <p className="mb-3 mt-10 hidden text-[10px] font-semibold uppercase tracking-[.2em] text-white/40 lg:block">Workspace</p>
        <nav className="mt-6 flex gap-2 overflow-x-auto lg:mt-0 lg:flex-col">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active === href ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/8 hover:text-white"}`}>
              <Icon size={17} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 pt-5 lg:block"><SignOutButton /></div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-[#e4e3dc] bg-white/70 px-5 py-4 sm:px-8">
          <p className="text-xs font-medium text-[#7d867d]">PAINEL DE CONTROLE <span className="mx-2 text-[#c8c9c2]">/</span> {navigation.find((item) => item.href === active)?.label.toUpperCase()}</p>
          <div className="lg:hidden"><SignOutButton /></div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
