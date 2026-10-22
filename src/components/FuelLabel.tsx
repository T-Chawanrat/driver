const fuelLabels = [
  { match: "ดีเซล B20", offset: -1, height: 41 },
  { match: "Super Power Diesel", offset: -290, height: 41 },
  { match: "ดีเซล", offset: -43, height: 40 },
  { match: "Super Power X99", offset: -331, height: 41 },
  { match: "Super Power GSH95", offset: -249, height: 41 },
  { match: "แก๊สโซฮอล์ E20", offset: -84, height: 41 },
  { match: "แก๊สโซฮอล์ 91", offset: -125, height: 41 },
  { match: "แก๊สโซฮอล์ 95", offset: -166, height: 41 },
  { match: "เบนซิน", offset: -208, height: 40 },
];

export default function FuelLabel({ product }: { product: string }) {
  const label = fuelLabels.find(({ match }) => product.includes(match));
  if (!label) return <span className="flex min-h-[41px] w-[121px] items-center text-sm font-semibold text-slate-700">{product}</span>;
  return (
    <span className="block w-[121px] shrink-0 overflow-hidden rounded-sm" style={{ height: label.height }}>
      <img
        src={`${import.meta.env.BASE_URL}images/fuel/ptt-fuel-labels.png`}
        alt={product}
        className="block max-w-none"
        style={{ transform: `translateY(${label.offset}px)` }}
      />
    </span>
  );
}


