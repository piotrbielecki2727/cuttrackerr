import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

const USERS_COLLECTION = "users";
const NUTRITION_DAYS_COLLECTION = "nutritionDays";
const MAX_DAILY_WATER_ML = 50000;

function getNutritionDayReference(userId: string, dateKey: string) {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    NUTRITION_DAYS_COLLECTION,
    dateKey,
  );
}

export function subscribeToDailyWater(
  userId: string,
  dateKey: string,
  onChange: (waterMl: number) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    getNutritionDayReference(userId, dateKey),
    (snapshot) => {
      const waterMl = snapshot.exists()
        ? Number(snapshot.data().waterMl ?? 0)
        : 0;

      onChange(Number.isFinite(waterMl) ? waterMl : 0);
    },
    onError,
  );
}

export async function addDailyWater(
  userId: string,
  dateKey: string,
  amountMl: number,
): Promise<void> {
  const dayReference = getNutritionDayReference(userId, dateKey);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(dayReference);
    const currentWaterMl = snapshot.exists()
      ? Number(snapshot.data().waterMl ?? 0)
      : 0;
    const nextWaterMl = Math.min(
      Math.max(currentWaterMl + amountMl, 0),
      MAX_DAILY_WATER_ML,
    );

    transaction.set(
      dayReference,
      {
        userId,
        dateKey,
        waterMl: nextWaterMl,
        createdAt: snapshot.exists()
          ? snapshot.data().createdAt ?? serverTimestamp()
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export async function resetDailyWater(
  userId: string,
  dateKey: string,
): Promise<void> {
  await setDoc(
    getNutritionDayReference(userId, dateKey),
    {
      userId,
      dateKey,
      waterMl: 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
