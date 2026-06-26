import Decimal from "decimal.js";

import {
  ACTIVITY_MULTIPLIERS,
} from "./calorie-calculator.constants";
import type {
  CalorieCalculationInput,
  CalorieCalculationResult,
} from "./calorie-calculator.types";

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightMeters = new Decimal(heightCm).dividedBy(100);

  return new Decimal(weightKg)
    .dividedBy(heightMeters.times(heightMeters))
    .toNumber();
}

export function calculateBmr(input: CalorieCalculationInput): number {
  const base = new Decimal(input.weightKg)
    .times(10)
    .plus(new Decimal(input.heightCm).times(6.25))
    .minus(new Decimal(input.ageYears).times(5));

  return input.sexForFormula === "male"
    ? base.plus(5).toNumber()
    : base.minus(161).toNumber();
}

export function calculateTargetCalories(
  tdeeKcal: number,
  goal: CalorieCalculationInput["goal"],
  adjustmentKcal: number,
): number {
  if (goal === "fat_loss") {
    return new Decimal(tdeeKcal).minus(adjustmentKcal).toNumber();
  }

  if (goal === "muscle_gain") {
    return new Decimal(tdeeKcal).plus(adjustmentKcal).toNumber();
  }

  return tdeeKcal;
}

export function calculateSignedAdjustment(
  goal: CalorieCalculationInput["goal"],
  adjustmentKcal: number,
): number {
  if (goal === "fat_loss") {
    return -adjustmentKcal;
  }

  if (goal === "muscle_gain") {
    return adjustmentKcal;
  }

  return 0;
}

export function calculateCalories(
  input: CalorieCalculationInput,
): CalorieCalculationResult {
  const bmi = calculateBmi(input.weightKg, input.heightCm);
  const bmrKcal = calculateBmr(input);
  const tdeeKcal = new Decimal(bmrKcal)
    .times(ACTIVITY_MULTIPLIERS[input.activityLevel])
    .toNumber();
  const targetCaloriesKcal = calculateTargetCalories(
    tdeeKcal,
    input.goal,
    input.calorieAdjustmentKcal,
  );

  return {
    bmi,
    bmrKcal,
    tdeeKcal,
    targetCaloriesKcal,
    signedAdjustmentKcal: calculateSignedAdjustment(
      input.goal,
      input.calorieAdjustmentKcal,
    ),
  };
}
