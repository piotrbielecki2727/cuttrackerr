"use client";

import { useEffect, useState } from "react";

import { subscribeToDiaryEntries } from "../data/nutrition-diary.repository";
import type { DiaryEntry } from "../domain/nutrition-diary.types";

type DiaryEntriesState = {
  queryKey: string | null;
  entries: DiaryEntry[];
  error: Error | null;
};

const EMPTY_DIARY_ENTRIES: DiaryEntry[] = [];

const INITIAL_STATE: DiaryEntriesState = {
  queryKey: null,
  entries: EMPTY_DIARY_ENTRIES,
  error: null,
};

export function useDiaryEntries(
  userId: string | undefined,
  dateKey: string,
) {
  const [state, setState] = useState<DiaryEntriesState>(INITIAL_STATE);
  const queryKey = userId ? `${userId}:${dateKey}` : null;

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToDiaryEntries(
      userId,
      dateKey,
      (entries) => {
        setState({
          queryKey: `${userId}:${dateKey}`,
          entries,
          error: null,
        });
      },
      (error) => {
        setState({
          queryKey: `${userId}:${dateKey}`,
          entries: EMPTY_DIARY_ENTRIES,
          error,
        });
      },
    );
  }, [dateKey, userId]);

  if (!userId) {
    return {
      entries: EMPTY_DIARY_ENTRIES,
      isLoading: false,
      error: null,
    };
  }

  return {
    entries:
      state.queryKey === queryKey ? state.entries : EMPTY_DIARY_ENTRIES,
    isLoading: state.queryKey !== queryKey,
    error: state.queryKey === queryKey ? state.error : null,
  };
}
