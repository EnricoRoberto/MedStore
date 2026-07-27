function colorClasses(percent: number): string {
  if (percent <= 5) return "bg-red-500";
  if (percent <= 20) return "bg-amber-500";
  return "bg-sage-500";
}

export function QuantityBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className={`h-full rounded-full ${colorClasses(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium text-stone-600">
        {clamped}%
      </span>
    </div>
  );
}
