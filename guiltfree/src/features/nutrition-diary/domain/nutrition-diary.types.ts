import type { Timestamp } from "firebase/firestore";

import type {
  NutritionBasis,
  NutritionPer100,
  ProductId,
  UserId,
} from "@/features/products/domain/product.types";

import {
  MEAL_TYPES,
  PORTION_UNITS,
} from "./nutrition-diary.constants";

export type MealType = (typeof MEAL_TYPES)[number];
export type PortionUnit = (typeof PORTION_UNITS)[number];

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
}

export interface DiaryProductSnapshot {
  productId: ProductId;
  name: string;
  brand?: string;
  nutritionBasis: NutritionBasis;
  nutritionPer100: NutritionPer100;
}

export interface PreparedMealEntryItem {
  product: DiaryProductSnapshot;
  amount: number;
  unit: PortionUnit;
}

export interface ProductDiaryEntry {
  id: string;
  entryType: "product";
  userId: UserId;
  dateKey: string;
  mealType: MealType;
  amount: number;
  unit: PortionUnit;
  product: DiaryProductSnapshot;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface PreparedMealDiaryEntry {
  id: string;
  entryType: "prepared_meal";
  userId: UserId;
  dateKey: string;
  mealType: MealType;
  preparedMealId: string;
  preparedMealName: string;
  items: PreparedMealEntryItem[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type DiaryEntry = ProductDiaryEntry | PreparedMealDiaryEntry;
