"use client";

import { useEffect, useState } from "react";

import { subscribeToDailyWater } from "../data/hydration.repository";

type DailyWaterState = {
  queryKey: string | null;
  waterMl: number;
  error: Error | null;
};

const INITIAL_STATE: DailyWaterState = {
  queryKey: null,
  waterMl: 0,
  error: null,
};

export function useDailyWater(
  userId: string | undefined,
  dateKey: string,
) {
  const [state, setState] = useState<DailyWaterState>(INITIAL_STATE);
  const queryKey = userId ? `${userId}:${dateKey}` : null;

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToDailyWater(
      userId,
      dateKey,
      (waterMl) => {
        setState({
          queryKey: `${userId}:${dateKey}`,
          waterMl,
          error: null,
        });
      },
      (error) => {
        setState({
          queryKey: `${userId}:${dateKey}`,
          waterMl: 0,
          error,
        });
      },
    );
  }, [dateKey, userId]);

  if (!userId) {
    return {
      waterMl: 0,
      isLoading: false,
      error: null,
    };
  }

  return {
    waterMl: state.queryKey === queryKey ? state.waterMl : 0,
    isLoading: state.queryKey !== queryKey,
    error: state.queryKey === queryKey ? state.error : null,
  };
}
