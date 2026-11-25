function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e7e7e0] ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-3 h-9 w-44" />
        </div>
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
      </section>
      <section className="rounded-2xl border border-[#e4e4dd] bg-white p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-3 w-64" />
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e4e4dd] bg-white p-5"><Skeleton className="h-5 w-44" /><Skeleton className="mt-6 h-64 w-full rounded-xl" /></div>
        <div className="rounded-2xl border border-[#e4e4dd] bg-white p-5"><Skeleton className="h-5 w-44" /><Skeleton className="mt-6 h-64 w-full rounded-xl" /></div>
      </section>
    </div>
  );
}
