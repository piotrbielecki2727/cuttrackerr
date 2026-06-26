import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import {
  ACTIVITY_LEVELS,
  CALCULATOR_VERSION,
  CALORIE_GOALS,
} from "./calorie-calculator.constants";
import type {
  CaloriePlan,
  NutritionProfile,
  UserNutritionData,
} from "./calorie-calculator.types";

export const sexForFormulaSchema = z.enum(["male", "female"]);
export const activityLevelSchema = z.enum(ACTIVITY_LEVELS);
export const calorieGoalSchema = z.enum(CALORIE_GOALS);

export const nutritionProfileSchema = z.object({
  ageYears: z.number().int().min(1).max(120),
  sexForFormula: sexForFormulaSchema,
  heightCm: z.number().finite().min(100).max(250),
  activityLevel: activityLevelSchema,
  goal: calorieGoalSchema,
  calorieAdjustmentKcal: z.number().finite().min(0).max(1500),
});

export const caloriePlanSchema = z.object({
  calculatorVersion: z.literal(CALCULATOR_VERSION),
  weightKgAtCalculation: z.number().finite().min(20).max(500),
  bmi: z.number().finite(),
  bmrKcal: z.number().finite(),
  tdeeKcal: z.number().finite(),
  goal: calorieGoalSchema,
  calorieAdjustmentKcal: z.number().finite().min(0).max(1500),
  targetCaloriesKcal: z.number().finite(),
  calculatedAt: z.instanceof(Timestamp).nullable(),
});

export const calorieCalculatorFormSchema = nutritionProfileSchema.extend({
  weightKg: z.number().finite().min(20).max(500),
  measuredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  saveWeightMeasurement: z.boolean(),
});

export type CalorieCalculatorFormValues = z.infer<
  typeof calorieCalculatorFormSchema
>;

export function parseUserNutritionData(data: unknown): UserNutritionData {
  const objectData =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {};

  const nutritionProfileResult = nutritionProfileSchema.safeParse(
    objectData.nutritionProfile,
  );
  const caloriePlanResult = caloriePlanSchema.safeParse(objectData.caloriePlan);

  return {
    nutritionProfile: nutritionProfileResult.success
      ? (nutritionProfileResult.data as NutritionProfile)
      : null,
    caloriePlan: caloriePlanResult.success
      ? (caloriePlanResult.data as CaloriePlan)
      : null,
  };
}
