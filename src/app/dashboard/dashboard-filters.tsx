"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, SlidersHorizontal } from "lucide-react";

type Period = "today" | "week" | "month" | "30d" | "custom" | "all";

type Brand = {
  id: string;
  name: string;
};

const periods: { id: Period; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "30d", label: "30 dias" },
  { id: "custom", label: "Período personalizado" },
  { id: "all", label: "Todo período" },
];

function valuesFromParam(value: string | null) {
  return value ? value.split(",").filter(Boolean) : [];
}

export function DashboardFilters({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = (searchParams.get("period") as Period) || "month";
  const selectedBrands = valuesFromParam(searchParams.get("brands"));
  const customFrom = searchParams.get("from") || "";
  const customTo = searchParams.get("to") || "";

  const [brandDraft, setBrandDraft] = useState<string[]>(selectedBrands);
  const [from, setFrom] = useState(customFrom);
  const [to, setTo] = useState(customTo);

  const selectedLabel = useMemo(() => {
    if (!brandDraft.length || brandDraft.length === brands.length) return "Todas as marcas";
    if (brandDraft.length === 1) {
      return brands.find((brand) => brand.id === brandDraft[0])?.name || "1 marca";
    }
    return `${brandDraft.length} marcas`;
  }, [brandDraft, brands]);

  function navigate(next: {
    period?: Period;
    brands?: string[];
    from?: string;
    to?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.period) params.set("period", next.period);

    if (next.brands && next.brands.length && next.brands.length < brands.length) {
      params.set("brands", next.brands.join(","));
    } else {
      params.delete("brands");
    }

    if (next.period === "custom") {
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
    } else {
      params.delete("from");
      params.delete("to");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleBrand(id: string) {
    setBrandDraft((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function applyBrands() {
    navigate({ brands: brandDraft, period });
  }

  function applyCustomPeriod() {
    if (!from || !to || from > to) return;
    navigate({ period: "custom", brands: brandDraft, from, to });
  }

  return (
    <section className="rounded-2xl border border-[#e4e4dd] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2 px-2 text-sm font-medium text-[#536057]">
          <SlidersHorizontal size={16} />
          <span>Período</span>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl bg-[#f7f7f3] p-1">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate({ period: item.id, brands: brandDraft })}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                period === item.id
                  ? "bg-[#26372c] text-white shadow-sm"
                  : "text-[#667166] hover:bg-white hover:text-[#26372c]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-[#dedfd7] px-3 py-2.5 text-sm font-medium text-[#536057] hover:bg-[#fafaf7]">
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown size={15} />
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-[#dedfd7] bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Marcas</p>
              <button
                type="button"
                onClick={() => setBrandDraft([])}
                className="text-xs text-[#647267] hover:underline"
              >
                Limpar
              </button>
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {brands.map((brand) => (
                <label
                  key={brand.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[#f7f7f3]"
                >
                  <input
                    type="checkbox"
                    checked={brandDraft.includes(brand.id)}
                    onChange={() => toggleBrand(brand.id)}
                    className="h-4 w-4 accent-[#26372c]"
                  />
                  {brand.name}
                </label>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-4 text-[#8a928a]">
              Se nenhuma marca for selecionada, todas entram no painel.
            </p>
            <button
              type="button"
              onClick={applyBrands}
              className="mt-3 w-full rounded-xl bg-[#26372c] px-3 py-2.5 text-xs font-medium text-white"
            >
              Aplicar marcas
            </button>
          </div>
        </details>
      </div>

      {period === "custom" && (
        <div className="mt-3 flex flex-col gap-3 border-t border-[#eeeee9] pt-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-medium text-[#657066]">
            <span className="mb-1.5 flex items-center gap-1.5"><CalendarDays size={14} /> De</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#dedfd7] bg-white px-3 text-sm"
            />
          </label>
          <label className="flex-1 text-xs font-medium text-[#657066]">
            <span className="mb-1.5 flex items-center gap-1.5"><CalendarDays size={14} /> Até</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#dedfd7] bg-white px-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomPeriod}
            disabled={!from || !to || from > to}
            className="h-10 rounded-xl bg-[#26372c] px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Aplicar período
          </button>
        </div>
      )}
    </section>
  );
}
