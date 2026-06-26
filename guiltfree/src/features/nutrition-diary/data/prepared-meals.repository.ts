import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromCache,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

import type {
  DiaryProductSnapshot,
  PortionUnit,
} from "../domain/nutrition-diary.types";

const USERS_COLLECTION = "users";
const PREPARED_MEALS_COLLECTION = "preparedMeals";

export type PreparedMealItem = {
  product: DiaryProductSnapshot;
  amount: number;
  unit: PortionUnit;
};

export type PreparedMeal = {
  id: string;
  userId: string;
  name: string;
  items: PreparedMealItem[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

function getPreparedMealsCollection(userId: string) {
  return collection(
    db,
    USERS_COLLECTION,
    userId,
    PREPARED_MEALS_COLLECTION,
  );
}

function getPreparedMealReference(userId: string, preparedMealId: string) {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    PREPARED_MEALS_COLLECTION,
    preparedMealId,
  );
}

function parsePreparedMeal(id: string, data: Record<string, unknown>): PreparedMeal {
  return {
    id,
    userId: String(data.userId),
    name: String(data.name),
    items: Array.isArray(data.items)
      ? (data.items as PreparedMealItem[])
      : [],
    createdAt: (data.createdAt ?? null) as Timestamp | null,
    updatedAt: (data.updatedAt ?? null) as Timestamp | null,
  };
}

async function findPreparedMealsUsing(
  userId: string,
  loadQuery: typeof getDocs,
): Promise<PreparedMeal[]> {
  const snapshot = await loadQuery(
    query(getPreparedMealsCollection(userId), orderBy("updatedAt", "desc")),
  );

  return snapshot.docs.map((preparedMealDocument) =>
    parsePreparedMeal(preparedMealDocument.id, preparedMealDocument.data()),
  );
}

export async function findPreparedMeals(
  userId: string,
): Promise<PreparedMeal[]> {
  return findPreparedMealsUsing(userId, getDocs);
}

export async function findPreparedMealsFromCache(
  userId: string,
): Promise<PreparedMeal[]> {
  return findPreparedMealsUsing(userId, getDocsFromCache);
}

export async function createPreparedMeal(
  userId: string,
  name: string,
  items: PreparedMealItem[],
): Promise<string> {
  const preparedMealReference = await addDoc(getPreparedMealsCollection(userId), {
    userId,
    name,
    items,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return preparedMealReference.id;
}

export async function updatePreparedMeal(
  userId: string,
  preparedMealId: string,
  name: string,
  items: PreparedMealItem[],
): Promise<void> {
  await updateDoc(getPreparedMealReference(userId, preparedMealId), {
    name,
    items,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePreparedMeal(
  userId: string,
  preparedMealId: string,
): Promise<void> {
  await deleteDoc(getPreparedMealReference(userId, preparedMealId));
}
