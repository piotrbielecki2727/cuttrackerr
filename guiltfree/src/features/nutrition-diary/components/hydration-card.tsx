"use client";

import { useState } from "react";
import {
  ChevronDown,
  Droplets,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  addDailyWater,
  resetDailyWater,
} from "../data/hydration.repository";
import { GoalProgressRing } from "./goal-progress-ring";

const QUICK_WATER_AMOUNTS = [250, 500, 750, 1000, 1500];

type HydrationCardProps = {
  userId: string;
  dateKey: string;
  waterMl: number;
  waterGoalMl: number | null;
  isLoading: boolean;
};

export function HydrationCard({
  userId,
  dateKey,
  waterMl,
  waterGoalMl,
  isLoading,
}: HydrationCardProps) {
  const [displayedWaterMl, setDisplayedWaterMl] = useState(waterMl);
  const [customAmount, setCustomAmount] = useState("");
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const goalProgress =
    waterGoalMl && waterGoalMl > 0
      ? Math.round((displayedWaterMl / waterGoalMl) * 100)
      : null;

  async function addWater(amountMl: number) {
    if (!Number.isFinite(amountMl) || amountMl <= 0 || amountMl > 10000) {
      setError("Podaj ilość od 1 do 10 000 ml.");
      return;
    }

    setPendingAmount(amountMl);
    setError(null);

    try {
      const nextWaterMl = await addDailyWater(
        userId,
        dateKey,
        amountMl,
      );

      setDisplayedWaterMl(nextWaterMl);
      setCustomAmount("");
    } catch {
      setError("Nie udało się zapisać wody.");
    } finally {
      setPendingAmount(null);
    }
  }

  async function handleCustomAmount() {
    await addWater(Number(customAmount.replace(",", ".")));
  }

  async function handleReset() {
    setIsResetting(true);
    setError(null);

    try {
      await resetDailyWater(userId, dateKey);
      setDisplayedWaterMl(0);
    } catch {
      setError("Nie udało się wyzerować wody.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Card className="h-full overflow-hidden border-sky-200/70 bg-gradient-to-br from-sky-50 via-emerald-50/60 to-white shadow-sm dark:border-sky-400/10 dark:from-sky-950/50 dark:via-emerald-950/30 dark:to-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
              <Droplets className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold leading-tight">Nawodnienie</h2>
              <p className="truncate text-xs text-muted-foreground">
                {isLoading
                  ? "Pobieranie..."
                  : `${displayedWaterMl.toLocaleString("pl-PL")} ml${
                      waterGoalMl
                        ? ` z ${waterGoalMl.toLocaleString("pl-PL")} ml`
                        : " dzisiaj"
                    }${goalProgress !== null ? ` · ${goalProgress}%` : ""}`}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {displayedWaterMl > 0 && (
              <Button
                aria-label="Wyzeruj wodę"
                disabled={isResetting}
                onClick={handleReset}
                size="icon-sm"
                variant="ghost"
              >
                {isResetting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
              </Button>
            )}
            <Button
              aria-expanded={!isCollapsed}
              aria-label={
                isCollapsed ? "Rozwiń nawodnienie" : "Zwiń nawodnienie"
              }
              className="size-9"
              onClick={() => setIsCollapsed((current) => !current)}
              size="icon"
              variant="ghost"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  isCollapsed && "rotate-180",
                )}
              />
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_7.5rem] lg:items-stretch">
            <div className="min-w-0 rounded-2xl border border-sky-200/60 bg-white/45 p-3 dark:border-sky-400/10 dark:bg-white/4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {QUICK_WATER_AMOUNTS.map((amount) => (
                  <Button
                    className="h-10 border-sky-200 bg-white/70 px-2 text-xs text-sky-900 hover:bg-sky-100 dark:border-sky-400/15 dark:bg-white/5 dark:text-sky-100 dark:hover:bg-sky-900/50"
                    disabled={pendingAmount !== null}
                    key={amount}
                    onClick={() => addWater(amount)}
                    variant="outline"
                  >
                    {pendingAmount === amount ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    {amount} ml
                  </Button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Input
                    aria-label="Własna ilość wody"
                    className="h-10 bg-white/70 pr-10 text-sm dark:bg-white/5"
                    inputMode="numeric"
                    max="10000"
                    min="1"
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder="Własna ilość"
                    type="number"
                    value={customAmount}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                    ml
                  </span>
                </div>
                <Button
                  className="h-10 shrink-0"
                  disabled={!customAmount || pendingAmount !== null}
                  onClick={handleCustomAmount}
                  size="sm"
                >
                  Dodaj
                </Button>
              </div>

              {error && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>

            {waterGoalMl !== null && (
              <GoalProgressRing
                className="mx-auto w-full max-w-[7.5rem] justify-center bg-white/65 dark:bg-white/5"
                goal={waterGoalMl}
                label="Woda"
                size="compact"
                unit="ml"
                value={displayedWaterMl}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
