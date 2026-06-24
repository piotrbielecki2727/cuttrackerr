"use client";

import { useState } from "react";
import {
  Droplets,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  const [error, setError] = useState<string | null>(null);

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
    <Card className="mb-6 overflow-hidden border-sky-200/70 bg-gradient-to-br from-sky-50 via-emerald-50/60 to-white shadow-sm dark:border-sky-400/10 dark:from-sky-950/50 dark:via-emerald-950/30 dark:to-card">
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
                  <Droplets className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Nawodnienie</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isLoading
                      ? "Pobieranie..."
                      : `${displayedWaterMl.toLocaleString("pl-PL")} ml wypite dzisiaj`}
                  </p>
                </div>
              </div>

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
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {QUICK_WATER_AMOUNTS.map((amount) => (
                <Button
                  className="h-11 border-sky-200 bg-white/70 text-sky-900 hover:bg-sky-100 dark:border-sky-400/15 dark:bg-white/5 dark:text-sky-100 dark:hover:bg-sky-900/50"
                  disabled={pendingAmount !== null}
                  key={amount}
                  onClick={() => addWater(amount)}
                  variant="outline"
                >
                  {pendingAmount === amount ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {amount} ml
                </Button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Input
                  aria-label="Własna ilość wody"
                  className="h-11 bg-white/70 pr-12 dark:bg-white/5"
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
                className="h-11 shrink-0"
                disabled={!customAmount || pendingAmount !== null}
                onClick={handleCustomAmount}
              >
                Dodaj
              </Button>
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          {waterGoalMl !== null && (
            <GoalProgressRing
              className="mx-auto w-full max-w-44 bg-white/65 dark:bg-white/5"
              goal={waterGoalMl}
              label="Woda"
              unit="ml"
              value={displayedWaterMl}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
