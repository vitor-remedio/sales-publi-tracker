type Point = { label: string; value: number };

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

function scale(values: number[], maxHeight: number) {
  const max = Math.max(...values, 1);
  return values.map((value) => Math.max(4, (value / max) * maxHeight));
}

export function RevenueChart({ points }: { points: Point[] }) {
  if (!points.length) return <EmptyChart message="Nenhuma venda no período selecionado." />;

  const width = 760;
  const height = 250;
  const paddingX = 36;
  const paddingY = 24;
  const max = Math.max(...points.map((point) => point.value), 1);
  const coords = points.map((point, index) => ({
    ...point,
    x: paddingX + (index * (width - paddingX * 2)) / Math.max(points.length - 1, 1),
    y: height - paddingY - (point.value / max) * (height - paddingY * 2),
  }));
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Vendas ao longo do tempo</h3>
          <p className="mt-1 text-xs text-[#8a928a]">Valor vendido por dia</p>
        </div>
        <span className="text-xs text-[#69736b]">{money(Math.max(...points.map((point) => point.value)))}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Vendas ao longo do tempo">
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e5e6df" />
        <polyline points={line} fill="none" stroke="#26372c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((point) => (
          <circle key={`${point.x}-${point.label}`} cx={point.x} cy={point.y} r="4" fill="#c9a85a" />
        ))}
        {coords.filter((_, index) => index === 0 || index === coords.length - 1 || index % Math.ceil(coords.length / 5) === 0).map((point) => (
          <text key={`label-${point.x}`} x={point.x} y={height - 5} textAnchor="middle" fontSize="10" fill="#8a928a">
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function BrandBars({ data }: { data: { name: string; commission: number; publications: number }[] }) {
  if (!data.length) return <EmptyChart message="Nenhuma marca com dados no período." />;
  const commissionHeights = scale(data.map((item) => item.commission), 150);
  const publicationHeights = scale(data.map((item) => item.publications), 150);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="font-semibold">Comissão por marca</h3>
        <p className="mt-1 text-xs text-[#8a928a]">Retorno financeiro das parcerias</p>
        <div className="mt-5 flex h-52 items-end gap-3 border-b border-[#e5e6df] px-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-medium text-[#69736b]">{money(item.commission)}</span>
              <div className="w-full max-w-14 rounded-t-lg bg-[#26372c]" style={{ height: commissionHeights[index] }} title={`${item.name}: ${money(item.commission)}`} />
              <span className="max-w-20 truncate text-[10px] text-[#69736b]" title={item.name}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold">Publicações por marca</h3>
        <p className="mt-1 text-xs text-[#8a928a]">Volume de conteúdo entregue</p>
        <div className="mt-5 flex h-52 items-end gap-3 border-b border-[#e5e6df] px-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-medium text-[#69736b]">{item.publications}</span>
              <div className="w-full max-w-14 rounded-t-lg bg-[#c9a85a]" style={{ height: publicationHeights[index] }} title={`${item.name}: ${item.publications} publicações`} />
              <span className="max-w-20 truncate text-[10px] text-[#69736b]" title={item.name}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EffortReturnChart({ data }: { data: { name: string; publications: number; commission: number }[] }) {
  if (!data.some((item) => item.publications > 0 || item.commission > 0)) {
    return <EmptyChart message="Ainda não há dados suficientes para comparar esforço e retorno." />;
  }

  const width = 720;
  const height = 300;
  const pad = { left: 48, right: 24, top: 22, bottom: 42 };
  const maxX = Math.max(...data.map((item) => item.publications), 1);
  const maxY = Math.max(...data.map((item) => item.commission), 1);

  return (
    <div>
      <div className="mb-3">
        <h3 className="font-semibold">Esforço × retorno</h3>
        <p className="mt-1 text-xs text-[#8a928a]">Mais à direita = mais publicações · mais acima = mais comissão</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full" role="img" aria-label="Comparação entre publicações e comissão">
        <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#e5e6df" />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#e5e6df" />
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1={pad.left} y1={pad.top + (height - pad.top - pad.bottom) * (1 - ratio)} x2={width - pad.right} y2={pad.top + (height - pad.top - pad.bottom) * (1 - ratio)} stroke="#f0f0eb" />
        ))}
        <text x={width / 2} y={height - 12} textAnchor="middle" fontSize="11" fill="#8a928a">Publicações</text>
        <text x="14" y={height / 2} textAnchor="middle" fontSize="11" fill="#8a928a" transform={`rotate(-90 14 ${height / 2})`}>Comissão</text>
        {data.map((item) => {
          const x = pad.left + (item.publications / maxX) * (width - pad.left - pad.right);
          const y = height - pad.bottom - (item.commission / maxY) * (height - pad.top - pad.bottom);
          return (
            <g key={item.name}>
              <circle cx={x} cy={y} r="7" fill="#26372c" stroke="#c9a85a" strokeWidth="3">
                <title>{`${item.name}: ${item.publications} publicações · ${money(item.commission)} de comissão`}</title>
              </circle>
              <text x={x + 10} y={y + 4} fontSize="10" fill="#536057">{item.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function PublicationMix({ stories, reels, instagram, tiktok }: { stories: number; reels: number; instagram: number; tiktok: number }) {
  const total = stories + reels;
  if (!total) return <EmptyChart message="Nenhuma publicação no período selecionado." />;

  const storyRatio = (stories / total) * 100;
  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
      <div
        className="relative h-40 w-40 rounded-full"
        style={{ background: `conic-gradient(#26372c 0 ${storyRatio}%, #c9a85a ${storyRatio}% 100%)` }}
        aria-label={`Stories: ${stories}, reels: ${reels}`}
      >
        <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center">
          <div><p className="text-2xl font-semibold">{total}</p><p className="text-[10px] uppercase tracking-wider text-[#8a928a]">publicações</p></div>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div><p className="font-medium">Stories</p><p className="text-xs text-[#8a928a]">{stories} · {Math.round(storyRatio)}%</p></div>
        <div><p className="font-medium">Reels</p><p className="text-xs text-[#8a928a]">{reels} · {Math.round(100 - storyRatio)}%</p></div>
        <div className="border-t border-[#eeeee9] pt-3"><p className="font-medium">Plataformas</p><p className="text-xs text-[#8a928a]">Instagram {instagram} · TikTok {tiktok}</p></div>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <div className="flex h-56 items-center justify-center rounded-xl bg-[#fafaf7] px-6 text-center text-sm text-[#8a928a]">{message}</div>;
}
