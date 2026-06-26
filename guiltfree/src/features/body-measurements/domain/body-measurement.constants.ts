export const BODY_MEASUREMENT_KEYS = [
  "weightKg",
  "waistCm",
  "hipsCm",
  "chestCm",
  "neckCm",
  "armCm",
  "thighCm",
  "calfCm",
] as const;

export const BODY_MEASUREMENT_LABELS = {
  weightKg: "Masa ciała",
  waistCm: "Talia",
  hipsCm: "Biodra",
  chestCm: "Klatka piersiowa",
  neckCm: "Szyja",
  armCm: "Ramię",
  thighCm: "Udo",
  calfCm: "Łydka",
} as const;

export const BODY_MEASUREMENT_UNITS = {
  weightKg: "kg",
  waistCm: "cm",
  hipsCm: "cm",
  chestCm: "cm",
  neckCm: "cm",
  armCm: "cm",
  thighCm: "cm",
  calfCm: "cm",
} as const;

export const BODY_MEASUREMENT_RANGES = [
  { key: "30d", label: "30 dni", days: 30 },
  { key: "90d", label: "90 dni", days: 90 },
  { key: "180d", label: "180 dni", days: 180 },
  { key: "all", label: "Cały okres", days: null },
] as const;
