"use client";

import { useEffect, useState } from "react";

import {
  subscribeToFavoriteProductIds,
} from "../data/product-preferences.repository";
import type {
  ProductId,
  UserId,
} from "../domain/product.types";

type FavoriteProductsState = {
  userId: UserId | null;
  productIds: ProductId[];
  error: Error | null;
};

const EMPTY_PRODUCT_IDS: ProductId[] = [];

const INITIAL_STATE: FavoriteProductsState = {
  userId: null,
  productIds: EMPTY_PRODUCT_IDS,
  error: null,
};

export function useFavoriteProductIds(userId: UserId | undefined) {
  const [state, setState] =
    useState<FavoriteProductsState>(INITIAL_STATE);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToFavoriteProductIds(
      userId,
      (productIds) => {
        setState({
          userId,
          productIds,
          error: null,
        });
      },
      (error) => {
        setState({
          userId,
          productIds: EMPTY_PRODUCT_IDS,
          error,
        });
      },
    );
  }, [userId]);

  if (!userId) {
    return {
      productIds: EMPTY_PRODUCT_IDS,
      isLoading: false,
      error: null,
    };
  }

  return {
    productIds:
      state.userId === userId ? state.productIds : EMPTY_PRODUCT_IDS,
    isLoading: state.userId !== userId,
    error: state.userId === userId ? state.error : null,
  };
}
