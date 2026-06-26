import { cn } from "@/lib/utils";

type GoalProgressRingProps = {
  label: string;
  value: number;
  goal: number;
  unit: string;
  className?: string;
  size?: "default" | "compact";
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
  size = "default",
}: GoalProgressRingProps) {
  const progress = goal > 0 ? value / goal : 0;
  const displayedProgress = Math.min(Math.max(progress, 0), 1);
  const isCompact = size === "compact";
  const svgSize = isCompact ? 76 : 112;
  const center = svgSize / 2;
  const radius = isCompact ? 29 : 44;
  const strokeWidth = isCompact ? 7 : 9;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - displayedProgress);
  const color = getProgressColor(progress);
  const percentage = Math.round(progress * 100);

  return (
    <article
      aria-label={`${label}: ${formatValue(value, unit)} z ${formatValue(goal, unit)} ${unit}`}
      className={cn(
        "flex min-w-0 flex-col items-center rounded-2xl border border-emerald-950/5 bg-white/75 text-center shadow-sm dark:border-white/8 dark:bg-white/4",
        isCompact ? "p-2" : "p-3",
        className,
      )}
    >
      <div className={cn("relative", isCompact ? "size-[76px]" : "size-28")}>
        <svg
          aria-hidden="true"
          className="-rotate-90"
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          width={svgSize}
        >
          <circle
            className="stroke-emerald-950/8 dark:stroke-white/10"
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            style={{ transition: "stroke-dashoffset 400ms ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-bold tabular-nums",
              isCompact ? "text-sm" : "text-lg",
            )}
          >
            {formatValue(value, unit)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            z {formatValue(goal, unit)}
          </span>
        </div>
      </div>

      <p className={cn("font-semibold", isCompact ? "mt-0.5 text-sm" : "mt-1")}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground">
        {unit} · {percentage}%
      </p>
    </article>
  );
}
