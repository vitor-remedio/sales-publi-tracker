import { AppShell } from "@/components/app-shell";

type RouteLoadingProps = {
  active: string;
  titleWidth?: string;
  layout?: "table" | "cards";
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e7e7e0] ${className}`} />;
}

export function RouteLoading({ active, titleWidth = "w-40", layout = "table" }: RouteLoadingProps) {
  return (
    <AppShell active={active}>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className={`mt-3 h-9 ${titleWidth}`} />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        <div className="rounded-2xl border border-[#e4e4dd] bg-white p-5 shadow-sm">
          <Skeleton className="h-10 w-full rounded-xl" />
          {layout === "table" ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="grid grid-cols-4 gap-4">
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl" />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
