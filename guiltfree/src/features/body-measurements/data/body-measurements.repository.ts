import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

import {
  cleanBodyMeasurements,
  parseBodyMeasurementDocument,
} from "../domain/body-measurement.schemas";
import type {
  BodyMeasurementEntry,
  BodyMeasurements,
} from "../domain/body-measurement.types";

const USERS_COLLECTION = "users";
const BODY_MEASUREMENTS_COLLECTION = "bodyMeasurements";

function getBodyMeasurementsCollection(userId: string) {
  return collection(
    db,
    USERS_COLLECTION,
    userId,
    BODY_MEASUREMENTS_COLLECTION,
  );
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

export function subscribeToBodyMeasurements(
  userId: string,
  onChange: (measurements: BodyMeasurementEntry[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const measurementsQuery = query(
    getBodyMeasurementsCollection(userId),
    orderBy("measuredOn", "desc"),
  );

  return onSnapshot(
    measurementsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((measurementDocument) =>
          parseBodyMeasurementDocument(
            measurementDocument.id,
            measurementDocument.data(),
          ),
        ),
      );
    },
    onError,
  );
}

export async function saveBodyMeasurement(
  userId: string,
  measuredOn: string,
  measurements: BodyMeasurements,
  note: string,
): Promise<void> {
  const normalizedNote = note.trim();

  await setDoc(
    getBodyMeasurementReference(userId, measuredOn),
    {
      measuredOn,
      measurements: cleanBodyMeasurements(measurements),
      ...(normalizedNote ? { note: normalizedNote } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteBodyMeasurement(
  userId: string,
  measuredOn: string,
): Promise<void> {
  await deleteDoc(getBodyMeasurementReference(userId, measuredOn));
}
