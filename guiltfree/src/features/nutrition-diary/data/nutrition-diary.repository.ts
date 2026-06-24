import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import type { Product } from "@/features/products/domain/product.types";
import { db } from "@/lib/firebase/client";

import { parseDiaryEntry } from "../domain/nutrition-diary.schemas";
import type {
  DiaryEntry,
  MealType,
  PortionUnit,
} from "../domain/nutrition-diary.types";

const USERS_COLLECTION = "users";
const NUTRITION_DAYS_COLLECTION = "nutritionDays";
const ENTRIES_COLLECTION = "entries";

function getEntriesCollection(userId: string, dateKey: string) {
  return collection(
    db,
    USERS_COLLECTION,
    userId,
    NUTRITION_DAYS_COLLECTION,
    dateKey,
    ENTRIES_COLLECTION,
  );
}

function getEntryReference(
  userId: string,
  dateKey: string,
  entryId: string,
) {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    NUTRITION_DAYS_COLLECTION,
    dateKey,
    ENTRIES_COLLECTION,
    entryId,
  );
}

export function subscribeToDiaryEntries(
  userId: string,
  dateKey: string,
  onChange: (entries: DiaryEntry[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const startedAt = Date.now();
  const entriesQuery = query(
    getEntriesCollection(userId, dateKey),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    entriesQuery,
    (snapshot) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[Firestore] Wpisy dziennika", {
          source: snapshot.metadata.fromCache ? "cache" : "server",
          dateKey,
          count: snapshot.size,
          elapsedMs: Date.now() - startedAt,
        });
      }

      onChange(
        snapshot.docs.map((entryDocument) =>
          parseDiaryEntry(entryDocument.id, entryDocument.data()),
        ),
      );
    },
    onError,
  );
}

type CreateDiaryEntryInput = {
  userId: string;
  dateKey: string;
  mealType: MealType;
  amount: number;
  product: Product;
};

export async function createDiaryEntry({
  userId,
  dateKey,
  mealType,
  amount,
  product,
}: CreateDiaryEntryInput): Promise<void> {
  const unit: PortionUnit =
    product.nutritionBasis === "per_100ml" ? "ml" : "g";

  await addDoc(getEntriesCollection(userId, dateKey), {
    userId,
    dateKey,
    mealType,
    amount,
    unit,
    product: {
      productId: product.id,
      name: product.name,
      ...(product.brand ? { brand: product.brand } : {}),
      nutritionBasis: product.nutritionBasis,
      nutritionPer100: product.nutritionPer100,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDiaryEntryAmount(
  userId: string,
  dateKey: string,
  entryId: string,
  amount: number,
): Promise<void> {
  await updateDoc(getEntryReference(userId, dateKey, entryId), {
    amount,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDiaryEntry(
  userId: string,
  dateKey: string,
  entryId: string,
): Promise<void> {
  await deleteDoc(getEntryReference(userId, dateKey, entryId));
}
