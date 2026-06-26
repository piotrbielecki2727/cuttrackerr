"use client";

import { useEffect, useState } from "react";

import { getUserNutritionData } from "../data/calorie-calculator.repository";
import type { UserNutritionData } from "../domain/calorie-calculator.types";

type UseUserNutritionDataResult = {
  data: UserNutritionData;
  isLoading: boolean;
  error: Error | null;
};

const EMPTY_USER_NUTRITION_DATA: UserNutritionData = {
  nutritionProfile: null,
  caloriePlan: null,
};

export function useUserNutritionData(
  userId: string | undefined,
): UseUserNutritionDataResult {
  const [state, setState] = useState<UseUserNutritionDataResult>({
    data: EMPTY_USER_NUTRITION_DATA,
    isLoading: Boolean(userId),
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    const currentUserId = userId;
    let isCurrentRequest = true;

    async function loadData() {
      try {
        const nextData = await getUserNutritionData(currentUserId);

        if (isCurrentRequest) {
          setState({
            data: nextData,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isCurrentRequest) {
          setState({
            data: EMPTY_USER_NUTRITION_DATA,
            isLoading: false,
            error: error instanceof Error ? error : new Error("Load failed"),
          });
        }
      }
    }

    void loadData();

    return () => {
      isCurrentRequest = false;
    };
  }, [userId]);

  if (!userId) {
    return {
      data: EMPTY_USER_NUTRITION_DATA,
      isLoading: false,
      error: null,
    };
  }

  return state;
}
