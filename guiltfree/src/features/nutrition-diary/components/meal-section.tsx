"use client";

import { useState, type ComponentType } from "react";
import {
  Apple,
  Check,
  Coffee,
  Loader2,
  Moon,
  Plus,
  Sandwich,
  Soup,
  Trash2,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  deleteDiaryEntry,
  updateDiaryEntryAmount,
} from "../data/nutrition-diary.repository";
import {
  calculateEntriesNutrition,
  calculateEntryNutrition,
} from "../domain/nutrition-diary.calculations";
import { MEAL_TYPE_LABELS } from "../domain/nutrition-diary.constants";
import type {
  DiaryEntry,
  MealType,
  NutritionSummary,
} from "../domain/nutrition-diary.types";

const MEAL_ICONS: Record<
  MealType,
  ComponentType<{ className?: string }>
> = {
  breakfast: Coffee,
  second_breakfast: Sandwich,
  lunch: Utensils,
  dinner: Soup,
  snack: Apple,
  supper: Moon,
};

function formatNutrition(value: number, calories = false): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: calories ? 0 : 1,
  }).format(value);
}

function CompactSummary({ summary }: { summary: NutritionSummary }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div>
        <p className="font-semibold tabular-nums">
          {formatNutrition(summary.calories, true)}
        </p>
        <p className="text-[11px] text-muted-foreground">kcal</p>
      </div>
      <div>
        <p className="font-semibold tabular-nums">
          {formatNutrition(summary.protein)}
        </p>
        <p className="text-[11px] text-muted-foreground">białko</p>
      </div>
      <div>
        <p className="font-semibold tabular-nums">
          {formatNutrition(summary.carbohydrates)}
        </p>
        <p className="text-[11px] text-muted-foreground">węgle</p>
      </div>
      <div>
        <p className="font-semibold tabular-nums">
          {formatNutrition(summary.fats)}
        </p>
        <p className="text-[11px] text-muted-foreground">tłuszcz</p>
      </div>
    </div>
  );
}

type DiaryEntryRowProps = {
  entry: DiaryEntry;
  userId: string;
  dateKey: string;
};

function DiaryEntryRow({
  entry,
  userId,
  dateKey,
}: DiaryEntryRowProps) {
  const [amount, setAmount] = useState(String(entry.amount));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const parsedAmount = Number(amount.replace(",", "."));
  const hasChanged =
    Number.isFinite(parsedAmount) && parsedAmount !== entry.amount;
  const previewEntry = {
    ...entry,
    amount:
      Number.isFinite(parsedAmount) && parsedAmount > 0
        ? parsedAmount
        : entry.amount,
  };
  const nutrition = calculateEntryNutrition(previewEntry);

  async function handleSave() {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmount(String(entry.amount));
      return;
    }

    setIsSaving(true);
    try {
      await updateDiaryEntryAmount(
        userId,
        dateKey,
        entry.id,
        parsedAmount,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteDiaryEntry(userId, dateKey, entry.id);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="border-t px-4 py-3 first:border-t-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{entry.product.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {entry.product.brand || "Bez marki"} ·{" "}
            {formatNutrition(nutrition.calories, true)} kcal
          </p>
        </div>

        <div className="relative w-24 shrink-0">
          <Input
            aria-label={`Ilość produktu ${entry.product.name}`}
            className="h-10 pr-8 text-right tabular-nums"
            inputMode="decimal"
            min="0.1"
            onBlur={() => {
              if (!hasChanged) {
                setAmount(String(entry.amount));
              }
            }}
            onChange={(event) => setAmount(event.target.value)}
            step="0.1"
            type="number"
            value={amount}
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
            {entry.unit}
          </span>
        </div>

        {hasChanged ? (
          <Button
            aria-label="Zapisz ilość"
            className="size-10 shrink-0"
            disabled={isSaving}
            onClick={handleSave}
            size="icon"
            variant="outline"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
          </Button>
        ) : (
          <Button
            aria-label={`Usuń ${entry.product.name}`}
            className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isDeleting}
            onClick={handleDelete}
            size="icon"
            variant="ghost"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        )}
      </div>

      <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
        <span>B {formatNutrition(nutrition.protein)} g</span>
        <span>W {formatNutrition(nutrition.carbohydrates)} g</span>
        <span>T {formatNutrition(nutrition.fats)} g</span>
      </div>
    </div>
  );
}

type MealSectionProps = {
  mealType: MealType;
  entries: DiaryEntry[];
  userId: string;
  dateKey: string;
  onAdd: (mealType: MealType) => void;
};

export function MealSection({
  mealType,
  entries,
  userId,
  dateKey,
  onAdd,
}: MealSectionProps) {
  const Icon = MEAL_ICONS[mealType];
  const summary = calculateEntriesNutrition(entries);

  return (
    <Card className="overflow-hidden gap-0 border-border/80 py-0 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{MEAL_TYPE_LABELS[mealType]}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {entries.length === 0
                ? "Brak produktów"
                : `${entries.length} ${
                    entries.length === 1 ? "produkt" : "produkty"
                  }`}
            </p>
          </div>

          <Button
            aria-label={`Dodaj produkt: ${MEAL_TYPE_LABELS[mealType]}`}
            className="min-h-11 shrink-0"
            onClick={() => onAdd(mealType)}
            size="sm"
            variant="outline"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Dodaj</span>
          </Button>
        </div>

        {entries.length > 0 && (
          <div className="border-y bg-background">
            {entries.map((entry) => (
              <DiaryEntryRow
                dateKey={dateKey}
                entry={entry}
                key={entry.id}
                userId={userId}
              />
            ))}
          </div>
        )}

        <div
          className={cn(
            "px-4 py-3",
            entries.length === 0 ? "border-t bg-muted/20" : "bg-muted/30",
          )}
        >
          <CompactSummary summary={summary} />
        </div>
      </CardContent>
    </Card>
  );
}
