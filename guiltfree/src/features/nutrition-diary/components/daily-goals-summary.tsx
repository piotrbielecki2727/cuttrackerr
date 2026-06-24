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
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-br from-emerald-50 via-lime-50/70 to-amber-50 p-4 shadow-sm sm:p-6 dark:border-emerald-300/10 dark:from-emerald-950/50 dark:via-emerald-950/20 dark:to-amber-950/20">
        <div className="mb-5">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Twój dzień
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Realizacja celów
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {configuredGoals.map((item) => (
            <GoalProgressRing
              goal={item.goal}
              key={item.key}
              label={item.label}
              unit={item.unit}
              value={item.value}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <Card className="mt-6 overflow-hidden border-emerald-900/10 bg-emerald-950 text-white shadow-lg dark:bg-emerald-950">
      <CardContent className="p-5 sm:p-6">
        <p className="text-sm font-medium text-emerald-200">
          Podsumowanie dnia
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatNutrition(summary.calories, true)}
            </p>
            <p className="mt-1 text-xs text-emerald-200">kcal</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatNutrition(summary.protein)}
              <span className="ml-1 text-sm">g</span>
            </p>
            <p className="mt-1 text-xs text-emerald-200">białko</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatNutrition(summary.carbohydrates)}
              <span className="ml-1 text-sm">g</span>
            </p>
            <p className="mt-1 text-xs text-emerald-200">węglowodany</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
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
