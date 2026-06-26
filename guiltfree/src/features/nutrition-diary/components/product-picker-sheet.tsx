"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  PackageOpen,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  findProducts,
  findProductsByIds,
  findProductsByIdsFromCache,
  findProductsFromCache,
} from "@/features/products/data/product.repository";
import type { Product } from "@/features/products/domain/product.types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

import {
  findMealProductUsage,
  findMealProductUsageFromCache,
  type MealProductUsage,
} from "../data/meal-product-usage.repository";
import {
  createDiaryEntries,
  createPreparedMealDiaryEntry,
} from "../data/nutrition-diary.repository";
import {
  findPreparedMeals,
  findPreparedMealsFromCache,
  type PreparedMeal,
} from "../data/prepared-meals.repository";
import { MEAL_TYPE_LABELS } from "../domain/nutrition-diary.constants";
import type { MealType } from "../domain/nutrition-diary.types";

type ProductPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  dateKey: string;
  mealType: MealType | null;
};

type SelectedProductDraft = {
  product: Product;
  amount: string;
  error: string | null;
};

function formatValue(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 1,
  }).format(value);
}

function getUsageTime(usage: MealProductUsage | undefined): number {
  return usage?.lastUsedAt?.toMillis?.() ?? 0;
}

function mergeProducts(products: Product[]): Product[] {
  return Array.from(
    new Map(products.map((product) => [product.id, product])).values(),
  );
}

function sortProductsByMealUsage(
  products: Product[],
  usageByProductId: Map<string, MealProductUsage>,
): Product[] {
  return [...products].sort((firstProduct, secondProduct) => {
    const firstUsage = usageByProductId.get(firstProduct.id);
    const secondUsage = usageByProductId.get(secondProduct.id);
    const firstTime = getUsageTime(firstUsage);
    const secondTime = getUsageTime(secondUsage);

    if (firstTime !== secondTime) {
      return secondTime - firstTime;
    }

    return firstProduct.name.localeCompare(secondProduct.name, "pl");
  });
}

export function ProductPickerSheet({
  open,
  onOpenChange,
  userId,
  dateKey,
  mealType,
}: ProductPickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [mealUsage, setMealUsage] = useState<MealProductUsage[]>([]);
  const [preparedMeals, setPreparedMeals] = useState<PreparedMeal[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, SelectedProductDraft>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [addingPreparedMealId, setAddingPreparedMealId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const usageByProductId = useMemo(
    () => new Map(mealUsage.map((usage) => [usage.productId, usage])),
    [mealUsage],
  );
  const sortedProducts = useMemo(
    () => sortProductsByMealUsage(products, usageByProductId),
    [products, usageByProductId],
  );
  const selectedDrafts = useMemo(
    () => Object.values(selectedProducts),
    [selectedProducts],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCurrentRequest = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      if (!mealType) {
        return;
      }

      try {
        let currentUsage: MealProductUsage[] = [];

        try {
          currentUsage = await findMealProductUsageFromCache(userId, mealType);

          if (isCurrentRequest) {
            setMealUsage(currentUsage);
          }
        } catch {
          // Cache może być pusty przy pierwszym wejściu.
        }

        try {
          currentUsage = await findMealProductUsage(userId, mealType);

          if (isCurrentRequest) {
            setMealUsage(currentUsage);
          }
        } catch {
          currentUsage = [];
        }

        const shouldIncludeRecentProducts =
          debouncedSearchQuery.trim().length === 0;
        const recentProductIds = shouldIncludeRecentProducts
          ? currentUsage
          .filter((usage) => usage.productId)
          .sort((firstUsage, secondUsage) => {
            const firstTime = getUsageTime(firstUsage);
            const secondTime = getUsageTime(secondUsage);

            if (firstTime !== secondTime) {
              return secondTime - firstTime;
            }

            return secondUsage.useCount - firstUsage.useCount;
          })
          .slice(0, 20)
              .map((usage) => usage.productId)
          : [];
        let recentProducts: Product[] = [];

        if (recentProductIds.length > 0) {
          try {
            recentProducts = await findProductsByIdsFromCache(recentProductIds);
          } catch {
            // Jeżeli cache nie zna produktów, pobierzemy je z serwera.
          }

          try {
            recentProducts = await findProductsByIds(recentProductIds);
          } catch {
            // Brak ostatnich produktów nie blokuje zwykłej listy.
          }
        }

        try {
          const cachedProducts = await findProductsFromCache({
            searchText: debouncedSearchQuery,
            limitCount: 20,
          });

          if (isCurrentRequest && cachedProducts.length > 0) {
            setProducts(mergeProducts([...recentProducts, ...cachedProducts]));
          }
        } catch {
          // Pierwsze uruchomienie może nie mieć jeszcze danych w cache.
        }

        const nextProducts = await findProducts({
          searchText: debouncedSearchQuery,
          limitCount: 20,
        });

        if (isCurrentRequest) {
          setProducts(mergeProducts([...recentProducts, ...nextProducts]));
        }
      } catch {
        if (isCurrentRequest) {
          setError("Nie udało się pobrać produktów.");
          setProducts([]);
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isCurrentRequest = false;
    };
  }, [debouncedSearchQuery, mealType, open, userId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCurrentRequest = true;

    async function loadPreparedMeals() {
      try {
        try {
          const cachedMeals = await findPreparedMealsFromCache(userId);

          if (isCurrentRequest && cachedMeals.length > 0) {
            setPreparedMeals(cachedMeals);
          }
        } catch {
          // Cache może być pusty.
        }

        const nextMeals = await findPreparedMeals(userId);

        if (isCurrentRequest) {
          setPreparedMeals(nextMeals);
        }
      } catch {
        if (isCurrentRequest) {
          setPreparedMeals([]);
        }
      }
    }

    void loadPreparedMeals();

    return () => {
      isCurrentRequest = false;
    };
  }, [open, userId]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedProducts({});
      setError(null);
    }

    onOpenChange(nextOpen);
  }

  function toggleProduct(product: Product) {
    setSelectedProducts((currentProducts) => {
      if (currentProducts[product.id]) {
        const nextProducts = { ...currentProducts };
        delete nextProducts[product.id];
        return nextProducts;
      }

      return {
        ...currentProducts,
        [product.id]: {
          product,
          amount: "100",
          error: null,
        },
      };
    });
  }

  function updateProductAmount(productId: string, amount: string) {
    setSelectedProducts((currentProducts) => ({
      ...currentProducts,
      [productId]: {
        ...currentProducts[productId],
        amount,
        error: null,
      },
    }));
  }

  async function handleAddProducts() {
    const drafts = Object.values(selectedProducts);

    if (!mealType || drafts.length === 0) {
      return;
    }

    const parsedDrafts = drafts.map((draft) => ({
      ...draft,
      parsedAmount: Number(draft.amount.trim().replace(",", ".")),
    }));
    const hasInvalidAmount = parsedDrafts.some(
      (draft) =>
        !Number.isFinite(draft.parsedAmount) ||
        draft.parsedAmount <= 0 ||
        draft.parsedAmount > 10000,
    );

    if (hasInvalidAmount) {
      setSelectedProducts((currentProducts) =>
        Object.fromEntries(
          Object.entries(currentProducts).map(([productId, draft]) => {
            const parsedAmount = Number(draft.amount.trim().replace(",", "."));
            const isInvalid =
              !Number.isFinite(parsedAmount) ||
              parsedAmount <= 0 ||
              parsedAmount > 10000;

            return [
              productId,
              {
                ...draft,
                error: isInvalid ? "Podaj 1–10 000." : null,
              },
            ];
          }),
        ),
      );
      setError("Popraw ilości przy zaznaczonych produktach.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createDiaryEntries(
        parsedDrafts.map((draft) => ({
          userId,
          dateKey,
          mealType,
          amount: draft.parsedAmount,
          product: draft.product,
        })),
      );

      handleOpenChange(false);
    } catch {
      setError("Nie udało się dodać produktów do posiłku.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddPreparedMeal(preparedMeal: PreparedMeal) {
    if (!mealType || preparedMeal.items.length === 0) {
      return;
    }

    setAddingPreparedMealId(preparedMeal.id);
    setError(null);

    try {
      await createPreparedMealDiaryEntry({
        userId,
        dateKey,
        mealType,
        preparedMealId: preparedMeal.id,
        preparedMealName: preparedMeal.name,
        items: preparedMeal.items.map((item) => ({
          product: item.product,
          amount: item.amount,
          unit: item.unit,
        })),
      });

      handleOpenChange(false);
    } catch {
      setError("Nie udało się dodać gotowego posiłku.");
    } finally {
      setAddingPreparedMealId(null);
    }
  }

  const selectedCount = selectedDrafts.length;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="max-h-[92dvh] rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-y-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none"
        side="bottom"
      >
        <SheetHeader className="border-b px-5 pb-4 pt-5">
          <SheetTitle className="text-lg">
            Dodaj do: {mealType ? MEAL_TYPE_LABELS[mealType] : "posiłku"}
          </SheetTitle>
          <SheetDescription>
            Zaznacz jeden lub kilka produktów, wpisz ilości i dodaj je naraz.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="sticky top-0 z-10 bg-popover py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                className="h-12 pl-10 text-base"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Szukaj produktu..."
                type="search"
                value={searchQuery}
              />
            </div>
          </div>

          {debouncedSearchQuery.trim().length === 0 && (
            <section className="mb-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Gotowe posiłki</p>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/prepared-meals">Zarządzaj</Link>
                </Button>
              </div>

              {preparedMeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Nie masz jeszcze gotowych posiłków.
                </div>
              ) : (
                <div className="space-y-2">
                  {preparedMeals.slice(0, 5).map((preparedMeal) => (
                    <div
                      className="flex items-center gap-3 rounded-2xl border bg-background p-3"
                      key={preparedMeal.id}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {preparedMeal.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {preparedMeal.items.length} produktów
                        </p>
                      </div>

                      <Button
                        disabled={addingPreparedMealId !== null}
                        onClick={() => handleAddPreparedMeal(preparedMeal)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {addingPreparedMealId === preparedMeal.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                        Dodaj
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {isLoading && products.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Szukam produktów...
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <PackageOpen className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Brak produktów</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Zmień wyszukiwanie albo dodaj produkt do bazy.
              </p>
            </div>
          )}

          {products.length > 0 && (
            <div className="space-y-2 pb-4">
              {sortedProducts.map((product) => {
                const selectedDraft = selectedProducts[product.id];
                const isSelected = Boolean(selectedDraft);
                const unit = product.nutritionBasis === "per_100ml" ? "ml" : "g";
                const mealUsage = usageByProductId.get(product.id);

                return (
                  <div className="rounded-2xl border bg-background" key={product.id}>
                    <button
                      className="flex min-h-16 w-full items-center gap-3 p-3 text-left"
                      onClick={() => toggleProduct(product)}
                      type="button"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {product.brand || "Bez marki"} ·{" "}
                          {formatValue(product.nutritionPer100.calories)} kcal /
                          100 {unit}
                        </p>
                        {mealUsage && (
                          <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            Ostatnio w tym posiłku
                          </p>
                        )}
                      </div>

                      <div
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full border",
                          isSelected &&
                            "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {isSelected && <Check className="size-4" />}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {isLoading && products.length > 0 && (
            <div className="sticky bottom-2 mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border bg-popover/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
              <Loader2 className="size-3 animate-spin" />
              Aktualizuję wyniki...
            </div>
          )}
        </div>

        <SheetFooter className="border-t bg-popover px-4 pt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              Zaznaczone produkty
            </span>
            <span className="font-semibold tabular-nums">{selectedCount}</span>
          </div>

          {selectedDrafts.length > 0 && (
            <div className="mb-3 max-h-52 space-y-2 overflow-y-auto pr-1">
              {selectedDrafts.map((draft) => {
                const unit =
                  draft.product.nutritionBasis === "per_100ml" ? "ml" : "g";

                return (
                  <div
                    className="rounded-2xl border bg-background/80 p-3"
                    key={draft.product.id}
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {draft.product.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {draft.product.brand || "Bez marki"}
                        </p>
                      </div>

                      <Button
                        aria-label={`Usuń ${draft.product.name} z wybranych`}
                        className="size-8 shrink-0"
                        onClick={() => toggleProduct(draft.product)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    <div className="relative">
                      <Input
                        className={cn(
                          "h-10 pr-12 text-base tabular-nums",
                          draft.error &&
                            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                        )}
                        inputMode="decimal"
                        min="0.1"
                        onChange={(event) =>
                          updateProductAmount(
                            draft.product.id,
                            event.target.value,
                          )
                        }
                        placeholder="Ilość"
                        step="0.1"
                        type="text"
                        value={draft.amount}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                        {unit}
                      </span>
                    </div>

                    {draft.error && (
                      <p className="mt-1.5 text-xs text-destructive" role="alert">
                        {draft.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <p className="mb-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            className="h-12 w-full text-base"
            disabled={selectedCount === 0 || isSaving}
            onClick={handleAddProducts}
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {selectedCount === 1
              ? "Dodaj 1 produkt"
              : `Dodaj ${selectedCount} produktów`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
