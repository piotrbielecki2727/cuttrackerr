import {
  Activity,
  Flame,
  HeartPulse,
  Scale,
  Target,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import {
  ACTIVITY_LEVEL_LABELS,
  CALORIE_GOAL_LABELS,
} from "../domain/calorie-calculator.constants";
import type {
  ActivityLevel,
  CalorieCalculationResult,
  CalorieGoal,
} from "../domain/calorie-calculator.types";

type CalorieResultCardProps = {
  result: CalorieCalculationResult;
  goal: CalorieGoal;
  activityLevel: ActivityLevel;
};

function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

function formatAdjustment(value: number): string {
  if (value > 0) {
    return `+${formatNumber(value)} kcal`;
  }

  if (value < 0) {
    return `${formatNumber(value)} kcal`;
  }

  return "0 kcal";
}

export function CalorieResultCard({
  result,
  goal,
  activityLevel,
}: CalorieResultCardProps) {
  const metrics = [
    {
      label: "BMI",
      value: formatNumber(result.bmi, 1),
      icon: Scale,
    },
    {
      label: "BMR",
      value: `${formatNumber(result.bmrKcal)} kcal`,
      icon: HeartPulse,
    },
    {
      label: "TDEE",
      value: `${formatNumber(result.tdeeKcal)} kcal`,
      icon: Activity,
    },
    {
      label: "Cel kalorii",
      value: `${formatNumber(result.targetCaloriesKcal)} kcal`,
      icon: Flame,
    },
  ];

  return (
    <Card className="overflow-hidden border-emerald-900/10 bg-gradient-to-br from-emerald-50 via-lime-50/70 to-white shadow-sm dark:border-white/10 dark:from-emerald-950/50 dark:via-emerald-950/20 dark:to-card">
      <CardContent className="p-5">
        <div className="mb-5 flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white">
            <Target className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Wynik kalkulatora
            </p>
            <h2 className="mt-1 text-xl font-semibold">Twoje zapotrzebowanie</h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div className="rounded-2xl border bg-white/70 p-3 dark:bg-white/5" key={metric.label}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="size-4" />
                  {metric.label}
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums">
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border bg-background/70 p-4 text-sm">
          <p>
            Tryb:{" "}
            <span className="font-semibold">{CALORIE_GOAL_LABELS[goal]}</span>
          </p>
          <p className="mt-1">
            Korekta:{" "}
            <span className="font-semibold">
              {formatAdjustment(result.signedAdjustmentKcal)}
            </span>
          </p>
          <p className="mt-1">
            Aktywność:{" "}
            <span className="font-semibold">
              {ACTIVITY_LEVEL_LABELS[activityLevel]}
            </span>
          </p>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Wynik jest punktem startowym opartym na wzorze matematycznym.
          Obserwuj trend masy ciała, samopoczucie, poziom energii i w razie
          potrzeby koryguj cel.
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Kalkulator daje szacunek i nie zastępuje indywidualnej konsultacji
          medycznej lub dietetycznej.
        </p>
      </CardContent>
    </Card>
  );
}
