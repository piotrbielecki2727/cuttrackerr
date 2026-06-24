"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PackageOpen,
  Settings,
  Utensils,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

import { calculateEntriesNutrition } from "../domain/nutrition-diary.calculations";
import { MEAL_TYPES } from "../domain/nutrition-diary.constants";
import type { MealType } from "../domain/nutrition-diary.types";
import { useDailyWater } from "../hooks/use-daily-water";
import { useDiaryEntries } from "../hooks/use-diary-entries";
import { useNutritionGoals } from "../hooks/use-nutrition-goals";
import { DailyGoalsSummary } from "./daily-goals-summary";
import { HydrationCard } from "./hydration-card";
import { MealSection } from "./meal-section";
import { NutritionSettingsSheet } from "./nutrition-settings-sheet";
import { ProductPickerSheet } from "./product-picker-sheet";

export function NutritionDiaryDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedMealType, setSelectedMealType] =
    useState<MealType | null>(null);
  const [areSettingsOpen, setAreSettingsOpen] = useState(false);

  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );

  const { entries, isLoading, error } = useDiaryEntries(
    user?.uid,
    dateKey,
  );
  const {
    waterMl,
    isLoading: isWaterLoading,
    error: waterError,
  } = useDailyWater(user?.uid, dateKey);
  const {
    goals,
    isLoading: areGoalsLoading,
    error: goalsError,
  } = useNutritionGoals(user?.uid);

  const entriesByMeal = useMemo(
    () =>
      Object.fromEntries(
        MEAL_TYPES.map((mealType) => [
          mealType,
          entries.filter((entry) => entry.mealType === mealType),
        ]),
      ) as Record<MealType, typeof entries>,
    [entries],
  );

  const dailySummary = calculateEntriesNutrition(entries);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--dashboard-tint)_0%,var(--background)_28rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 border-b border-emerald-950/8 bg-background/90 backdrop-blur-xl dark:border-white/8">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950">
            <Utensils className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">GuiltFree</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.displayName || user.email}
            </p>
          </div>

          <Button asChild className="hidden sm:inline-flex" variant="outline">
            <Link href="/products">
              <PackageOpen className="size-4" />
              Produkty
            </Link>
          </Button>

          <ThemeToggle />

          <Button
            aria-label="Ustawienia celów"
            className="size-11"
            onClick={() => setAreSettingsOpen(true)}
            size="icon"
            variant="ghost"
          >
            <Settings className="size-4" />
          </Button>

          <Button
            aria-label="Wyloguj się"
            className="size-11"
            onClick={handleLogout}
            size="icon"
            variant="ghost"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              <CalendarDays className="size-4" />
              Dziennik żywieniowy
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {format(selectedDate, "EEEE, d MMMM", { locale: pl })}
            </h1>
          </div>

          {!isToday(selectedDate) && (
            <Button
              className="shrink-0"
              onClick={() => setSelectedDate(new Date())}
              size="sm"
              variant="outline"
            >
              Dzisiaj
            </Button>
          )}
        </div>

        <Card className="mb-6 gap-0 overflow-hidden border-emerald-950/8 bg-background/80 py-0 shadow-sm backdrop-blur dark:border-white/8">
          <CardContent className="p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <Button
                aria-label="Poprzedni tydzień"
                className="size-11"
                onClick={() =>
                  setSelectedDate((currentDate) => subWeeks(currentDate, 1))
                }
                size="icon"
                variant="ghost"
              >
                <ChevronLeft className="size-5" />
              </Button>

              <p className="text-sm font-medium">
                {format(weekStart, "d MMM", { locale: pl })} –{" "}
                {format(addDays(weekStart, 6), "d MMM yyyy", {
                  locale: pl,
                })}
              </p>

              <Button
                aria-label="Następny tydzień"
                className="size-11"
                onClick={() =>
                  setSelectedDate((currentDate) => addWeeks(currentDate, 1))
                }
                size="icon"
                variant="ghost"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>

            <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const dayIsToday = isToday(day);

                return (
                  <button
                    aria-current={isSelected ? "date" : undefined}
                    className={cn(
                      "flex min-h-16 min-w-[4.25rem] flex-1 snap-center flex-col items-center justify-center rounded-2xl border px-3 py-2 transition-colors",
                      isSelected
                        ? "border-emerald-700 bg-emerald-700 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-500 dark:text-emerald-950"
                        : "border-emerald-950/8 bg-background/80 active:bg-emerald-50 dark:border-white/8 dark:active:bg-emerald-950",
                    )}
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "text-[11px] font-medium uppercase",
                        isSelected
                          ? "text-white/75 dark:text-emerald-950/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {format(day, "EEE", { locale: pl }).replace(".", "")}
                    </span>
                    <span className="mt-1 text-lg font-semibold tabular-nums">
                      {format(day, "d")}
                    </span>
                    {dayIsToday && (
                      <span
                        className={cn(
                          "mt-1 size-1 rounded-full",
                          isSelected
                            ? "bg-white dark:bg-emerald-950"
                            : "bg-emerald-600",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {(error || waterError || goalsError) && (
          <Card className="mb-5 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              Nie udało się pobrać części danych. Sprawdź połączenie i reguły
              Firestore.
            </CardContent>
          </Card>
        )}

        <HydrationCard
          dateKey={dateKey}
          isLoading={isWaterLoading}
          userId={user.uid}
          waterGoalMl={goals.waterMl}
          waterMl={waterMl}
        />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {MEAL_TYPES.map((mealType) => (
              <div
                className="h-40 animate-pulse rounded-2xl border bg-card"
                key={mealType}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {MEAL_TYPES.map((mealType) => (
              <MealSection
                dateKey={dateKey}
                entries={entriesByMeal[mealType]}
                key={mealType}
                mealType={mealType}
                onAdd={setSelectedMealType}
                userId={user.uid}
              />
            ))}
          </div>
        )}

        {!areGoalsLoading && (
          <DailyGoalsSummary goals={goals} summary={dailySummary} />
        )}

        <Button
          asChild
          className="mt-5 h-12 w-full sm:hidden"
          variant="outline"
        >
          <Link href="/products">
            <PackageOpen className="size-4" />
            Przeglądaj bazę produktów
          </Link>
        </Button>
      </div>

      <ProductPickerSheet
        dateKey={dateKey}
        mealType={selectedMealType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMealType(null);
          }
        }}
        open={selectedMealType !== null}
        userId={user.uid}
      />

      {areSettingsOpen && (
        <NutritionSettingsSheet
          goals={goals}
          onOpenChange={setAreSettingsOpen}
          open={areSettingsOpen}
          userId={user.uid}
        />
      )}
    </main>
  );
}
