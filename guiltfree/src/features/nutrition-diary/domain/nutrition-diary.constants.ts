export const MEAL_TYPES = [
  "breakfast",
  "second_breakfast",
  "lunch",
  "dinner",
  "snack",
  "supper",
] as const;

export const MEAL_TYPE_LABELS = {
  breakfast: "Śniadanie",
  second_breakfast: "II śniadanie",
  lunch: "Lunch",
  dinner: "Obiad",
  snack: "Przekąska",
  supper: "Kolacja",
} as const;

export const PORTION_UNITS = ["g", "ml"] as const;
