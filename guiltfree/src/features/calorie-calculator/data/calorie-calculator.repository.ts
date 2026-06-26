import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

import {
  CALCULATOR_VERSION,
} from "../domain/calorie-calculator.constants";
import {
  parseUserNutritionData,
} from "../domain/calorie-calculator.schemas";
import type {
  CalorieCalculationInput,
  CalorieCalculationResult,
  CaloriePlan,
  NutritionProfile,
  UserNutritionData,
} from "../domain/calorie-calculator.types";

const USERS_COLLECTION = "users";
const BODY_MEASUREMENTS_COLLECTION = "bodyMeasurements";

function getUserReference(userId: string) {
  return doc(db, USERS_COLLECTION, userId);
}

function getBodyMeasurementReference(userId: string, measuredOn: string) {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    BODY_MEASUREMENTS_COLLECTION,
    measuredOn,
  );
}

function createNutritionProfile(
  input: CalorieCalculationInput,
): NutritionProfile {
  return {
    ageYears: input.ageYears,
    sexForFormula: input.sexForFormula,
    heightCm: input.heightCm,
    activityLevel: input.activityLevel,
    goal: input.goal,
    calorieAdjustmentKcal: input.calorieAdjustmentKcal,
  };
}

function createCaloriePlan(
  input: CalorieCalculationInput,
  result: CalorieCalculationResult,
): Omit<CaloriePlan, "calculatedAt"> {
  return {
    calculatorVersion: CALCULATOR_VERSION,
    weightKgAtCalculation: input.weightKg,
    bmi: result.bmi,
    bmrKcal: result.bmrKcal,
    tdeeKcal: result.tdeeKcal,
    goal: input.goal,
    calorieAdjustmentKcal: input.calorieAdjustmentKcal,
    targetCaloriesKcal: result.targetCaloriesKcal,
  };
}

export async function getUserNutritionData(
  userId: string,
): Promise<UserNutritionData> {
  const snapshot = await getDoc(getUserReference(userId));

  return snapshot.exists()
    ? parseUserNutritionData(snapshot.data())
    : {
        nutritionProfile: null,
        caloriePlan: null,
      };
}

export async function saveCalorieCalculation(
  userId: string,
  input: CalorieCalculationInput,
  result: CalorieCalculationResult,
  measuredOn: string,
  saveWeightMeasurement: boolean,
): Promise<void> {
  const userReference = getUserReference(userId);
  const profile = createNutritionProfile(input);
  const plan = createCaloriePlan(input, result);

  if (!saveWeightMeasurement) {
    await setDoc(
      userReference,
      {
        nutritionProfile: profile,
        caloriePlan: {
          ...plan,
          calculatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }

  const batch = writeBatch(db);

  batch.set(
    userReference,
    {
      nutritionProfile: profile,
      caloriePlan: {
        ...plan,
        calculatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  batch.set(
    getBodyMeasurementReference(userId, measuredOn),
    {
      measuredOn,
      measurements: {
        weightKg: input.weightKg,
      },
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
}
