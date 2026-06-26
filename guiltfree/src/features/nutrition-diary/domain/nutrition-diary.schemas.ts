import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import { NUTRITION_BASES } from "@/features/products/domain/product.constants";
import { nutritionPer100Schema } from "@/features/products/domain/product.schemas";

import {
  MEAL_TYPES,
  PORTION_UNITS,
} from "./nutrition-diary.constants";
import type { DiaryEntry } from "./nutrition-diary.types";

const diaryProductSnapshotSchema = z.object({
  productId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(80).optional(),
  nutritionBasis: z.enum(NUTRITION_BASES),
  nutritionPer100: nutritionPer100Schema,
});

const baseDiaryEntryDocumentSchema = z.object({
  userId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(MEAL_TYPES),
  createdAt: z.instanceof(Timestamp).nullable(),
  updatedAt: z.instanceof(Timestamp).nullable(),
});

export const productDiaryEntryDocumentSchema =
  baseDiaryEntryDocumentSchema.extend({
    entryType: z.literal("product").default("product"),
    amount: z.number().finite().positive(),
    unit: z.enum(PORTION_UNITS),
    product: diaryProductSnapshotSchema,
  });

export const preparedMealDiaryEntryDocumentSchema =
  baseDiaryEntryDocumentSchema.extend({
    entryType: z.literal("prepared_meal"),
    preparedMealId: z.string().min(1),
    preparedMealName: z.string().trim().min(1).max(80),
    items: z
      .array(
        z.object({
          product: diaryProductSnapshotSchema,
          amount: z.number().finite().positive(),
          unit: z.enum(PORTION_UNITS),
        }),
      )
      .min(1)
      .max(50),
  });

export const diaryEntryDocumentSchema = z.union([
  preparedMealDiaryEntryDocumentSchema,
  productDiaryEntryDocumentSchema,
]);

const legacyDiaryEntryDocumentSchema = z.object({
  userId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(MEAL_TYPES),
  amount: z.number().finite().positive(),
  unit: z.enum(PORTION_UNITS),
  product: diaryProductSnapshotSchema,
  createdAt: z.instanceof(Timestamp).nullable(),
  updatedAt: z.instanceof(Timestamp).nullable(),
});

export function parseDiaryEntry(
  id: string,
  data: unknown,
): DiaryEntry {
  if (
    typeof data === "object" &&
    data !== null &&
    !("entryType" in data)
  ) {
    return {
      id,
      entryType: "product",
      ...legacyDiaryEntryDocumentSchema.parse(data),
    };
  }

  return {
    id,
    ...diaryEntryDocumentSchema.parse(data),
  };
}
