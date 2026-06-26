"use client";

import { useEffect, useState } from "react";

import {
  EMPTY_DAILY_ACTIVITY,
  subscribeToDailyActivity,
  type DailyActivity,
} from "../data/daily-activity.repository";

type UseDailyActivityResult = {
  activity: DailyActivity;
  isLoading: boolean;
  error: Error | null;
};

export function useDailyActivity(
  userId: string | undefined,
  dateKey: string,
): UseDailyActivityResult {
  const [state, setState] = useState<UseDailyActivityResult>({
    activity: EMPTY_DAILY_ACTIVITY,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToDailyActivity(
      userId,
      dateKey,
      (activity) => {
        setState({
          activity,
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          activity: EMPTY_DAILY_ACTIVITY,
          isLoading: false,
          error,
        });
      },
    );
  }, [dateKey, userId]);

  if (!userId) {
    return {
      activity: EMPTY_DAILY_ACTIVITY,
      isLoading: false,
      error: null,
    };
  }

  return state;
}
