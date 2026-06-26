"use client";

import { useEffect, useState } from "react";

import { subscribeToBodyMeasurements } from "../data/body-measurements.repository";
import type { BodyMeasurementEntry } from "../domain/body-measurement.types";

type UseBodyMeasurementsResult = {
  measurements: BodyMeasurementEntry[];
  isLoading: boolean;
  error: Error | null;
};

export function useBodyMeasurements(
  userId: string | undefined,
): UseBodyMeasurementsResult {
  const [state, setState] = useState<UseBodyMeasurementsResult>({
    measurements: [],
    isLoading: Boolean(userId),
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeToBodyMeasurements(
      userId,
      (measurements) => {
        setState({
          measurements,
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          measurements: [],
          isLoading: false,
          error,
        });
      },
    );
  }, [userId]);

  if (!userId) {
    return {
      measurements: [],
      isLoading: false,
      error: null,
    };
  }

  return state;
}
