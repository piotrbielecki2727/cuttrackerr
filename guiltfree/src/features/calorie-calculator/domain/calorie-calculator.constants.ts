export const ACTIVITY_LEVELS = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
] as const;

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
} as const;

export const ACTIVITY_LEVEL_LABELS = {
  sedentary: "Siedzący tryb życia",
  lightly_active: "Lekka aktywność",
  moderately_active: "Umiarkowana aktywność",
  very_active: "Wysoka aktywność",
  extra_active: "Bardzo wysoka aktywność",
} as const;

export const ACTIVITY_LEVEL_DESCRIPTIONS = {
  sedentary:
    "Praca głównie siedząca, mało codziennego ruchu, niewiele kroków w ciągu dnia i brak regularnych treningów.",
  lightly_active:
    "Codzienny spacer, lekki ruch lub wyraźnie większa liczba kroków oraz 1–3 treningi tygodniowo.",
  moderately_active:
    "Regularne treningi około 3–5 razy w tygodniu, aktywna praca albo dużo chodzenia w większość dni.",
  very_active:
    "Intensywne treningi 6–7 razy w tygodniu, fizyczna praca, dużo kroków albo regularne bieganie w tygodniu.",
  extra_active:
    "Wymagająca praca fizyczna połączona z regularnymi intensywnymi treningami, dużą liczbą kroków lub częstym bieganiem.",
} as const;

export const CALORIE_GOALS = [
  "fat_loss",
  "maintenance",
  "muscle_gain",
] as const;

export const CALORIE_GOAL_LABELS = {
  fat_loss: "Redukcja",
  maintenance: "Utrzymanie wagi",
  muscle_gain: "Masa",
} as const;

export const DEFAULT_CALORIE_ADJUSTMENTS = {
  fat_loss: 300,
  maintenance: 0,
  muscle_gain: 250,
} as const;

export const CALCULATOR_VERSION = "mifflin_st_jeor_v1" as const;
