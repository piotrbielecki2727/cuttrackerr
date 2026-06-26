export interface NutritionGoals {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fats: number | null;
  waterMl: number | null;
  steps: number | null;
}

export const EMPTY_NUTRITION_GOALS: NutritionGoals = {
  calories: null,
  protein: null,
  carbohydrates: null,
  fats: null,
  waterMl: null,
  steps: null,
};
