import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

const USERS_COLLECTION = "users";
const NUTRITION_DAYS_COLLECTION = "nutritionDays";

export type DailyActivity = {
  stepsGoalCompleted: boolean;
  trainingDone: boolean;
  trainingName: string;
};

export const EMPTY_DAILY_ACTIVITY: DailyActivity = {
  stepsGoalCompleted: false,
  trainingDone: false,
  trainingName: "",
};

function getNutritionDayReference(userId: string, dateKey: string) {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    NUTRITION_DAYS_COLLECTION,
    dateKey,
  );
}

function parseDailyActivity(data: Record<string, unknown>): DailyActivity {
  return {
    stepsGoalCompleted: data.stepsGoalCompleted === true,
    trainingDone: data.trainingDone === true,
    trainingName:
      typeof data.trainingName === "string" ? data.trainingName : "",
  };
}

export function subscribeToDailyActivity(
  userId: string,
  dateKey: string,
  onChange: (activity: DailyActivity) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const startedAt = Date.now();

  return onSnapshot(
    getNutritionDayReference(userId, dateKey),
    (snapshot) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[Firestore] Aktywność dnia", {
          source: snapshot.metadata.fromCache ? "cache" : "server",
          dateKey,
          elapsedMs: Date.now() - startedAt,
        });
      }

      if (!snapshot.exists()) {
        onChange(EMPTY_DAILY_ACTIVITY);
        return;
      }

      onChange(parseDailyActivity(snapshot.data()));
    },
    onError,
  );
}

export async function updateDailyActivity(
  userId: string,
  dateKey: string,
  activity: Partial<DailyActivity>,
): Promise<void> {
  const dayReference = getNutritionDayReference(userId, dateKey);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(dayReference);
    const currentData = snapshot.exists() ? snapshot.data() : {};
    const currentWaterMl = Number(currentData.waterMl ?? 0);

    transaction.set(
      dayReference,
      {
        userId,
        dateKey,
        waterMl: Number.isFinite(currentWaterMl) ? currentWaterMl : 0,
        ...activity,
        createdAt: snapshot.exists()
          ? currentData.createdAt ?? serverTimestamp()
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}
