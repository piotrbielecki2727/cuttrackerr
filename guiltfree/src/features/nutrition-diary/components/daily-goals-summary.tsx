import { Card, CardContent } from "@/components/ui/card";

import type { NutritionGoals } from "../domain/nutrition-goals.types";
import type { NutritionSummary } from "../domain/nutrition-diary.types";
import { GoalProgressRing } from "./goal-progress-ring";

type DailyGoalsSummaryProps = {
  summary: NutritionSummary;
  goals: NutritionGoals;
};

function formatNutrition(value: number, calories = false): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: calories ? 0 : 1,
  }).format(value);
}

export function DailyGoalsSummary({
  summary,
  goals,
}: DailyGoalsSummaryProps) {
  const goalItems = [
    {
      key: "calories",
      label: "Kalorie",
      value: summary.calories,
      goal: goals.calories,
      unit: "kcal",
    },
    {
      key: "protein",
      label: "Białko",
      value: summary.protein,
      goal: goals.protein,
      unit: "g",
    },
    {
      key: "carbohydrates",
      label: "Węglowodany",
      value: summary.carbohydrates,
      goal: goals.carbohydrates,
      unit: "g",
    },
    {
      key: "fats",
      label: "Tłuszcze",
      value: summary.fats,
      goal: goals.fats,
      unit: "g",
    },
  ];

  const configuredGoals = goalItems.filter(
    (item): item is typeof item & { goal: number } => item.goal !== null,
  );

  if (configuredGoals.length > 0) {
    return (
      <section className="h-full overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50 via-lime-50/70 to-amber-50 p-3 shadow-sm dark:border-emerald-300/10 dark:from-emerald-950/50 dark:via-emerald-950/20 dark:to-amber-950/20">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Twój dzień
            </p>
            <h2 className="text-base font-semibold tracking-tight">
              Realizacja celów
            </h2>
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {configuredGoals.length}/4
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {configuredGoals.map((item) => (
            <GoalProgressRing
              goal={item.goal}
              key={item.key}
              label={item.label}
              size="compact"
              unit={item.unit}
              value={item.value}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <Card className="h-full overflow-hidden border-emerald-900/10 bg-emerald-950 text-white shadow-lg dark:bg-emerald-950">
      <CardContent className="p-4">
        <p className="text-sm font-medium text-emerald-200">
          Podsumowanie dnia
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
          <div>
            <p className="text-xl font-semibold tabular-nums">
              {formatNutrition(summary.calories, true)}
            </p>
            <p className="mt-1 text-xs text-emerald-200">kcal</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">
              {formatNutrition(summary.protein)}
              <span className="ml-1 text-sm">g</span>
            </p>
            <p className="mt-1 text-xs text-emerald-200">białko</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">
              {formatNutrition(summary.carbohydrates)}
              <span className="ml-1 text-sm">g</span>
            </p>
            <p className="mt-1 text-xs text-emerald-200">węglowodany</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">
              {formatNutrition(summary.fats)}
              <span className="ml-1 text-sm">g</span>
            </p>
            <p className="mt-1 text-xs text-emerald-200">tłuszcze</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
