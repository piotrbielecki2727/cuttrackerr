import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import {
  NUTRITION_BASES,
  PRODUCT_CATEGORIES,
} from "./product.constants";
import { createProductSearchIndex } from "./product.search";
import type {
  Product,
  ProductId,
  ProductSearchIndex,
} from "./product.types";

const nonNegativeNumberSchema = z
  .number()
  .finite("Podaj prawidłową liczbę.")
  .min(0, "Wartość nie może być ujemna.");

const optionalNonNegativeNumberSchema = nonNegativeNumberSchema.optional();

export const nutritionPer100Schema = z
  .object({
    calories: nonNegativeNumberSchema,
    protein: nonNegativeNumberSchema,
    carbohydrates: nonNegativeNumberSchema,
    fats: nonNegativeNumberSchema,

    sugars: optionalNonNegativeNumberSchema,
    saturatedFats: optionalNonNegativeNumberSchema,
    fiber: optionalNonNegativeNumberSchema,
    salt: optionalNonNegativeNumberSchema,
  })
  .superRefine((nutrition, context) => {
    if (
      nutrition.sugars !== undefined &&
      nutrition.sugars > nutrition.carbohydrates
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sugars"],
        message: "Cukry nie mogą być większe niż węglowodany.",
      });
    }

    if (
      nutrition.saturatedFats !== undefined &&
      nutrition.saturatedFats > nutrition.fats
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["saturatedFats"],
        message: "Tłuszcze nasycone nie mogą być większe niż tłuszcze.",
      });
    }
  });

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nazwa produktu musi mieć minimum 2 znaki.")
    .max(120, "Nazwa produktu może mieć maksymalnie 120 znaków."),

  brand: z
    .string()
    .trim()
    .max(80, "Marka może mieć maksymalnie 80 znaków."),

  category: z.enum(PRODUCT_CATEGORIES),

  nutritionBasis: z.enum(NUTRITION_BASES),

  nutritionPer100: nutritionPer100Schema,

  note: z
    .string()
    .trim()
    .max(500, "Notatka może mieć maksymalnie 500 znaków."),

  isFavorite: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const productDocumentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().min(1).max(80).optional(),
  category: z.enum(PRODUCT_CATEGORIES),

  nutritionBasis: z.enum(NUTRITION_BASES),
  nutritionPer100: nutritionPer100Schema,

  note: z.string().trim().min(1).max(500).optional(),

  normalizedName: z.string().trim().min(1).optional(),
  normalizedBrand: z.string().trim().min(1).optional(),
  searchTokens: z.array(z.string().trim().min(2)).max(160).optional(),

  createdBy: z.string().min(1),
  createdAt: z.instanceof(Timestamp).nullable(),
  updatedAt: z.instanceof(Timestamp).nullable(),
});

export function parseProductDocument(
  id: ProductId,
  data: unknown,
): Product {
  const parsedProduct = productDocumentSchema.parse(data);

  const fallbackSearchIndex = createProductSearchIndex(parsedProduct);

  const searchIndex: ProductSearchIndex = {
    normalizedName:
      parsedProduct.normalizedName ?? fallbackSearchIndex.normalizedName,

    searchTokens:
      parsedProduct.searchTokens ?? fallbackSearchIndex.searchTokens,

    ...(parsedProduct.normalizedBrand ??
    fallbackSearchIndex.normalizedBrand
      ? {
          normalizedBrand:
            parsedProduct.normalizedBrand ??
            fallbackSearchIndex.normalizedBrand,
        }
      : {}),
  };

  return {
    id,
    ...parsedProduct,
    ...searchIndex,
  };
}