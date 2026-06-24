"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Laptop,
  Loader2,
  Moon,
  Save,
  Sun,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { saveNutritionGoals } from "../data/nutrition-goals.repository";
import type { NutritionGoals } from "../domain/nutrition-goals.types";

type GoalDraft = Record<keyof NutritionGoals, string>;

const GOAL_FIELDS: Array<{
  key: keyof NutritionGoals;
  label: string;
  unit: string;
  placeholder: string;
  max: number;
}> = [
  {
    key: "calories",
    label: "Kalorie",
    unit: "kcal",
    placeholder: "np. 2600",
    max: 20000,
  },
  {
    key: "protein",
    label: "Białko",
    unit: "g",
    placeholder: "np. 160",
    max: 2000,
  },
  {
    key: "carbohydrates",
    label: "Węglowodany",
    unit: "g",
    placeholder: "np. 300",
    max: 3000,
  },
  {
    key: "fats",
    label: "Tłuszcze",
    unit: "g",
    placeholder: "np. 80",
    max: 2000,
  },
  {
    key: "waterMl",
    label: "Woda",
    unit: "ml",
    placeholder: "np. 2500",
    max: 20000,
  },
];

function createDraft(goals: NutritionGoals): GoalDraft {
  return {
    calories: goals.calories?.toString() ?? "",
    protein: goals.protein?.toString() ?? "",
    carbohydrates: goals.carbohydrates?.toString() ?? "",
    fats: goals.fats?.toString() ?? "",
    waterMl: goals.waterMl?.toString() ?? "",
  };
}

type NutritionSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  goals: NutritionGoals;
};

export function NutritionSettingsSheet({
  open,
  onOpenChange,
  userId,
  goals,
}: NutritionSettingsSheetProps) {
  const { theme, setTheme } = useTheme();
  const [draft, setDraft] = useState<GoalDraft>(() => createDraft(goals));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const nextGoals = {} as NutritionGoals;

    for (const field of GOAL_FIELDS) {
      const rawValue = draft[field.key].trim().replace(",", ".");

      if (!rawValue) {
        nextGoals[field.key] = null;
        continue;
      }

      const value = Number(rawValue);

      if (!Number.isFinite(value) || value <= 0 || value > field.max) {
        setError(
          `Cel „${field.label}” musi być większy od 0 i nie większy niż ${field.max}.`,
        );
        return;
      }

      nextGoals[field.key] = value;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveNutritionGoals(userId, nextGoals);
      onOpenChange(false);
    } catch {
      setError("Nie udało się zapisać ustawień.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md" side="right">
        <SheetHeader className="border-b px-5 py-5">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Target className="size-5 text-emerald-600" />
            Cele i wygląd
          </SheetTitle>
          <SheetDescription>
            Wszystkie cele są opcjonalne. Puste pole ukrywa wykres.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <section>
            <h2 className="font-semibold">Dzienne cele</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Wpisz wartości, które chcesz śledzić każdego dnia.
            </p>

            <div className="mt-4 space-y-4">
              {GOAL_FIELDS.map((field) => (
                <div className="space-y-2" key={field.key}>
                  <Label htmlFor={`goal-${field.key}`}>{field.label}</Label>
                  <div className="relative">
                    <Input
                      className="h-11 pr-14"
                      id={`goal-${field.key}`}
                      inputMode="decimal"
                      max={field.max}
                      min="0"
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      step="0.1"
                      type="number"
                      value={draft[field.key]}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                      {field.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-7 border-t pt-6">
            <h2 className="font-semibold">Motyw aplikacji</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { value: "light", label: "Jasny", icon: Sun },
                { value: "dark", label: "Ciemny", icon: Moon },
                { value: "system", label: "System", icon: Laptop },
              ].map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition-colors",
                      theme === option.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-background hover:bg-muted",
                    )}
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    type="button"
                  >
                    <Icon className="size-5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {error && (
            <p className="mt-5 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <SheetFooter className="border-t px-5 py-4">
          <Button
            className="h-12 w-full"
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Zapisz ustawienia
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
