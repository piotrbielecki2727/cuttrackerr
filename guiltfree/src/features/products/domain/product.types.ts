import type { Timestamp } from "firebase/firestore";

import {
  ALL_PRODUCT_CATEGORIES,
  NUTRITION_BASES,
  PRODUCT_CATEGORIES,
} from "./product.constants";

export type ProductId = string;
export type UserId = string;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductCategoryFilter =
  | ProductCategory
  | typeof ALL_PRODUCT_CATEGORIES;

export type NutritionBasis = (typeof NUTRITION_BASES)[number];

export type FirestoreTimestamp = Timestamp | null;

export interface NutritionPer100 {
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;

  sugars?: number;
  saturatedFats?: number;
  fiber?: number;
  salt?: number;
}

export interface CreateProductInput {
  name: string;
  brand?: string;
  category: ProductCategory;
  nutritionBasis: NutritionBasis;
  nutritionPer100: NutritionPer100;
  note?: string;
}

export interface ProductSearchIndex {
  normalizedName: string;
  normalizedBrand?: string;
  searchTokens: string[];
}

export interface CreateProductCommand {
  product: CreateProductInput;
  isFavorite: boolean;
}

export interface ProductDocument
  extends CreateProductInput,
    ProductSearchIndex {
  createdBy: UserId;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface Product extends ProductDocument {
  id: ProductId;
}

export interface ProductPreferenceDocument {
  productId: ProductId;
  isFavorite: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ProductListFilters {
  searchQuery: string;
  brandQuery: string;
  category: ProductCategoryFilter;
  favoritesOnly: boolean;
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  dairy: "Nabiał",
  meat_fish: "Mięso i ryby",
  eggs: "Jajka",
  bread_bakery: "Pieczywo",
  grains_pasta_rice: "Ryż, makaron i kasze",
  fruit: "Owoce",
  vegetables: "Warzywa",
  fats_oils: "Tłuszcze i oleje",
  snacks_sweets: "Przekąski i słodycze",
  drinks: "Napoje",
  ready_meals: "Dania gotowe",
  supplements: "Suplementy",
  other: "Inne",
};

export const NUTRITION_BASIS_LABELS: Record<NutritionBasis, string> = {
  per_100g: "100 g",
  per_100ml: "100 ml",
};