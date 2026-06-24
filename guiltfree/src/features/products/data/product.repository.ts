import {
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query as createFirestoreQuery,
  serverTimestamp,
  where,
  writeBatch,
  type FieldValue,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

import {
  PRODUCT_SEARCH_RESULT_LIMIT,
} from "../domain/product.constants";
import {
  getMostSelectiveSearchTerm,
} from "../domain/product.search";
import {
  parseProductDocument,
} from "../domain/product.schemas";
import {
  createProductSearchIndex,
} from "../domain/product.search";
import type {
  CreateProductCommand,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductId,
  ProductSearchIndex,
  UserId,
} from "../domain/product.types";

const PRODUCTS_COLLECTION = "products";
const USERS_COLLECTION = "users";
const PRODUCT_PREFERENCES_COLLECTION = "productPreferences";

const MAX_DOCUMENT_IDS_PER_QUERY = 30;

export interface FindProductsParams {
  searchText?: string;
  category?: ProductCategory;
  limitCount?: number;
}

interface NewProductFirestoreDocument
  extends CreateProductInput,
    ProductSearchIndex {
  createdBy: UserId;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

interface NewProductPreferenceFirestoreDocument {
  productId: ProductId;
  isFavorite: boolean;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function createProduct(
  command: CreateProductCommand,
  userId: UserId,
): Promise<ProductId> {
  const productsCollectionReference = collection(
    db,
    PRODUCTS_COLLECTION,
  );

  const productReference = doc(productsCollectionReference);
  const productId = productReference.id;

  const batch = writeBatch(db);

  const productDocument: NewProductFirestoreDocument = {
    ...command.product,
    ...createProductSearchIndex(command.product),
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(productReference, productDocument);

  if (command.isFavorite) {
    const preferenceReference = doc(
      db,
      USERS_COLLECTION,
      userId,
      PRODUCT_PREFERENCES_COLLECTION,
      productId,
    );

    const preferenceDocument: NewProductPreferenceFirestoreDocument = {
      productId,
      isFavorite: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    batch.set(preferenceReference, preferenceDocument);
  }

  await batch.commit();

  return productId;
}

export async function findProducts(
  params: FindProductsParams = {},
): Promise<Product[]> {
  const searchToken = getMostSelectiveSearchTerm(params.searchText ?? "");

  const queryConstraints: QueryConstraint[] = [];

  if (params.category) {
    queryConstraints.push(where("category", "==", params.category));
  }

  if (searchToken) {
    queryConstraints.push(
      where("searchTokens", "array-contains", searchToken),
    );
  }

  queryConstraints.push(
    orderBy("normalizedName", "asc"),
    limit(params.limitCount ?? PRODUCT_SEARCH_RESULT_LIMIT),
  );

  const productsQuery = createFirestoreQuery(
    collection(db, PRODUCTS_COLLECTION),
    ...queryConstraints,
  );

  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((productDocument) =>
    parseProductDocument(productDocument.id, productDocument.data()),
  );
}

export async function findProductsByIds(
  productIds: ProductId[],
): Promise<Product[]> {
  const uniqueProductIds = [...new Set(productIds)];

  if (uniqueProductIds.length === 0) {
    return [];
  }

  const productsCollectionReference = collection(
    db,
    PRODUCTS_COLLECTION,
  );

  const idChunks = chunkArray(
    uniqueProductIds,
    MAX_DOCUMENT_IDS_PER_QUERY,
  );

  const snapshots = await Promise.all(
    idChunks.map((ids) =>
      getDocs(
        createFirestoreQuery(
          productsCollectionReference,
          where(documentId(), "in", ids),
        ),
      ),
    ),
  );

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((productDocument) =>
      parseProductDocument(productDocument.id, productDocument.data()),
    ),
  );
}