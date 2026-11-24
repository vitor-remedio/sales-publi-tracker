import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : "Conta autenticada";

  return (
    <main className="min-h-screen bg-[#f5f3ef] px-6 py-10 text-[#20221f]">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-[#deddd7] pb-6">
          <div>
            <p className="text-sm font-semibold tracking-wide">Sales &amp; Publi</p>
            <p className="text-xs text-[#737873]">Tracker</p>
          </div>
          <SignOutButton />
        </header>

        <section className="py-16">
          <p className="text-sm font-medium text-[#66736a]">Área de trabalho</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Bem-vindo ao Sales &amp; Publi Tracker.
          </h1>
          <p className="mt-4 text-[#737873]">
            Sua autenticação está funcionando. Esta será a base do seu painel de campanhas.
          </p>
          <div className="mt-10 rounded-2xl border border-[#e2e0d9] bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b918d]">
              Conta conectada
            </p>
            <p className="mt-2 text-base font-medium">{email}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
