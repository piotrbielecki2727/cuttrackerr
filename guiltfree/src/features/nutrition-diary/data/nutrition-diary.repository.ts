import {
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import type { Product } from "@/features/products/domain/product.types";
import { db } from "@/lib/firebase/client";

import { parseDiaryEntry } from "../domain/nutrition-diary.schemas";
import type {
  DiaryEntry,
  DiaryProductSnapshot,
  MealType,
  PreparedMealEntryItem,
  PortionUnit,
} from "../domain/nutrition-diary.types";

const USERS_COLLECTION = "users";
const NUTRITION_DAYS_COLLECTION = "nutritionDays";
const ENTRIES_COLLECTION = "entries";
const MEAL_PRODUCT_USAGE_COLLECTION = "mealProductUsage";

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

function getMealProductUsageReference(
  userId: string,
  mealType: MealType,
  productId: string,
) {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    MEAL_PRODUCT_USAGE_COLLECTION,
    `${mealType}_${productId}`,
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

type CreateDiaryEntryFromSnapshotInput = {
  userId: string;
  dateKey: string;
  mealType: MealType;
  amount: number;
  unit: PortionUnit;
  product: DiaryProductSnapshot;
};

type CreatePreparedMealDiaryEntryInput = {
  userId: string;
  dateKey: string;
  mealType: MealType;
  preparedMealId: string;
  preparedMealName: string;
  items: PreparedMealEntryItem[];
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
  const batch = writeBatch(db);

    batch.set(doc(getEntriesCollection(userId, dateKey)), {
      entryType: "product",
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

  batch.set(
    getMealProductUsageReference(userId, mealType, product.id),
    {
      userId,
      mealType,
      productId: product.id,
      lastUsedAt: serverTimestamp(),
      useCount: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
}

export async function createDiaryEntries(
  entries: CreateDiaryEntryInput[],
): Promise<void> {
  const batch = writeBatch(db);

  for (const entry of entries) {
    const unit: PortionUnit =
      entry.product.nutritionBasis === "per_100ml" ? "ml" : "g";

    batch.set(doc(getEntriesCollection(entry.userId, entry.dateKey)), {
      entryType: "product",
      userId: entry.userId,
      dateKey: entry.dateKey,
      mealType: entry.mealType,
      amount: entry.amount,
      unit,
      product: {
        productId: entry.product.id,
        name: entry.product.name,
        ...(entry.product.brand ? { brand: entry.product.brand } : {}),
        nutritionBasis: entry.product.nutritionBasis,
        nutritionPer100: entry.product.nutritionPer100,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(
      getMealProductUsageReference(
        entry.userId,
        entry.mealType,
        entry.product.id,
      ),
      {
        userId: entry.userId,
        mealType: entry.mealType,
        productId: entry.product.id,
        lastUsedAt: serverTimestamp(),
        useCount: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
}

export async function createDiaryEntriesFromSnapshots(
  entries: CreateDiaryEntryFromSnapshotInput[],
): Promise<void> {
  const batch = writeBatch(db);

  for (const entry of entries) {
    batch.set(doc(getEntriesCollection(entry.userId, entry.dateKey)), {
      entryType: "product",
      userId: entry.userId,
      dateKey: entry.dateKey,
      mealType: entry.mealType,
      amount: entry.amount,
      unit: entry.unit,
      product: entry.product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(
      getMealProductUsageReference(
        entry.userId,
        entry.mealType,
        entry.product.productId,
      ),
      {
        userId: entry.userId,
        mealType: entry.mealType,
        productId: entry.product.productId,
        lastUsedAt: serverTimestamp(),
        useCount: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
}

export async function createPreparedMealDiaryEntry({
  userId,
  dateKey,
  mealType,
  preparedMealId,
  preparedMealName,
  items,
}: CreatePreparedMealDiaryEntryInput): Promise<void> {
  const batch = writeBatch(db);

  batch.set(doc(getEntriesCollection(userId, dateKey)), {
    entryType: "prepared_meal",
    userId,
    dateKey,
    mealType,
    preparedMealId,
    preparedMealName,
    items,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (const item of items) {
    batch.set(
      getMealProductUsageReference(userId, mealType, item.product.productId),
      {
        userId,
        mealType,
        productId: item.product.productId,
        lastUsedAt: serverTimestamp(),
        useCount: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
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
