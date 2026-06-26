"use client";

import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { Calculator, Loader2, Save } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { saveCalorieCalculation } from "../data/calorie-calculator.repository";
import { calculateCalories } from "../domain/calorie-calculator.calculations";
import {
  ACTIVITY_LEVEL_DESCRIPTIONS,
  ACTIVITY_LEVEL_LABELS,
  ACTIVITY_LEVELS,
  CALORIE_GOAL_LABELS,
  CALORIE_GOALS,
  DEFAULT_CALORIE_ADJUSTMENTS,
} from "../domain/calorie-calculator.constants";
import { calorieCalculatorFormSchema } from "../domain/calorie-calculator.schemas";
import type {
  CalorieCalculatorFormValues,
} from "../domain/calorie-calculator.schemas";
import type {
  ActivityLevel,
  CalorieGoal,
  SexForFormula,
  UserNutritionData,
} from "../domain/calorie-calculator.types";
import { useUserNutritionData } from "../hooks/use-user-nutrition-data";
import { CalorieEducation } from "./calorie-education";
import { CalorieResultCard } from "./calorie-result-card";

type DraftValues = {
  ageYears: string;
  heightCm: string;
  weightKg: string;
  calorieAdjustmentKcal: string;
  measuredOn: string;
  sexForFormula: SexForFormula;
  activityLevel: ActivityLevel;
  goal: CalorieGoal;
};

function parseDecimal(value: string): number {
  return Number(value.trim().replace(",", "."));
}

function createInitialDraft(data: UserNutritionData): DraftValues {
  const profile = data.nutritionProfile;
  const plan = data.caloriePlan;

  return {
    ageYears: profile?.ageYears.toString() ?? "",
    sexForFormula: profile?.sexForFormula ?? "male",
    heightCm: profile?.heightCm.toString() ?? "",
    weightKg: plan?.weightKgAtCalculation.toString() ?? "",
    activityLevel: profile?.activityLevel ?? "lightly_active",
    goal: profile?.goal ?? "fat_loss",
    calorieAdjustmentKcal:
      profile?.calorieAdjustmentKcal.toString() ??
      DEFAULT_CALORIE_ADJUSTMENTS.fat_loss.toString(),
    measuredOn: format(new Date(), "yyyy-MM-dd"),
  };
}

function buildFormValues(
  draft: DraftValues,
  saveWeightMeasurement: boolean,
): CalorieCalculatorFormValues {
  return {
    ageYears: parseDecimal(draft.ageYears),
    sexForFormula: draft.sexForFormula,
    heightCm: parseDecimal(draft.heightCm),
    weightKg: parseDecimal(draft.weightKg),
    activityLevel: draft.activityLevel,
    goal: draft.goal,
    calorieAdjustmentKcal: parseDecimal(draft.calorieAdjustmentKcal),
    measuredOn: draft.measuredOn,
    saveWeightMeasurement,
  };
}

type CalculatorFormProps = {
  userId: string;
  data: UserNutritionData;
};

function CalculatorForm({ userId, data }: CalculatorFormProps) {
  const [draft, setDraft] = useState<DraftValues>(() => createInitialDraft(data));
  const [saveWeightMeasurement, setSaveWeightMeasurement] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formValues = buildFormValues(draft, saveWeightMeasurement);
  const parsedValues = calorieCalculatorFormSchema.safeParse(formValues);
  const calculation = parsedValues.success
    ? calculateCalories(parsedValues.data)
    : null;

  function updateDraft(key: keyof DraftValues, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  function updateGoal(goal: CalorieGoal) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      goal,
      calorieAdjustmentKcal:
        currentDraft.goal === goal
          ? currentDraft.calorieAdjustmentKcal
          : DEFAULT_CALORIE_ADJUSTMENTS[goal].toString(),
    }));
  }

  async function handleSave() {
    const validation = calorieCalculatorFormSchema.safeParse(
      buildFormValues(draft, saveWeightMeasurement),
    );

    if (!validation.success) {
      setErrors(
        Object.fromEntries(
          validation.error.issues.map((issue) => [
            issue.path.join("."),
            "Sprawdź wartość.",
          ]),
        ),
      );
      setSubmitError("Popraw pola formularza.");
      setSuccessMessage(null);
      return;
    }

    const result = calculateCalories(validation.data);

    setIsSaving(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await saveCalorieCalculation(
        userId,
        validation.data,
        result,
        validation.data.measuredOn,
        validation.data.saveWeightMeasurement,
      );
      setSuccessMessage("Zapisano profil i plan kalorii.");
    } catch {
      setSubmitError("Nie udało się zapisać kalkulacji.");
    } finally {
      setIsSaving(false);
    }
  }

  const adjustmentLabel =
    draft.goal === "fat_loss"
      ? "Kalorie do odjęcia"
      : draft.goal === "muscle_gain"
        ? "Kalorie do dodania"
        : "Korekta kalorii";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.65fr)]">
      <div className="space-y-5">
        <Card>
          <CardContent className="p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Calculator className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Kalkulator Mifflina–St Jeora
                </p>
                <h1 className="mt-1 text-2xl font-semibold">
                  Zapotrzebowanie kaloryczne
                </h1>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Wiek" error={errors.ageYears}>
                <Input
                  aria-invalid={Boolean(errors.ageYears)}
                  inputMode="numeric"
                  onChange={(event) => updateDraft("ageYears", event.target.value)}
                  placeholder="np. 30"
                  value={draft.ageYears}
                />
              </Field>

              <Field label="Płeć do wzoru">
                <div className="grid grid-cols-2 gap-2">
                  {(["male", "female"] as const).map((sex) => (
                    <Button
                      key={sex}
                      onClick={() => updateDraft("sexForFormula", sex)}
                      type="button"
                      variant={draft.sexForFormula === sex ? "default" : "outline"}
                    >
                      {sex === "male" ? "Mężczyzna" : "Kobieta"}
                    </Button>
                  ))}
                </div>
              </Field>

              <Field label="Wzrost" error={errors.heightCm} suffix="cm">
                <Input
                  aria-invalid={Boolean(errors.heightCm)}
                  inputMode="decimal"
                  onChange={(event) => updateDraft("heightCm", event.target.value)}
                  placeholder="np. 180"
                  value={draft.heightCm}
                />
              </Field>

              <Field label="Aktualna masa" error={errors.weightKg} suffix="kg">
                <Input
                  aria-invalid={Boolean(errors.weightKg)}
                  inputMode="decimal"
                  onChange={(event) => updateDraft("weightKg", event.target.value)}
                  placeholder="np. 82,5"
                  value={draft.weightKg}
                />
              </Field>

              <Field label="Data ważenia" error={errors.measuredOn}>
                <Input
                  aria-invalid={Boolean(errors.measuredOn)}
                  onChange={(event) => updateDraft("measuredOn", event.target.value)}
                  type="date"
                  value={draft.measuredOn}
                />
              </Field>

              <Field
                label={adjustmentLabel}
                error={errors.calorieAdjustmentKcal}
                suffix="kcal"
              >
                <Input
                  aria-invalid={Boolean(errors.calorieAdjustmentKcal)}
                  inputMode="numeric"
                  onChange={(event) =>
                    updateDraft("calorieAdjustmentKcal", event.target.value)
                  }
                  value={draft.calorieAdjustmentKcal}
                />
              </Field>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Tryb celu</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {CALORIE_GOALS.map((goal) => (
                  <Button
                    key={goal}
                    onClick={() => updateGoal(goal)}
                    type="button"
                    variant={draft.goal === goal ? "default" : "outline"}
                  >
                    {CALORIE_GOAL_LABELS[goal]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Poziom aktywności</p>
              <p className="mb-3 text-sm leading-6 text-muted-foreground">
                Uwzględnij cały dzień: pracę, codzienny ruch, kroki, spacery,
                bieganie i treningi — nie tylko liczbę treningów.
              </p>
              <div className="grid gap-2">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    className={cn(
                      "rounded-2xl border p-3 text-left transition-colors",
                      draft.activityLevel === level
                        ? "border-primary bg-primary/5"
                        : "bg-background",
                    )}
                    key={level}
                    onClick={() => updateDraft("activityLevel", level)}
                    type="button"
                  >
                    <p className="font-medium">{ACTIVITY_LEVEL_LABELS[level]}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ACTIVITY_LEVEL_DESCRIPTIONS[level]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border p-4">
              <div>
                <p className="font-medium">Zapisz wagę do pomiarów</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Utworzy albo zaktualizuje pomiar dla wybranej daty.
                </p>
              </div>
              <Switch
                checked={saveWeightMeasurement}
                onCheckedChange={setSaveWeightMeasurement}
              />
            </div>

            {submitError && (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
            {successMessage && (
              <p className="mt-4 text-sm text-emerald-700" role="status">
                {successMessage}
              </p>
            )}
          </CardContent>
        </Card>

        <CalorieEducation />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {calculation ? (
          <CalorieResultCard
            activityLevel={draft.activityLevel}
            goal={draft.goal}
            result={calculation}
          />
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              Uzupełnij formularz, aby zobaczyć wynik.
            </CardContent>
          </Card>
        )}

        <Button
          className="hidden h-12 w-full lg:inline-flex"
          disabled={isSaving}
          onClick={handleSave}
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Zapisz plan
        </Button>
      </aside>

      <div className="sticky bottom-3 z-20 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur lg:hidden">
        <Button className="h-12 w-full" disabled={isSaving} onClick={handleSave}>
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Zapisz plan
        </Button>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  suffix?: string;
  children: ReactNode;
};

function Field({ label, error, suffix, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {children}
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function CalorieCalculatorPageContent() {
  const { user } = useAuth();
  const { data, isLoading, error } = useUserNutritionData(user?.uid);
  const formKey = JSON.stringify(data.nutritionProfile ?? {});

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--dashboard-tint)_0%,var(--background)_28rem)]">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Pobieram zapisany profil...
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              Nie udało się pobrać zapisanego profilu.
            </CardContent>
          </Card>
        ) : (
          <CalculatorForm data={data} key={formKey} userId={user.uid} />
        )}
      </div>
    </main>
  );
}
