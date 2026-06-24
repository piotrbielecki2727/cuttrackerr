"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

import {
  findProducts,
  findProductsByIds,
  findProductsByIdsFromCache,
  findProductsFromCache,
} from "../data/product.repository";
import {
  ALL_PRODUCT_CATEGORIES,
} from "../domain/product.constants";
import {
  filterProductsLocally,
  getProductSearchTerms,
  normalizeProductSearchText,
} from "../domain/product.search";
import type {
  Product,
  ProductCategoryFilter,
  ProductId,
} from "../domain/product.types";

type UseProductSearchParams = {
  searchQuery: string;
  brandQuery: string;
  category: ProductCategoryFilter;
  favoritesOnly: boolean;
  favoriteProductIds: ProductId[];
  isFavoritesLoading: boolean;
};

type ProductSearchState = {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
};

const INITIAL_STATE: ProductSearchState = {
  products: [],
  isLoading: true,
  error: null,
};

export function useProductSearch({
  searchQuery,
  brandQuery,
  category,
  favoritesOnly,
  favoriteProductIds,
  isFavoritesLoading,
}: UseProductSearchParams) {
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350);
  const debouncedBrandQuery = useDebouncedValue(brandQuery, 350);

  const [state, setState] =
    useState<ProductSearchState>(INITIAL_STATE);

  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setRefreshKey((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadProducts() {
      const combinedSearchText = [
        debouncedSearchQuery.trim(),
        debouncedBrandQuery.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const normalizedCombinedSearchText =
        normalizeProductSearchText(combinedSearchText);

      const searchTerms = getProductSearchTerms(combinedSearchText);

      const hasTooShortSearch =
        normalizedCombinedSearchText.length > 0 &&
        searchTerms.length === 0;

      if (hasTooShortSearch) {
        setState({
          products: [],
          isLoading: false,
          error: null,
        });

        return;
      }

      if (favoritesOnly && isFavoritesLoading) {
        setState((currentState) => ({
          ...currentState,
          isLoading: true,
          error: null,
        }));

        return;
      }

      if (favoritesOnly && favoriteProductIds.length === 0) {
        setState({
          products: [],
          isLoading: false,
          error: null,
        });

        return;
      }

      setState((currentState) => ({
        ...currentState,
        isLoading: true,
        error: null,
      }));

      try {
        const findParams = {
          searchText: combinedSearchText,
          category:
            category === ALL_PRODUCT_CATEGORIES
              ? undefined
              : category,
        };

        try {
          const cachedSourceProducts = favoritesOnly
            ? await findProductsByIdsFromCache(favoriteProductIds)
            : await findProductsFromCache(findParams);

          const cachedProducts = filterProductsLocally(
            cachedSourceProducts,
            {
              searchQuery: debouncedSearchQuery,
              brandQuery: debouncedBrandQuery,
              category,
            },
          );

          if (isCurrentRequest && cachedProducts.length > 0) {
            setState({
              products: cachedProducts,
              isLoading: true,
              error: null,
            });
          }
        } catch {
          // Brak wpisu w cache jest normalny przy pierwszym uruchomieniu.
        }

        const sourceProducts = favoritesOnly
          ? await findProductsByIds(favoriteProductIds)
          : await findProducts(findParams);

        const products = filterProductsLocally(sourceProducts, {
          searchQuery: debouncedSearchQuery,
          brandQuery: debouncedBrandQuery,
          category,
        });

        if (!isCurrentRequest) {
          return;
        }

        setState({
          products,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }

        setState({
          products: [],
          isLoading: false,
          error:
            error instanceof Error
              ? error
              : new Error("Nie udało się pobrać produktów."),
        });
      }
    }

    void loadProducts();

    return () => {
      isCurrentRequest = false;
    };
  }, [
    category,
    debouncedBrandQuery,
    debouncedSearchQuery,
    favoriteProductIds,
    favoritesOnly,
    isFavoritesLoading,
    refreshKey,
  ]);

  return {
    ...state,
    reload,
  };
}
