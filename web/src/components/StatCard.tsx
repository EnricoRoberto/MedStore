import { Link } from "react-router-dom";

type Tone = "default" | "amber" | "red" | "emerald";

const TONE_CLASSES: Record<Tone, string> = {
  default: "border-stone-400 text-stone-800",
  amber: "border-amber-300 text-amber-800",
  red: "border-red-300 text-red-800",
  emerald: "border-sage-300 text-sage-800",
};

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: Tone;
  to?: string;
}

export function StatCard({ label, value, tone = "default", to }: StatCardProps) {
  const className = `block rounded-2xl border-2 bg-white p-4 shadow-md ${TONE_CLASSES[tone]} ${
    to ? "hover:shadow-lg" : ""
  }`;

  const content = (
    <>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium text-stone-500">{label}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
