import type { Timestamp } from "firebase/firestore";

import {
  ACTIVITY_LEVELS,
  CALCULATOR_VERSION,
  CALORIE_GOALS,
} from "./calorie-calculator.constants";

export type SexForFormula = "male" | "female";
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type CalorieGoal = (typeof CALORIE_GOALS)[number];

export interface NutritionProfile {
  ageYears: number;
  sexForFormula: SexForFormula;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: CalorieGoal;
  calorieAdjustmentKcal: number;
}

export interface CaloriePlan {
  calculatorVersion: typeof CALCULATOR_VERSION;
  weightKgAtCalculation: number;
  bmi: number;
  bmrKcal: number;
  tdeeKcal: number;
  goal: CalorieGoal;
  calorieAdjustmentKcal: number;
  targetCaloriesKcal: number;
  calculatedAt: Timestamp | null;
}

export interface CalorieCalculationInput extends NutritionProfile {
  weightKg: number;
}

export interface CalorieCalculationResult {
  bmi: number;
  bmrKcal: number;
  tdeeKcal: number;
  targetCaloriesKcal: number;
  signedAdjustmentKcal: number;
}

export interface UserNutritionData {
  nutritionProfile: NutritionProfile | null;
  caloriePlan: CaloriePlan | null;
}
