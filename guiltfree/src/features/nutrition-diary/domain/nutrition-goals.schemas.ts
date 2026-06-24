import { z } from "zod";

import type { NutritionGoals } from "./nutrition-goals.types";

const optionalGoalSchema = z.number().finite().positive().nullable();

export const nutritionGoalsSchema = z.object({
  calories: optionalGoalSchema,
  protein: optionalGoalSchema,
  carbohydrates: optionalGoalSchema,
  fats: optionalGoalSchema,
  waterMl: optionalGoalSchema,
});

export function parseNutritionGoals(data: unknown): NutritionGoals {
  return nutritionGoalsSchema.parse(data);
}
