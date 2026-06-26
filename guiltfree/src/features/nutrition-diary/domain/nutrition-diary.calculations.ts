import Decimal from "decimal.js";

import type {
  DiaryEntry,
  PreparedMealEntryItem,
  ProductDiaryEntry,
  NutritionSummary,
} from "./nutrition-diary.types";

export const EMPTY_NUTRITION_SUMMARY: NutritionSummary = {
  calories: 0,
  protein: 0,
  carbohydrates: 0,
  fats: 0,
};

function calculateProductNutrition(
  entry: Pick<ProductDiaryEntry, "amount" | "product">,
): NutritionSummary {
  const factor = new Decimal(entry.amount).dividedBy(100);
  const nutrition = entry.product.nutritionPer100;

  return {
    calories: factor.times(nutrition.calories).toNumber(),
    protein: factor.times(nutrition.protein).toNumber(),
    carbohydrates: factor.times(nutrition.carbohydrates).toNumber(),
    fats: factor.times(nutrition.fats).toNumber(),
  };
}

function calculatePreparedMealItemNutrition(
  item: PreparedMealEntryItem,
): NutritionSummary {
  const factor = new Decimal(item.amount).dividedBy(100);
  const nutrition = item.product.nutritionPer100;

  return {
    calories: factor.times(nutrition.calories).toNumber(),
    protein: factor.times(nutrition.protein).toNumber(),
    carbohydrates: factor.times(nutrition.carbohydrates).toNumber(),
    fats: factor.times(nutrition.fats).toNumber(),
  };
}

export function calculateEntryNutrition(entry: DiaryEntry): NutritionSummary {
  if (entry.entryType === "prepared_meal") {
    return sumNutrition(entry.items.map(calculatePreparedMealItemNutrition));
  }

  return calculateProductNutrition(entry);
}

export function sumNutrition(
  summaries: NutritionSummary[],
): NutritionSummary {
  return summaries.reduce<NutritionSummary>(
    (total, summary) => ({
      calories: new Decimal(total.calories)
        .plus(summary.calories)
        .toNumber(),
      protein: new Decimal(total.protein)
        .plus(summary.protein)
        .toNumber(),
      carbohydrates: new Decimal(total.carbohydrates)
        .plus(summary.carbohydrates)
        .toNumber(),
      fats: new Decimal(total.fats).plus(summary.fats).toNumber(),
    }),
    EMPTY_NUTRITION_SUMMARY,
  );
}

export function calculateEntriesNutrition(
  entries: DiaryEntry[],
): NutritionSummary {
  return sumNutrition(entries.map(calculateEntryNutrition));
}
