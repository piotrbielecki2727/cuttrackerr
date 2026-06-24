"use client";

import { useEffect, useState } from "react";

import { subscribeToNutritionGoals } from "../data/nutrition-goals.repository";
import {
  EMPTY_NUTRITION_GOALS,
  type NutritionGoals,
} from "../domain/nutrition-goals.types";

type NutritionGoalsState = {
  userId: string | null;
  goals: NutritionGoals;
  error: Error | null;
};

const INITIAL_STATE: NutritionGoalsState = {
  userId: null,
  goals: EMPTY_NUTRITION_GOALS,
  error: null,
};

export function useNutritionGoals(userId: string | undefined) {
  const [state, setState] = useState<NutritionGoalsState>(INITIAL_STATE);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToNutritionGoals(
      userId,
      (goals) => {
        setState({
          userId,
          goals,
          error: null,
        });
      },
      (error) => {
        setState({
          userId,
          goals: EMPTY_NUTRITION_GOALS,
          error,
        });
      },
    );
  }, [userId]);

  if (!userId) {
    return {
      goals: EMPTY_NUTRITION_GOALS,
      isLoading: false,
      error: null,
    };
  }

  return {
    goals: state.userId === userId ? state.goals : EMPTY_NUTRITION_GOALS,
    isLoading: state.userId !== userId,
    error: state.userId === userId ? state.error : null,
  };
}
