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
  .number({
    error: "Podaj wartość.",
  })
  .finite("Podaj liczbę.")
  .min(0, "Nie może być ujemne.");

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
        message: "Nasycone nie mogą być większe niż tłuszcze.",
      });
    }
  });

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Podaj nazwę min. 2 znaki.")
    .max(120, "Nazwa jest za długa."),

  brand: z
    .string()
    .trim()
    .max(80, "Marka jest za długa."),

  category: z.enum(PRODUCT_CATEGORIES, {
    error: "Wybierz kategorię.",
  }),

  nutritionBasis: z.enum(NUTRITION_BASES, {
    error: "Wybierz jednostkę.",
  }),

  nutritionPer100: nutritionPer100Schema,

  note: z
    .string()
    .trim()
    .max(500, "Notatka jest za długa."),

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
