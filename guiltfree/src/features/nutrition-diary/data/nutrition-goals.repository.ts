import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

import { parseNutritionGoals } from "../domain/nutrition-goals.schemas";
import {
  EMPTY_NUTRITION_GOALS,
  type NutritionGoals,
} from "../domain/nutrition-goals.types";

const USERS_COLLECTION = "users";
const SETTINGS_COLLECTION = "settings";
const NUTRITION_SETTINGS_DOCUMENT = "nutrition";

function getNutritionSettingsReference(userId: string) {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    SETTINGS_COLLECTION,
    NUTRITION_SETTINGS_DOCUMENT,
  );
}

export function subscribeToNutritionGoals(
  userId: string,
  onChange: (goals: NutritionGoals) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const startedAt = Date.now();

  return onSnapshot(
    getNutritionSettingsReference(userId),
    (snapshot) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[Firestore] Cele żywieniowe", {
          source: snapshot.metadata.fromCache ? "cache" : "server",
          elapsedMs: Date.now() - startedAt,
        });
      }

      if (!snapshot.exists()) {
        onChange(EMPTY_NUTRITION_GOALS);
        return;
      }

      onChange(parseNutritionGoals(snapshot.data()));
    },
    onError,
  );
}

export async function saveNutritionGoals(
  userId: string,
  goals: NutritionGoals,
): Promise<void> {
  await setDoc(
    getNutritionSettingsReference(userId),
    {
      ...goals,
      userId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
