export const PRODUCT_CATEGORIES = [
  "dairy",
  "meat_fish",
  "eggs",
  "bread_bakery",
  "grains_pasta_rice",
  "fruit",
  "vegetables",
  "fats_oils",
  "snacks_sweets",
  "drinks",
  "ready_meals",
  "supplements",
  "other",
] as const;

export const NUTRITION_BASES = ["per_100g", "per_100ml"] as const;

export const ALL_PRODUCT_CATEGORIES = "all" as const;

export const PRODUCT_SEARCH_MIN_LENGTH = 2;
export const PRODUCT_SEARCH_RESULT_LIMIT = 50;

export function isProductCategory(
  value: string,
): value is (typeof PRODUCT_CATEGORIES)[number] {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}