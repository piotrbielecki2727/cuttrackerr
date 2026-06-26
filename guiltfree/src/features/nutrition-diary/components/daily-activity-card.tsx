"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Dumbbell,
  Footprints,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  updateDailyActivity,
  type DailyActivity,
} from "../data/daily-activity.repository";

type DailyActivityCardProps = {
  userId: string;
  dateKey: string;
  activity: DailyActivity;
  stepsGoal: number | null;
  isLoading: boolean;
};

function formatSteps(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function DailyActivityCard({
  userId,
  dateKey,
  activity,
  stepsGoal,
  isLoading,
}: DailyActivityCardProps) {
  const [pendingField, setPendingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveActivity(
    nextActivity: Partial<DailyActivity>,
    pendingKey: string,
  ) {
    setPendingField(pendingKey);
    setError(null);

    try {
      await updateDailyActivity(userId, dateKey, nextActivity);
    } catch {
      setError("Nie udało się zapisać aktywności.");
    } finally {
      setPendingField(null);
    }
  }

  async function handleTrainingNameSave(rawName: string) {
    const normalizedName = rawName.trim();

    if (normalizedName === activity.trainingName) {
      return;
    }

    await saveActivity(
      {
        trainingName: normalizedName,
        trainingDone: normalizedName ? true : activity.trainingDone,
      },
      "trainingName",
    );
  }

  const completedCount =
    Number(activity.stepsGoalCompleted) + Number(activity.trainingDone);

  return (
    <Card className="h-full overflow-hidden border-slate-300/50 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-white shadow-sm dark:border-white/10 dark:from-slate-950/60 dark:via-emerald-950/20 dark:to-card">
      <CardContent className="p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Check-in
            </p>
            <h2 className="font-semibold leading-tight">Aktywność dnia</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isLoading
                ? "Pobieranie..."
                : `${completedCount}/2 punkty odhaczone`}
            </p>
          </div>

          <div
            className={cn(
              "grid size-10 place-items-center rounded-xl border",
              completedCount === 2
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600"
                : "border-slate-300/60 bg-white/50 text-muted-foreground dark:border-white/10 dark:bg-white/5",
            )}
          >
            <CheckCircle2 className="size-5" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div
            className={cn(
              "rounded-2xl border p-3 transition-colors",
              activity.stepsGoalCompleted
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-border/70 bg-background/55",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  <Footprints className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium leading-tight">Cel kroków</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stepsGoal
                      ? `${formatSteps(stepsGoal)} kroków`
                      : "Ustaw cel w ustawieniach"}
                  </p>
                </div>
              </div>

              {pendingField === "stepsGoalCompleted" ? (
                <Loader2 className="mt-1 size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  checked={activity.stepsGoalCompleted}
                  disabled={pendingField !== null}
                  onCheckedChange={(checked) =>
                    saveActivity(
                      { stepsGoalCompleted: checked },
                      "stepsGoalCompleted",
                    )
                  }
                />
              )}
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl border p-3 transition-colors",
              activity.trainingDone
                ? "border-sky-500/30 bg-sky-500/10"
                : "border-border/70 bg-background/55",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300">
                  <Dumbbell className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium leading-tight">Trening</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.trainingDone ? "Wykonany" : "Brak treningu"}
                  </p>
                </div>
              </div>

              {pendingField === "trainingDone" ? (
                <Loader2 className="mt-1 size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  checked={activity.trainingDone}
                  disabled={pendingField !== null}
                  onCheckedChange={(checked) =>
                    saveActivity(
                      {
                        trainingDone: checked,
                        trainingName: checked ? activity.trainingName : "",
                      },
                      "trainingDone",
                    )
                  }
                />
              )}
            </div>

            {activity.trainingDone && (
              <div className="mt-3 flex gap-2">
                <Input
                  className="h-9 bg-white/60 text-sm dark:bg-white/5"
                  defaultValue={activity.trainingName}
                  key={`${dateKey}:${activity.trainingName}`}
                  maxLength={80}
                  onBlur={(event) =>
                    handleTrainingNameSave(event.currentTarget.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  placeholder="np. Push, bieganie, rower"
                />
                {pendingField === "trainingName" && (
                  <Button
                    aria-label="Zapisywanie nazwy treningu"
                    className="size-9 shrink-0"
                    disabled
                    size="icon"
                    variant="ghost"
                  >
                    <Loader2 className="size-4 animate-spin" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
