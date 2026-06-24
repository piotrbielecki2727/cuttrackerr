"use client";

import Link from "next/link";
import {
  Heart,
  ChevronDown,
  Loader2,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  ALL_PRODUCT_CATEGORIES,
  isProductCategory,
  PRODUCT_CATEGORIES,
} from "../domain/product.constants";
import {
  hasTooShortSearchQuery,
} from "../domain/product.search";
import {
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategoryFilter,
} from "../domain/product.types";
import {
  useFavoriteProductIds,
} from "../hooks/use-favorite-product-ids";
import {
  useProductSearch,
} from "../hooks/use-product-search";

type NutritionMetricProps = {
  label: string;
  value: number;
  unit: "g" | "kcal";
};

function NutritionMetric({
  label,
  value,
  unit,
}: NutritionMetricProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">
        {new Intl.NumberFormat("pl-PL", {
          maximumFractionDigits: 1,
        }).format(value)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}

type ProductCardProps = {
  product: Product;
  isFavorite: boolean;
};

function ProductCard({
  product,
  isFavorite,
}: ProductCardProps) {
  const nutritionBasis =
    product.nutritionBasis === "per_100ml" ? "100 ml" : "100 g";

  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <h2 className="break-words font-semibold tracking-tight">
            {product.name}
          </h2>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            {product.brand || "Bez podanej marki"}
          </p>
        </div>

        {isFavorite && (
          <div
            aria-label="Produkt w ulubionych"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
            title="Produkt w ulubionych"
          >
            <Heart className="size-4 fill-current" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {PRODUCT_CATEGORY_LABELS[product.category]}
        </span>

        <span className="text-xs text-muted-foreground">
          Wartości na {nutritionBasis}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 px-4 py-5">
        <NutritionMetric
          label="Kalorie"
          unit="kcal"
          value={product.nutritionPer100.calories}
        />

        <NutritionMetric
          label="Białko"
          unit="g"
          value={product.nutritionPer100.protein}
        />

        <NutritionMetric
          label="Węgle"
          unit="g"
          value={product.nutritionPer100.carbohydrates}
        />

        <NutritionMetric
          label="Tłuszcze"
          unit="g"
          value={product.nutritionPer100.fats}
        />
      </div>

      {product.note && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {product.note}
          </p>
        </div>
      )}
    </article>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="space-y-3 border-b p-4">
        <div className="h-5 w-3/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
      </div>

      <div className="p-4">
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />

        <div className="mt-5 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="h-3 w-10 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-12 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductsBrowser() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");

  const [category, setCategory] =
    useState<ProductCategoryFilter>(ALL_PRODUCT_CATEGORIES);

  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const {
    productIds: favoriteProductIds,
    isLoading: isFavoritesLoading,
  } = useFavoriteProductIds(user?.uid);

  const {
    products,
    isLoading,
    error,
    reload,
  } = useProductSearch({
    searchQuery,
    brandQuery,
    category,
    favoritesOnly,
    favoriteProductIds,
    isFavoritesLoading,
  });

  const favoriteProductIdsSet = useMemo(
    () => new Set(favoriteProductIds),
    [favoriteProductIds],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    brandQuery.trim().length > 0 ||
    category !== ALL_PRODUCT_CATEGORIES ||
    favoritesOnly;

  const isSearchTooShort =
    hasTooShortSearchQuery(searchQuery) ||
    hasTooShortSearchQuery(brandQuery);

  function clearFilters() {
    setSearchQuery("");
    setBrandQuery("");
    setCategory(ALL_PRODUCT_CATEGORIES);
    setFavoritesOnly(false);
  }

  function handleCategoryChange(value: string) {
    if (value === ALL_PRODUCT_CATEGORIES) {
      setCategory(ALL_PRODUCT_CATEGORIES);
      return;
    }

    if (isProductCategory(value)) {
      setCategory(value);
    }
  }

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PackageOpen className="size-4" />
              Wspólna baza produktów
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Produkty
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Wyszukuj po nazwie lub marce, filtruj kategorię i szybko wracaj
              do ulubionych produktów.
            </p>
          </div>

          <Button asChild className="sm:self-auto">
            <Link href="/products/new">
              <Plus className="size-4" />
              Dodaj produkt
            </Link>
          </Button>
        </header>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="h-12 pl-10 pr-10 text-base"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Szukaj po nazwie lub marce, np. Skyr, Piątnica..."
                type="search"
                value={searchQuery}
              />

              {searchQuery && (
                <Button
                  aria-label="Wyczyść wyszukiwanie"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <div className="relative">
                <Input
                  className="h-11 pr-10"
                  onChange={(event) => setBrandQuery(event.target.value)}
                  placeholder="Filtruj po marce, np. Fruvita"
                  value={brandQuery}
                />

                {brandQuery && (
                  <Button
                    aria-label="Wyczyść filtr marki"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setBrandQuery("")}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>

              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  className="h-11 w-full appearance-none rounded-md border border-input bg-background pl-10 pr-9 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  onChange={(event) =>
                    handleCategoryChange(event.target.value)
                  }
                  value={category}
                >
                  <option value={ALL_PRODUCT_CATEGORIES}>
                    Wszystkie kategorie
                  </option>

                  {PRODUCT_CATEGORIES.map((productCategory) => (
                    <option
                      key={productCategory}
                      value={productCategory}
                    >
                      {PRODUCT_CATEGORY_LABELS[productCategory]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <Button
                aria-pressed={favoritesOnly}
                className={cn(
                  "h-11",
                  favoritesOnly && "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
                )}
                onClick={() => setFavoritesOnly((currentValue) => !currentValue)}
                type="button"
                variant="outline"
              >
                <Heart
                  className={cn(
                    "size-4",
                    favoritesOnly && "fill-current",
                  )}
                />
                Ulubione
                {favoriteProductIds.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {favoriteProductIds.length}
                  </span>
                )}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                {isSearchTooShort
                  ? "Wpisz minimum 2 znaki, aby rozpocząć wyszukiwanie."
                  : isLoading
                    ? "Wyszukiwanie produktów..."
                    : `Znaleziono produktów: ${products.length}`}
              </div>

              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-4" />
                  Wyczyść filtry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="mt-6">
          {error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-destructive">
                    Nie udało się pobrać produktów.
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Sprawdź połączenie z internetem i spróbuj ponownie.
                  </p>
                </div>

                <Button onClick={reload} variant="outline">
                  <RefreshCw className="size-4" />
                  Spróbuj ponownie
                </Button>
              </CardContent>
            </Card>
          )}

          {!error && isLoading && products.length === 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          )}

          {!error && !isLoading && products.length === 0 && (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center px-6 py-16 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-muted">
                  <Search className="size-5 text-muted-foreground" />
                </div>

                <h2 className="mt-5 text-lg font-semibold">
                  {hasActiveFilters
                    ? "Nie znaleziono pasujących produktów"
                    : "Baza produktów jest jeszcze pusta"}
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {hasActiveFilters
                    ? "Zmień frazę wyszukiwania lub wyczyść filtry, aby zobaczyć więcej wyników."
                    : "Dodaj pierwszy produkt, aby zacząć budować wspólną bazę."}
                </p>

                {!hasActiveFilters && (
                  <Button asChild className="mt-6">
                    <Link href="/products/new">
                      <Plus className="size-4" />
                      Dodaj pierwszy produkt
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {!error && products.length > 0 && (
            <div
              className={cn(
                "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
                isLoading && "opacity-60",
              )}
            >
              {products.map((product) => (
                <ProductCard
                  isFavorite={favoriteProductIdsSet.has(product.id)}
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}

          {isLoading && products.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Aktualizowanie wyników...
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
