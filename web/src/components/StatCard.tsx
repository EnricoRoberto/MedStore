type Tone = "default" | "amber" | "red" | "emerald";

const TONE_CLASSES: Record<Tone, string> = {
  default: "border-slate-200 text-slate-800",
  amber: "border-amber-200 text-amber-800",
  red: "border-red-200 text-red-800",
  emerald: "border-emerald-200 text-emerald-800",
};

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: Tone;
}

export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${TONE_CLASSES[tone]}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
