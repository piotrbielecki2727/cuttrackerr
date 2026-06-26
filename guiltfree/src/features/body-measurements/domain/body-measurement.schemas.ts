import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import { BODY_MEASUREMENT_KEYS } from "./body-measurement.constants";
import type {
  BodyMeasurementDocument,
  BodyMeasurementEntry,
  BodyMeasurements,
} from "./body-measurement.types";

const optionalWeightSchema = z.number().finite().min(20).max(500).optional();
const optionalCircumferenceSchema = z
  .number()
  .finite()
  .min(10)
  .max(300)
  .optional();

export const bodyMeasurementsSchema = z.object({
  weightKg: optionalWeightSchema,
  waistCm: optionalCircumferenceSchema,
  hipsCm: optionalCircumferenceSchema,
  chestCm: optionalCircumferenceSchema,
  neckCm: optionalCircumferenceSchema,
  armCm: optionalCircumferenceSchema,
  thighCm: optionalCircumferenceSchema,
  calfCm: optionalCircumferenceSchema,
});

export const bodyMeasurementFormSchema = z
  .object({
    measuredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    measurements: bodyMeasurementsSchema,
    note: z.string().trim().max(500),
  })
  .superRefine((value, context) => {
    const hasMeasurement = BODY_MEASUREMENT_KEYS.some(
      (key) => value.measurements[key] !== undefined,
    );

    if (!hasMeasurement) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["measurements"],
        message: "Podaj przynajmniej jeden pomiar.",
      });
    }
  });

export const bodyMeasurementDocumentSchema = z.object({
  measuredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  measurements: bodyMeasurementsSchema,
  note: z.string().trim().max(500).optional(),
  createdAt: z.instanceof(Timestamp).nullable(),
  updatedAt: z.instanceof(Timestamp).nullable(),
});

export type BodyMeasurementFormValues = z.infer<
  typeof bodyMeasurementFormSchema
>;

export function cleanBodyMeasurements(
  measurements: BodyMeasurements,
): BodyMeasurements {
  return Object.fromEntries(
    Object.entries(measurements).filter(([, value]) => value !== undefined),
  ) as BodyMeasurements;
}

export function parseBodyMeasurementDocument(
  id: string,
  data: unknown,
): BodyMeasurementEntry {
  const parsedDocument = bodyMeasurementDocumentSchema.parse(
    data,
  ) as BodyMeasurementDocument;

  return {
    id,
    ...parsedDocument,
  };
}
