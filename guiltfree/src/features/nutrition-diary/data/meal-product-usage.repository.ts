import {
  collection,
  getDocs,
  getDocsFromCache,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";

import type { ProductId } from "@/features/products/domain/product.types";
import { db } from "@/lib/firebase/client";

import type { MealType } from "../domain/nutrition-diary.types";

const USERS_COLLECTION = "users";
const MEAL_PRODUCT_USAGE_COLLECTION = "mealProductUsage";

export type MealProductUsage = {
  productId: ProductId;
  mealType: MealType;
  lastUsedAt: Timestamp | null;
  useCount: number;
};

function getMealProductUsageCollection(userId: string) {
  return collection(
    db,
    USERS_COLLECTION,
    userId,
    MEAL_PRODUCT_USAGE_COLLECTION,
  );
}

function parseMealProductUsage(data: Record<string, unknown>): MealProductUsage {
  return {
    productId: String(data.productId) as ProductId,
    mealType: data.mealType as MealType,
    lastUsedAt: (data.lastUsedAt ?? null) as Timestamp | null,
    useCount:
      typeof data.useCount === "number" && Number.isFinite(data.useCount)
        ? data.useCount
        : 0,
  };
}

async function findMealProductUsageUsing(
  userId: string,
  mealType: MealType,
  loadQuery: typeof getDocs,
): Promise<MealProductUsage[]> {
  const snapshot = await loadQuery(
    query(
      getMealProductUsageCollection(userId),
      where("mealType", "==", mealType),
    ),
  );

  return snapshot.docs.map((document) =>
    parseMealProductUsage(document.data()),
  );
}

export async function findMealProductUsage(
  userId: string,
  mealType: MealType,
): Promise<MealProductUsage[]> {
  return findMealProductUsageUsing(userId, mealType, getDocs);
}

export async function findMealProductUsageFromCache(
  userId: string,
  mealType: MealType,
): Promise<MealProductUsage[]> {
  return findMealProductUsageUsing(userId, mealType, getDocsFromCache);
}
