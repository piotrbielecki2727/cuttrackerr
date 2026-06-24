import {
  productFormSchema,
  type ProductFormValues,
} from "./product.schemas";
import type {
  CreateProductCommand,
  NutritionPer100,
} from "./product.types";

function toOptionalText(value: string): string | undefined {
  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function normalizeNutritionPer100(
  nutrition: ProductFormValues["nutritionPer100"],
): NutritionPer100 {
  const normalizedNutrition: NutritionPer100 = {
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbohydrates: nutrition.carbohydrates,
    fats: nutrition.fats,
  };

  if (nutrition.sugars !== undefined) {
    normalizedNutrition.sugars = nutrition.sugars;
  }

  if (nutrition.saturatedFats !== undefined) {
    normalizedNutrition.saturatedFats = nutrition.saturatedFats;
  }

  if (nutrition.fiber !== undefined) {
    normalizedNutrition.fiber = nutrition.fiber;
  }

  if (nutrition.salt !== undefined) {
    normalizedNutrition.salt = nutrition.salt;
  }

  return normalizedNutrition;
}

export function mapProductFormToCreateCommand(
  rawValues: ProductFormValues,
): CreateProductCommand {
  const values = productFormSchema.parse(rawValues);

  const brand = toOptionalText(values.brand);
  const note = toOptionalText(values.note);

  return {
    isFavorite: values.isFavorite,

    product: {
      name: values.name,
      category: values.category,
      nutritionBasis: values.nutritionBasis,
      nutritionPer100: normalizeNutritionPer100(values.nutritionPer100),

      ...(brand ? { brand } : {}),
      ...(note ? { note } : {}),
    },
  };
}