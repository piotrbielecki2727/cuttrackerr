import type { Timestamp } from "firebase/firestore";

import {
  BODY_MEASUREMENT_KEYS,
  BODY_MEASUREMENT_RANGES,
} from "./body-measurement.constants";

export type BodyMeasurementKey = (typeof BODY_MEASUREMENT_KEYS)[number];
export type BodyMeasurementRangeKey =
  (typeof BODY_MEASUREMENT_RANGES)[number]["key"];

export type BodyMeasurements = Partial<Record<BodyMeasurementKey, number>>;

export interface BodyMeasurementDocument {
  measuredOn: string;
  measurements: BodyMeasurements;
  note?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface BodyMeasurementEntry extends BodyMeasurementDocument {
  id: string;
}
