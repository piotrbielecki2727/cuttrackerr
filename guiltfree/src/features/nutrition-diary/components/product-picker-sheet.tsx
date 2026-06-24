"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Loader2,
  PackageOpen,
  Search,
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
import { findProducts } from "@/features/products/data/product.repository";
import type { Product } from "@/features/products/domain/product.types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

import { createDiaryEntry } from "../data/nutrition-diary.repository";
import { MEAL_TYPE_LABELS } from "../domain/nutrition-diary.constants";
import type { MealType } from "../domain/nutrition-diary.types";

type ProductPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  dateKey: string;
  mealType: MealType | null;
};

function formatValue(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 1,
  }).format(value);
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
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [amount, setAmount] = useState("100");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCurrentRequest = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const nextProducts = await findProducts({
          searchText: debouncedSearchQuery,
          limitCount: 20,
        });

        if (isCurrentRequest) {
          setProducts(nextProducts);
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
  }, [debouncedSearchQuery, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedProduct(null);
      setAmount("100");
      setError(null);
    }

    onOpenChange(nextOpen);
  }

  async function handleAddProduct() {
    const parsedAmount = Number(amount.replace(",", "."));

    if (!mealType || !selectedProduct || !Number.isFinite(parsedAmount)) {
      return;
    }

    if (parsedAmount <= 0 || parsedAmount > 10000) {
      setError("Podaj ilość większą od 0 i nie większą niż 10 000.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createDiaryEntry({
        userId,
        dateKey,
        mealType,
        amount: parsedAmount,
        product: selectedProduct,
      });

      handleOpenChange(false);
    } catch {
      setError("Nie udało się dodać produktu do posiłku.");
    } finally {
      setIsSaving(false);
    }
  }

  const unit =
    selectedProduct?.nutritionBasis === "per_100ml" ? "ml" : "g";

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
            Wybierz produkt, a następnie podaj zjedzoną ilość.
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

          {isLoading && (
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

          {!isLoading && products.length > 0 && (
            <div className="space-y-2 pb-4">
              {products.map((product) => {
                const isSelected = selectedProduct?.id === product.id;

                return (
                  <button
                    className={cn(
                      "flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "bg-background active:bg-muted",
                    )}
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {product.brand || "Bez marki"} ·{" "}
                        {formatValue(product.nutritionPer100.calories)} kcal /
                        100 {product.nutritionBasis === "per_100ml" ? "ml" : "g"}
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
              })}
            </div>
          )}
        </div>

        <SheetFooter className="border-t bg-popover px-4 pt-4">
          {selectedProduct && (
            <div className="mb-2">
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="portion-amount"
              >
                Ilość
              </label>
              <div className="relative">
                <Input
                  className="h-12 pr-14 text-base tabular-nums"
                  id="portion-amount"
                  inputMode="decimal"
                  min="0.1"
                  onChange={(event) => setAmount(event.target.value)}
                  step="0.1"
                  type="number"
                  value={amount}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground">
                  {unit}
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="mb-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            className="h-12 w-full text-base"
            disabled={!selectedProduct || isSaving}
            onClick={handleAddProduct}
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Dodaj produkt
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
