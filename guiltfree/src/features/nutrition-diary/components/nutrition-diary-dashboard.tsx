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
  Calculator,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  PackageOpen,
  Plus,
  Ruler,
  Sandwich,
  Settings,
  Utensils,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

import { calculateEntriesNutrition } from "../domain/nutrition-diary.calculations";
import { MEAL_TYPES } from "../domain/nutrition-diary.constants";
import type { MealType } from "../domain/nutrition-diary.types";
import { useDailyActivity } from "../hooks/use-daily-activity";
import { useDailyWater } from "../hooks/use-daily-water";
import { useDiaryEntries } from "../hooks/use-diary-entries";
import { useNutritionGoals } from "../hooks/use-nutrition-goals";
import { DailyActivityCard } from "./daily-activity-card";
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

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: CalendarDays,
    },
    {
      href: "/products",
      label: "Produkty",
      icon: PackageOpen,
    },
    {
      href: "/products/new",
      label: "Dodaj produkt",
      icon: Plus,
    },
    {
      href: "/calculator",
      label: "Kalkulator",
      icon: Calculator,
    },
    {
      href: "/measurements",
      label: "Pomiary",
      icon: Ruler,
    },
    {
      href: "/prepared-meals",
      label: "Gotowe posiłki",
      icon: Sandwich,
    },
  ] as const;

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
  const {
    activity,
    isLoading: isActivityLoading,
    error: activityError,
  } = useDailyActivity(user?.uid, dateKey);

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
        <div className="mx-auto flex min-h-14 w-full max-w-[1500px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950">
            <Utensils className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">GuiltFree</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.displayName || user.email}
            </p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="Otwórz menu"
                className="sm:hidden"
                size="icon"
                variant="ghost"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent className="w-[320px] gap-0 p-0" showCloseButton>
              <SheetHeader className="border-b border-border/60 px-4 py-4">
                <SheetTitle>GuiltFree</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Nawigacja i szybkie akcje
                </p>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-2 px-4 py-4">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <SheetClose asChild key={href}>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href={href}>
                        <Icon className="size-4" />
                        {label}
                      </Link>
                    </Button>
                  </SheetClose>
                ))}
              </div>

              <div className="mt-auto border-t border-border/60 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Motyw</p>
                    <p className="text-xs text-muted-foreground">
                      Przełącz jasny / ciemny
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button asChild className="hidden sm:inline-flex" variant="outline">
            <Link href="/products">
              <PackageOpen className="size-4" />
              Produkty
            </Link>
          </Button>

          <Button asChild className="hidden xl:inline-flex" variant="ghost">
            <Link href="/calculator">
              <Calculator className="size-4" />
              Kalkulator
            </Link>
          </Button>

          <Button asChild className="hidden xl:inline-flex" variant="ghost">
            <Link href="/measurements">
              <Ruler className="size-4" />
              Pomiary
            </Link>
          </Button>

          <Button asChild className="hidden lg:inline-flex" variant="outline">
            <Link href="/prepared-meals">
              <Sandwich className="size-4" />
              Gotowe posiłki
            </Link>
          </Button>

          <Button asChild className="hidden sm:inline-flex">
            <Link href="/products/new">
              <Plus className="size-4" />
              Dodaj produkt
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

      <div className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6 sm:py-5">
        {(error || waterError || goalsError || activityError) && (
          <Card className="mb-5 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              Nie udało się pobrać części danych. Sprawdź połączenie i reguły
              Firestore.
            </CardContent>
          </Card>
        )}

        <section className="mb-5 grid gap-5 xl:grid-cols-[minmax(280px,0.45fr)_minmax(0,1fr)]">
          <div className="flex items-end justify-between gap-4 rounded-2xl border border-emerald-950/8 bg-background/50 p-4 shadow-sm backdrop-blur dark:border-white/8">
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

          <Card className="gap-0 overflow-hidden border-emerald-950/8 bg-background/80 py-0 shadow-sm backdrop-blur dark:border-white/8">
            <CardContent className="p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <Button
                  aria-label="Poprzedni tydzień"
                  className="size-8"
                  onClick={() =>
                    setSelectedDate((currentDate) =>
                      subWeeks(currentDate, 1),
                    )
                  }
                  size="icon"
                  variant="ghost"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <p className="text-xs font-medium text-muted-foreground">
                  {format(weekStart, "d MMM", { locale: pl })} –{" "}
                  {format(addDays(weekStart, 6), "d MMM yyyy", {
                    locale: pl,
                  })}
                </p>

                <Button
                  aria-label="Następny tydzień"
                  className="size-8"
                  onClick={() =>
                    setSelectedDate((currentDate) =>
                      addWeeks(currentDate, 1),
                    )
                  }
                  size="icon"
                  variant="ghost"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const dayIsToday = isToday(day);

                  return (
                    <button
                      aria-current={isSelected ? "date" : undefined}
                      className={cn(
                        "flex min-h-12 min-w-14 flex-1 snap-center flex-col items-center justify-center rounded-xl border px-2 py-1.5 transition-colors",
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
                          "text-[10px] font-medium uppercase leading-none",
                          isSelected
                            ? "text-white/75 dark:text-emerald-950/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {format(day, "EEE", { locale: pl }).replace(".", "")}
                      </span>
                      <span className="mt-1 text-base font-semibold tabular-nums leading-none">
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
        </section>

        {!areGoalsLoading && (
          <div className="mb-5">
            <DailyGoalsSummary goals={goals} summary={dailySummary} />
          </div>
        )}

        <section className="mb-5 grid gap-5 xl:grid-cols-2">
          <HydrationCard
            dateKey={dateKey}
            isLoading={isWaterLoading}
            key={`${dateKey}:${waterMl}`}
            userId={user.uid}
            waterGoalMl={goals.waterMl}
            waterMl={waterMl}
          />

          <DailyActivityCard
            activity={activity}
            dateKey={dateKey}
            isLoading={isActivityLoading}
            stepsGoal={goals.steps}
            userId={user.uid}
          />
        </section>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MEAL_TYPES.map((mealType) => (
              <div
                className="h-28 animate-pulse rounded-2xl border bg-card"
                key={mealType}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
