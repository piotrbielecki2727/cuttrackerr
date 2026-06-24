import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";

import type {
  ProductId,
  UserId,
} from "../domain/product.types";

const USERS_COLLECTION = "users";
const PRODUCT_PREFERENCES_COLLECTION = "productPreferences";

export function subscribeToFavoriteProductIds(
  userId: UserId,
  onChange: (productIds: ProductId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const preferencesQuery = query(
    collection(
      db,
      USERS_COLLECTION,
      userId,
      PRODUCT_PREFERENCES_COLLECTION,
    ),
    where("isFavorite", "==", true),
  );

  return onSnapshot(
    preferencesQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((preferenceDocument) => preferenceDocument.id));
    },
    onError,
  );
}