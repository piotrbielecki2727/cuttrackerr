"use client";

import { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import {
  Check,
  Copy,
  Loader2,
  Pencil,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  findProducts,
  findProductsFromCache,
} from "@/features/products/data/product.repository";
import type { Product } from "@/features/products/domain/product.types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

import {
  createPreparedMeal,
  deletePreparedMeal,
  findPreparedMeals,
  findPreparedMealsFromCache,
  updatePreparedMeal,
  type PreparedMeal,
  type PreparedMealItem,
} from "../data/prepared-meals.repository";
import type {
  DiaryProductSnapshot,
  NutritionSummary,
  PortionUnit,
} from "../domain/nutrition-diary.types";

type PreparedMealsManagerProps = {
  userId: string;
};

type DraftItem = {
  product: DiaryProductSnapshot;
  amount: string;
  unit: PortionUnit;
  error: string | null;
};

const EMPTY_SUMMARY: NutritionSummary = {
  calories: 0,
  protein: 0,
  carbohydrates: 0,
  fats: 0,
};

function formatNutrition(value: number, calories = false): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: calories ? 0 : 1,
  }).format(value);
}

function productToSnapshot(product: Product): DiaryProductSnapshot {
  return {
    productId: product.id,
    name: product.name,
    ...(product.brand ? { brand: product.brand } : {}),
    nutritionBasis: product.nutritionBasis,
    nutritionPer100: product.nutritionPer100,
  };
}

function itemToSummary(item: Pick<PreparedMealItem, "amount" | "product">) {
  const factor = new Decimal(item.amount).dividedBy(100);
  const nutrition = item.product.nutritionPer100;

  return {
    calories: factor.times(nutrition.calories).toNumber(),
    protein: factor.times(nutrition.protein).toNumber(),
    carbohydrates: factor.times(nutrition.carbohydrates).toNumber(),
    fats: factor.times(nutrition.fats).toNumber(),
  };
}

function sumSummary(items: Array<Pick<PreparedMealItem, "amount" | "product">>) {
  return items.reduce<NutritionSummary>(
    (total, item) => {
      const itemSummary = itemToSummary(item);

      return {
        calories: new Decimal(total.calories).plus(itemSummary.calories).toNumber(),
        protein: new Decimal(total.protein).plus(itemSummary.protein).toNumber(),
        carbohydrates: new Decimal(total.carbohydrates)
          .plus(itemSummary.carbohydrates)
          .toNumber(),
        fats: new Decimal(total.fats).plus(itemSummary.fats).toNumber(),
      };
    },
    EMPTY_SUMMARY,
  );
}

function mealSummary(meal: PreparedMeal): NutritionSummary {
  return sumSummary(meal.items);
}

function draftSummary(items: DraftItem[]): NutritionSummary {
  return sumSummary(
    items
      .map((item) => ({
        product: item.product,
        amount: Number(item.amount.trim().replace(",", ".")),
      }))
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0),
  );
}

function createItemsFromMeal(meal: PreparedMeal): Record<string, DraftItem> {
  return Object.fromEntries(
    meal.items.map((item) => [
      item.product.productId,
      {
        product: item.product,
        amount: String(item.amount),
        unit: item.unit,
        error: null,
      },
    ]),
  );
}

function normalizeMealName(value: string): string {
  return value.trim().toLocaleLowerCase("pl-PL");
}

function createMealItemsSignature(
  items: Array<Pick<PreparedMealItem, "amount" | "product" | "unit">>,
): string {
  return items
    .map((item) => ({
      productId: item.product.productId,
      unit: item.unit,
      amount: new Decimal(item.amount).toDecimalPlaces(3).toString(),
    }))
    .sort((firstItem, secondItem) =>
      firstItem.productId.localeCompare(secondItem.productId),
    )
    .map((item) => `${item.productId}:${item.amount}:${item.unit}`)
    .join("|");
}

function createDuplicateName(
  baseName: string,
  preparedMeals: PreparedMeal[],
): string {
  const cleanBaseName = baseName.replace(/\s+kopia(?:\s+\d+)?$/i, "").trim();
  const existingNames = new Set(
    preparedMeals.map((meal) => normalizeMealName(meal.name)),
  );
  const firstCandidate = `${cleanBaseName} kopia`;

  if (!existingNames.has(normalizeMealName(firstCandidate))) {
    return firstCandidate;
  }

  for (let copyIndex = 2; copyIndex < 100; copyIndex += 1) {
    const candidate = `${cleanBaseName} kopia ${copyIndex}`;

    if (!existingNames.has(normalizeMealName(candidate))) {
      return candidate;
    }
  }

  return `${cleanBaseName} kopia`;
}

export function PreparedMealsManager({ userId }: PreparedMealsManagerProps) {
  const [preparedMeals, setPreparedMeals] = useState<PreparedMeal[]>([]);
  const [editedMealId, setEditedMealId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [items, setItems] = useState<Record<string, DraftItem>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const draftItems = useMemo(() => Object.values(items), [items]);
  const summary = useMemo(() => draftSummary(draftItems), [draftItems]);

  async function refreshPreparedMeals() {
    setError(null);

    try {
      try {
        const cachedMeals = await findPreparedMealsFromCache(userId);

        if (cachedMeals.length > 0) {
          setPreparedMeals(cachedMeals);
        }
      } catch {
        // Cache może być pusty.
      }

      setPreparedMeals(await findPreparedMeals(userId));
    } catch {
      setError("Nie udało się pobrać gotowych posiłków.");
    } finally {
      setIsLoadingMeals(false);
    }
  }

  useEffect(() => {
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
          setError("Nie udało się pobrać gotowych posiłków.");
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingMeals(false);
        }
      }
    }

    void loadPreparedMeals();

    return () => {
      isCurrentRequest = false;
    };
  }, [userId]);

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadProducts() {
      setIsLoadingProducts(true);

      try {
        try {
          const cachedProducts = await findProductsFromCache({
            searchText: debouncedSearchQuery,
            limitCount: 20,
          });

          if (isCurrentRequest && cachedProducts.length > 0) {
            setProducts(cachedProducts);
          }
        } catch {
          // Cache może być pusty.
        }

        const nextProducts = await findProducts({
          searchText: debouncedSearchQuery,
          limitCount: 20,
        });

        if (isCurrentRequest) {
          setProducts(nextProducts);
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isCurrentRequest = false;
    };
  }, [debouncedSearchQuery]);

  function resetEditor() {
    setEditedMealId(null);
    setName("");
    setItems({});
    setSearchQuery("");
    setError(null);
  }

  function editMeal(meal: PreparedMeal) {
    setEditedMealId(meal.id);
    setName(meal.name);
    setItems(createItemsFromMeal(meal));
    setError(null);
  }

  function duplicateMeal(meal: PreparedMeal) {
    setEditedMealId(null);
    setName(createDuplicateName(meal.name, preparedMeals));
    setItems(createItemsFromMeal(meal));
    setSearchQuery("");
    setError(
      "Duplikat jest wstępnie uzupełniony. Zmień skład lub gramatury przed zapisem.",
    );
  }

  function toggleProduct(product: Product) {
    setItems((currentItems) => {
      if (currentItems[product.id]) {
        const nextItems = { ...currentItems };
        delete nextItems[product.id];
        return nextItems;
      }

      return {
        ...currentItems,
        [product.id]: {
          product: productToSnapshot(product),
          amount: "100",
          unit: product.nutritionBasis === "per_100ml" ? "ml" : "g",
          error: null,
        },
      };
    });
  }

  function updateAmount(productId: string, amount: string) {
    setItems((currentItems) => ({
      ...currentItems,
      [productId]: {
        ...currentItems[productId],
        amount,
        error: null,
      },
    }));
  }

  async function saveMeal() {
    const normalizedName = name.trim();

    if (normalizedName.length < 2) {
      setError("Podaj nazwę posiłku.");
      return;
    }

    if (draftItems.length === 0) {
      setError("Dodaj przynajmniej jeden produkt.");
      return;
    }

    const parsedItems = draftItems.map((item) => ({
      ...item,
      parsedAmount: Number(item.amount.trim().replace(",", ".")),
    }));
    const hasInvalidAmount = parsedItems.some(
      (item) =>
        !Number.isFinite(item.parsedAmount) ||
        item.parsedAmount <= 0 ||
        item.parsedAmount > 10000,
    );

    if (hasInvalidAmount) {
      setItems((currentItems) =>
        Object.fromEntries(
          Object.entries(currentItems).map(([productId, item]) => {
            const parsedAmount = Number(item.amount.trim().replace(",", "."));
            const isInvalid =
              !Number.isFinite(parsedAmount) ||
              parsedAmount <= 0 ||
              parsedAmount > 10000;

            return [
              productId,
              {
                ...item,
                error: isInvalid ? "Podaj 1–10 000." : null,
              },
            ];
          }),
        ),
      );
      setError("Popraw ilości produktów.");
      return;
    }

    const nextItems: PreparedMealItem[] = parsedItems.map((item) => ({
      product: item.product,
      amount: item.parsedAmount,
      unit: item.unit,
    }));
    const normalizedNewName = normalizeMealName(normalizedName);
    const nextItemsSignature = createMealItemsSignature(nextItems);
    const hasDuplicateName = preparedMeals.some(
      (meal) =>
        meal.id !== editedMealId &&
        normalizeMealName(meal.name) === normalizedNewName,
    );
    const hasDuplicateComposition = preparedMeals.some(
      (meal) =>
        meal.id !== editedMealId &&
        createMealItemsSignature(meal.items) === nextItemsSignature,
    );

    if (hasDuplicateName) {
      setError("Masz już gotowy posiłek o takiej nazwie.");
      return;
    }

    if (hasDuplicateComposition) {
      setError("Masz już gotowy posiłek z takim samym składem i gramaturami.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editedMealId) {
        await updatePreparedMeal(userId, editedMealId, normalizedName, nextItems);
      } else {
        await createPreparedMeal(userId, normalizedName, nextItems);
      }

      resetEditor();
      await refreshPreparedMeals();
    } catch {
      setError("Nie udało się zapisać gotowego posiłku.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeMeal(mealId: string) {
    setDeletingMealId(mealId);
    setError(null);

    try {
      await deletePreparedMeal(userId, mealId);

      if (editedMealId === mealId) {
        resetEditor();
      }

      await refreshPreparedMeals();
    } catch {
      setError("Nie udało się usunąć gotowego posiłku.");
    } finally {
      setDeletingMealId(null);
    }
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--dashboard-tint)_0%,var(--background)_28rem)]">
      <div className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.8fr)]">
        <section>
          <div className="mb-5">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Twoja baza
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Gotowe posiłki
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Twórz własne zestawy produktów, np. tosty, owsiankę albo obiad,
              a potem dodawaj je do dnia jednym kliknięciem.
            </p>
          </div>

          {error && (
            <Card className="mb-4 border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          {isLoadingMeals && preparedMeals.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Pobieram gotowe posiłki...
              </CardContent>
            </Card>
          ) : preparedMeals.length === 0 ? (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="px-6 py-14 text-center">
                <p className="font-medium">Nie masz jeszcze gotowych posiłków.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stwórz pierwszy po prawej stronie.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {preparedMeals.map((meal) => {
                const mealNutrition = mealSummary(meal);

                return (
                  <Card
                    className={cn(
                      "overflow-hidden",
                      editedMealId === meal.id && "border-primary",
                    )}
                    key={meal.id}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate font-semibold">{meal.name}</h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {meal.items.length} produktów
                          </p>
                        </div>
                        <Button
                          aria-label={`Duplikuj ${meal.name}`}
                          className="size-9"
                          onClick={() => duplicateMeal(meal)}
                          size="icon"
                          variant="outline"
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          aria-label={`Edytuj ${meal.name}`}
                          className="size-9"
                          onClick={() => editMeal(meal)}
                          size="icon"
                          variant="outline"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          aria-label={`Usuń ${meal.name}`}
                          className="size-9 text-muted-foreground hover:text-destructive"
                          disabled={deletingMealId === meal.id}
                          onClick={() => removeMeal(meal.id)}
                          size="icon"
                          variant="ghost"
                        >
                          {deletingMealId === meal.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
                        <div>
                          <p className="font-semibold tabular-nums">
                            {formatNutrition(mealNutrition.calories, true)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">kcal</p>
                        </div>
                        <div>
                          <p className="font-semibold tabular-nums">
                            {formatNutrition(mealNutrition.protein)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">białko</p>
                        </div>
                        <div>
                          <p className="font-semibold tabular-nums">
                            {formatNutrition(mealNutrition.carbohydrates)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">węgle</p>
                        </div>
                        <div>
                          <p className="font-semibold tabular-nums">
                            {formatNutrition(mealNutrition.fats)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">tłuszcz</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1 border-t pt-3">
                        {meal.items.slice(0, 4).map((item) => (
                          <p
                            className="truncate text-xs text-muted-foreground"
                            key={item.product.productId}
                          >
                            {item.product.name} · {formatNutrition(item.amount)}{" "}
                            {item.unit}
                          </p>
                        ))}
                        {meal.items.length > 4 && (
                          <p className="text-xs text-muted-foreground">
                            + {meal.items.length - 4} więcej
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {editedMealId ? "Edycja" : "Nowy zestaw"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {editedMealId ? "Edytuj gotowy posiłek" : "Dodaj gotowy posiłek"}
                  </h2>
                </div>

                {editedMealId && (
                  <Button onClick={resetEditor} size="sm" variant="ghost">
                    Anuluj
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prepared-meal-name">Nazwa</Label>
                <Input
                  id="prepared-meal-name"
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="np. Tosty z serem i szynką"
                  value={name}
                />
              </div>

              <div className="mt-5 space-y-2">
                <Label htmlFor="prepared-meal-search">Dodaj produkty</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="prepared-meal-search"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Szukaj produktu..."
                    className="pl-10"
                    value={searchQuery}
                  />
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border p-2">
                  {isLoadingProducts && products.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Szukam...
                    </div>
                  ) : products.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Brak produktów.
                    </p>
                  ) : (
                    products.map((product) => {
                      const isSelected = Boolean(items[product.id]);
                      const unit = product.nutritionBasis === "per_100ml" ? "ml" : "g";

                      return (
                        <button
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                            isSelected ? "border-primary bg-primary/5" : "bg-background",
                          )}
                          key={product.id}
                          onClick={() => toggleProduct(product)}
                          type="button"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {product.brand || "Bez marki"} ·{" "}
                              {formatNutrition(product.nutritionPer100.calories, true)}{" "}
                              kcal / 100 {unit}
                            </p>
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
                      );
                    })
                  )}
                </div>
              </div>

              {draftItems.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium">Skład posiłku</p>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {draftItems.map((item) => (
                      <div
                        className="rounded-2xl border bg-background/80 p-3"
                        key={item.product.productId}
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.product.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.product.brand || "Bez marki"}
                            </p>
                          </div>
                          <Button
                            aria-label={`Usuń ${item.product.name}`}
                            className="size-8"
                            onClick={() => {
                              setItems((currentItems) => {
                                const nextItems = { ...currentItems };
                                delete nextItems[item.product.productId];
                                return nextItems;
                              });
                            }}
                            size="icon"
                            variant="ghost"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>

                        <div className="relative">
                          <Input
                            className={cn(
                              "h-10 pr-12",
                              item.error &&
                                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                            )}
                            inputMode="decimal"
                            onChange={(event) =>
                              updateAmount(
                                item.product.productId,
                                event.target.value,
                              )
                            }
                            value={item.amount}
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                            {item.unit}
                          </span>
                        </div>
                        {item.error && (
                          <p className="mt-1.5 text-xs text-destructive">
                            {item.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-2xl border bg-muted/30 p-3">
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <p className="font-semibold tabular-nums">
                      {formatNutrition(summary.calories, true)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">kcal</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums">
                      {formatNutrition(summary.protein)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">białko</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums">
                      {formatNutrition(summary.carbohydrates)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">węgle</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums">
                      {formatNutrition(summary.fats)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">tłuszcz</p>
                  </div>
                </div>
              </div>

              <Button
                className="mt-5 h-12 w-full"
                disabled={isSaving}
                onClick={saveMeal}
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {editedMealId ? "Zapisz zmiany" : "Zapisz gotowy posiłek"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
