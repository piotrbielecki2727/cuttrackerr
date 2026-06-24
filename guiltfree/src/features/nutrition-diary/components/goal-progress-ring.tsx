import { cn } from "@/lib/utils";

type GoalProgressRingProps = {
  label: string;
  value: number;
  goal: number;
  unit: string;
  className?: string;
};

function getProgressColor(progress: number): string {
  if (progress < 0.25) {
    return "#ef6f6c";
  }

  if (progress < 0.6) {
    return "#f59e5b";
  }

  if (progress < 0.9) {
    return "#eabf45";
  }

  return "#63a96b";
}

function formatValue(value: number, unit: string): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: unit === "kcal" || unit === "ml" ? 0 : 1,
  }).format(value);
}

export function GoalProgressRing({
  label,
  value,
  goal,
  unit,
  className,
}: GoalProgressRingProps) {
  const progress = goal > 0 ? value / goal : 0;
  const displayedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - displayedProgress);
  const color = getProgressColor(progress);
  const percentage = Math.round(progress * 100);

  return (
    <article
      aria-label={`${label}: ${formatValue(value, unit)} z ${formatValue(goal, unit)} ${unit}`}
      className={cn(
        "flex min-w-0 flex-col items-center rounded-3xl border border-emerald-950/5 bg-white/75 p-3 text-center shadow-sm dark:border-white/8 dark:bg-white/4",
        className,
      )}
    >
      <div className="relative size-28">
        <svg
          aria-hidden="true"
          className="-rotate-90"
          height="112"
          viewBox="0 0 112 112"
          width="112"
        >
          <circle
            className="stroke-emerald-950/8 dark:stroke-white/10"
            cx="56"
            cy="56"
            fill="none"
            r={radius}
            strokeWidth="9"
          />
          <circle
            cx="56"
            cy="56"
            fill="none"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth="9"
            style={{ transition: "stroke-dashoffset 400ms ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums">
            {formatValue(value, unit)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            z {formatValue(goal, unit)}
          </span>
        </div>
      </div>

      <p className="mt-1 font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">
        {unit} · {percentage}%
      </p>
    </article>
  );
}
