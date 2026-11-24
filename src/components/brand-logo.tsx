"use client";

type BrandLogoProps = {
  variant?: "light" | "dark";
  size?: "compact" | "regular";
};

export function BrandLogo({ variant = "light", size = "regular" }: BrandLogoProps) {
  const isLight = variant === "light";
  const markSize = size === "compact" ? "h-9 w-9" : "h-11 w-11";

  return (
    <span className="inline-flex items-center gap-3">
      <span className={`grid ${markSize} shrink-0 place-items-center rounded-xl bg-[#d8b56a] shadow-sm`}>
        <svg viewBox="0 0 40 40" aria-hidden="true" className="h-[72%] w-[72%]" fill="none">
          <path d="M7.5 29.5 17.8 9.5 25 29.5" stroke="#203027" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.2 21.5h9.2" stroke="#203027" strokeWidth="2.6" strokeLinecap="round" />
          <path d="m21.8 15.2 5.2 10.9 5.5-10.9" stroke="#203027" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className={`block text-[15px] font-semibold leading-tight tracking-[-0.035em] ${isLight ? "text-white" : "text-[#202c25]"}`}>
          Auriventa
        </span>
        <span className={`mt-1 block text-[10px] font-medium tracking-[0.12em] ${isLight ? "text-white/55" : "text-[#858b82]"}`}>
          BY REMEDIO LABS
        </span>
      </span>
    </span>
  );
}
