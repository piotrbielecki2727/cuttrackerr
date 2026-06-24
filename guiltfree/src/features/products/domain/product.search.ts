import {
  ALL_PRODUCT_CATEGORIES,
  PRODUCT_SEARCH_MIN_LENGTH,
} from "./product.constants";
import type {
  CreateProductInput,
  Product,
  ProductSearchIndex,
} from "./product.types";

const MAX_SEARCH_PREFIX_LENGTH = 24;
const MAX_SEARCH_TOKENS = 160;

export function normalizeProductSearchText(value: string): string {
  return value
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getProductSearchTerms(value: string): string[] {
  const normalizedValue = normalizeProductSearchText(value);

  if (!normalizedValue) {
    return [];
  }

  return [
    ...new Set(
      normalizedValue
        .split(" ")
        .filter((term) => term.length >= PRODUCT_SEARCH_MIN_LENGTH),
    ),
  ];
}

export function getMostSelectiveSearchTerm(
  value: string,
): string | undefined {
  return [...getProductSearchTerms(value)].sort(
    (firstTerm, secondTerm) => secondTerm.length - firstTerm.length,
  )[0];
}

export function createProductSearchIndex(
  product: Pick<CreateProductInput, "name" | "brand">,
): ProductSearchIndex {
  const normalizedName = normalizeProductSearchText(product.name);

  const normalizedBrand = product.brand
    ? normalizeProductSearchText(product.brand)
    : undefined;

  const uniqueWords = [
    ...new Set(
      [normalizedName, normalizedBrand]
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => value.split(" ")),
    ),
  ];

  const searchTokens = new Set<string>();

  for (const word of uniqueWords) {
    const maximumPrefixLength = Math.min(
      word.length,
      MAX_SEARCH_PREFIX_LENGTH,
    );

    for (
      let length = PRODUCT_SEARCH_MIN_LENGTH;
      length <= maximumPrefixLength;
      length += 1
    ) {
      searchTokens.add(word.slice(0, length));

      if (searchTokens.size >= MAX_SEARCH_TOKENS) {
        break;
      }
    }

    if (searchTokens.size >= MAX_SEARCH_TOKENS) {
      break;
    }
  }

  return {
    normalizedName,
    searchTokens: [...searchTokens],
    ...(normalizedBrand ? { normalizedBrand } : {}),
  };
}

function matchesEverySearchTerm(
  searchTokens: string[],
  query: string,
): boolean {
  const searchTerms = getProductSearchTerms(query);

  return searchTerms.every((term) => searchTokens.includes(term));
}

function matchesBrandTerms(
  normalizedBrand: string | undefined,
  query: string,
): boolean {
  const brandTerms = getProductSearchTerms(query);

  if (brandTerms.length === 0) {
    return true;
  }

  if (!normalizedBrand) {
    return false;
  }

  const brandWords = normalizedBrand.split(" ");

  return brandTerms.every((term) =>
    brandWords.some((word) => word.startsWith(term)),
  );
}

export function filterProductsLocally(
  products: Product[],
  filters: Pick<
    import("./product.types").ProductListFilters,
    "searchQuery" | "brandQuery" | "category"
  >,
): Product[] {
  return products
    .filter((product) => {
      const matchesCategory =
        filters.category === ALL_PRODUCT_CATEGORIES ||
        product.category === filters.category;

      const matchesSearch = matchesEverySearchTerm(
        product.searchTokens,
        filters.searchQuery,
      );

      const matchesBrand = matchesBrandTerms(
        product.normalizedBrand,
        filters.brandQuery,
      );

      return matchesCategory && matchesSearch && matchesBrand;
    })
    .sort((firstProduct, secondProduct) =>
      firstProduct.name.localeCompare(secondProduct.name, "pl", {
        sensitivity: "base",
      }),
    );
}

export function hasTooShortSearchQuery(value: string): boolean {
  const normalizedValue = normalizeProductSearchText(value);

  return (
    normalizedValue.length > 0 &&
    getProductSearchTerms(normalizedValue).length === 0
  );
}
