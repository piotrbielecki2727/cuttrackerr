"use client";

import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Apple,
  ArrowLeft,
  Beef,
  ChevronDown,
  Droplets,
  Flame,
  Heart,
  Loader2,
  Save,
  Sparkles,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { createProduct } from "../data/product.repository";
import {
  PRODUCT_CATEGORIES,
} from "../domain/product.constants";
import { mapProductFormToCreateCommand } from "../domain/product.mapper";
import {
  productFormSchema,
  type ProductFormValues,
} from "../domain/product.schemas";
import {
  PRODUCT_CATEGORY_LABELS,
  type NutritionBasis,
} from "../domain/product.types";

function createDefaultFormValues(): DefaultValues<ProductFormValues> {
  return {
    name: "",
    brand: "",
    category: undefined,
    nutritionBasis: "per_100g",
    note: "",
    isFavorite: false,
    nutritionPer100: {
      calories: undefined,
      protein: undefined,
      carbohydrates: undefined,
      fats: undefined,
      sugars: undefined,
      saturatedFats: undefined,
      fiber: undefined,
      salt: undefined,
    },
  };
}

function parseRequiredDecimal(value: unknown): number | undefined {
  const normalizedValue = String(value).trim().replace(",", ".");

  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

function parseOptionalDecimal(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return parseRequiredDecimal(value);
}

function formatPreviewValue(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getCreateProductErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Nie udało się zapisać produktu. Spróbuj ponownie.";
  }

  switch (error.code) {
    case "permission-denied":
      return "Nie masz uprawnień do zapisania produktu.";

    case "unauthenticated":
      return "Twoja sesja wygasła. Zaloguj się ponownie.";

    case "unavailable":
      return "Usługa jest chwilowo niedostępna. Spróbuj ponownie za moment.";

    case "network-request-failed":
      return "Brak połączenia z internetem.";

    default:
      return "Nie udało się zapisać produktu. Spróbuj ponownie.";
  }
}

type FormSectionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: FormSectionProps) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-6 flex gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}

type NutritionInputProps = {
  id: string;
  label: string;
  unit: "g" | "kcal";
  icon: LucideIcon;
  registration: UseFormRegisterReturn;
  error?: string;
};

function NutritionInput({
  id,
  label,
  unit,
  icon: Icon,
  registration,
  error,
}: NutritionInputProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label
        className="flex items-center gap-2 text-sm font-medium"
        htmlFor={id}
      >
        <Icon className="size-4 text-muted-foreground" />
        {label}
      </Label>

      <div className="relative">
        <Input
          {...registration}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 pr-14 tabular-nums",
            error &&
              "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          )}
          id={id}
          inputMode="decimal"
          min="0"
          placeholder="0"
          step="0.1"
          type="text"
        />

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {unit}
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type PreviewMetricProps = {
  label: string;
  value: number | undefined;
  unit: "g" | "kcal";
  icon: LucideIcon;
};

function PreviewMetric({
  label,
  value,
  unit,
  icon: Icon,
}: PreviewMetricProps) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>

      <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight">
        {formatPreviewValue(value)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}

export function ProductForm() {
  const { user } = useAuth();

  const [isAdvancedNutritionVisible, setIsAdvancedNutritionVisible] =
    useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSavedProductName, setLastSavedProductName] = useState<
    string | null
  >(null);
  const [formResetKey, setFormResetKey] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: createDefaultFormValues(),
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(productFormSchema),
  });

  const liveProduct = useWatch({ control });
  const selectedNutritionBasis = liveProduct.nutritionBasis;
  const isFavorite = liveProduct.isFavorite;

  const previewName = liveProduct.name?.trim() || "Nowy produkt";
  const previewBrand = liveProduct.brand?.trim();
  const previewCategory = liveProduct.category
    ? PRODUCT_CATEGORY_LABELS[liveProduct.category]
    : "Wybierz kategorię";

  const nutritionBasisLabel =
    selectedNutritionBasis === "per_100ml" ? "100 ml" : "100 g";

  async function onSubmit(values: ProductFormValues) {
    if (!user) {
      setSubmitError("Twoja sesja wygasła. Zaloguj się ponownie.");
      return;
    }

    setSubmitError(null);
    setLastSavedProductName(null);

    try {
      const command = mapProductFormToCreateCommand(values);

      await createProduct(command, user.uid);

      setLastSavedProductName(command.product.name);
      setIsAdvancedNutritionVisible(false);
      reset(createDefaultFormValues());
      setFormResetKey((currentKey) => currentKey + 1);
    } catch (error) {
      console.error("Product creation failed:", error);
      setSubmitError(getCreateProductErrorMessage(error));
    }
  }

  function setNutritionBasis(nutritionBasis: NutritionBasis) {
    setValue("nutritionBasis", nutritionBasis, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-8">
          <Button asChild className="-ml-3 mb-5" size="sm" variant="ghost">
            <Link href="/products">
              <ArrowLeft className="size-4" />
              Wróć do przeglądu produktów
            </Link>
          </Button>

          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Apple className="size-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Baza produktów
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                Dodaj nowy produkt
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Wpisz wartości dokładnie tak, jak są podane na etykiecie
                produktu. Produkt będzie dostępny w wspólnej bazie.
              </p>
            </div>
          </div>
        </div>

        <form
          id="new-product-form"
          key={formResetKey}
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              {lastSavedProductName && (
                <div
                  className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm"
                  role="status"
                >
                  <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />

                  <div>
                    <p className="font-medium">Produkt został zapisany.</p>
                    <p className="mt-1 text-muted-foreground">
                      „{lastSavedProductName}” jest już dostępny w bazie. Możesz
                      od razu dodać kolejny produkt.
                    </p>
                  </div>
                </div>
              )}

              {submitError && (
                <div
                  className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              <FormSection
                description="Podaj nazwę, kategorię oraz opcjonalne informacje z opakowania."
                icon={Apple}
                title="Podstawowe informacje"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">
                      Nazwa produktu <span className="text-destructive">*</span>
                    </Label>

                    <Input
                      {...register("name")}
                      aria-invalid={Boolean(errors.name)}
                      className={cn(
                        "h-11",
                        errors.name &&
                          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                      )}
                      id="name"
                      maxLength={120}
                      placeholder="np. Skyr naturalny"
                    />

                    {errors.name && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Marka / producent</Label>

                    <Input
                      {...register("brand")}
                      aria-invalid={Boolean(errors.brand)}
                      className={cn(
                        "h-11",
                        errors.brand &&
                          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                      )}
                      id="brand"
                      maxLength={80}
                      placeholder="np. Piątnica"
                    />

                    {errors.brand && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.brand.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Kategoria <span className="text-destructive">*</span>
                    </Label>

                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <div className="relative">
                          <select
                            aria-invalid={Boolean(errors.category)}
                            className={cn(
                              "h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                              !field.value && "text-muted-foreground",
                              errors.category &&
                                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                            )}
                            id="category"
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(event) => {
                              field.onChange(event.target.value || undefined);
                            }}
                            ref={field.ref}
                            value={field.value ?? ""}
                          >
                            <option value="">
                              Wybierz kategorię
                            </option>
                            {PRODUCT_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {PRODUCT_CATEGORY_LABELS[category]}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      )}
                    />

                    {errors.category && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                </div>
              </FormSection>

              <FormSection
                description="Wpisz dane dla 100 g albo 100 ml. Kalorie z etykiety traktujemy jako źródło prawdy."
                icon={Flame}
                title="Wartości odżywcze"
              >
                <div className="mb-6">
                  <Label className="mb-2 block">Wartości podane dla</Label>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                    <Button
                      aria-pressed={selectedNutritionBasis === "per_100g"}
                      className="h-10"
                      onClick={() => setNutritionBasis("per_100g")}
                      type="button"
                      variant={
                        selectedNutritionBasis === "per_100g"
                          ? "default"
                          : "ghost"
                      }
                    >
                      100 g
                    </Button>

                    <Button
                      aria-pressed={selectedNutritionBasis === "per_100ml"}
                      className="h-10"
                      onClick={() => setNutritionBasis("per_100ml")}
                      type="button"
                      variant={
                        selectedNutritionBasis === "per_100ml"
                          ? "default"
                          : "ghost"
                      }
                    >
                      100 ml
                    </Button>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <NutritionInput
                    error={errors.nutritionPer100?.calories?.message}
                    icon={Flame}
                    id="calories"
                    label="Kalorie"
                    registration={register("nutritionPer100.calories", {
                      setValueAs: parseRequiredDecimal,
                    })}
                    unit="kcal"
                  />

                  <NutritionInput
                    error={errors.nutritionPer100?.protein?.message}
                    icon={Beef}
                    id="protein"
                    label="Białko"
                    registration={register("nutritionPer100.protein", {
                      setValueAs: parseRequiredDecimal,
                    })}
                    unit="g"
                  />

                  <NutritionInput
                    error={errors.nutritionPer100?.carbohydrates?.message}
                    icon={Wheat}
                    id="carbohydrates"
                    label="Węglowodany"
                    registration={register("nutritionPer100.carbohydrates", {
                      setValueAs: parseRequiredDecimal,
                    })}
                    unit="g"
                  />

                  <NutritionInput
                    error={errors.nutritionPer100?.fats?.message}
                    icon={Droplets}
                    id="fats"
                    label="Tłuszcze"
                    registration={register("nutritionPer100.fats", {
                      setValueAs: parseRequiredDecimal,
                    })}
                    unit="g"
                  />
                </div>

                <div className="mt-6 rounded-xl border bg-muted/30">
                  <button
                    aria-expanded={isAdvancedNutritionVisible}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    onClick={() =>
                      setIsAdvancedNutritionVisible((currentValue) => !currentValue)
                    }
                    type="button"
                  >
                    <div>
                      <p className="font-medium">
                        Dodatkowe wartości odżywcze
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cukry, tłuszcze nasycone, błonnik i sól.
                      </p>
                    </div>

                    <ChevronDown
                      className={cn(
                        "size-5 shrink-0 text-muted-foreground transition-transform",
                        isAdvancedNutritionVisible && "rotate-180",
                      )}
                    />
                  </button>

                  {isAdvancedNutritionVisible && (
                    <div className="grid gap-5 border-t p-4 sm:grid-cols-2">
                      <NutritionInput
                        error={errors.nutritionPer100?.sugars?.message}
                        icon={Wheat}
                        id="sugars"
                        label="w tym cukry"
                        registration={register("nutritionPer100.sugars", {
                          setValueAs: parseOptionalDecimal,
                        })}
                        unit="g"
                      />

                      <NutritionInput
                        error={errors.nutritionPer100?.saturatedFats?.message}
                        icon={Droplets}
                        id="saturated-fats"
                        label="w tym tłuszcze nasycone"
                        registration={register(
                          "nutritionPer100.saturatedFats",
                          {
                            setValueAs: parseOptionalDecimal,
                          },
                        )}
                        unit="g"
                      />

                      <NutritionInput
                        error={errors.nutritionPer100?.fiber?.message}
                        icon={Wheat}
                        id="fiber"
                        label="Błonnik"
                        registration={register("nutritionPer100.fiber", {
                          setValueAs: parseOptionalDecimal,
                        })}
                        unit="g"
                      />

                      <NutritionInput
                        error={errors.nutritionPer100?.salt?.message}
                        icon={Droplets}
                        id="salt"
                        label="Sól"
                        registration={register("nutritionPer100.salt", {
                          setValueAs: parseOptionalDecimal,
                        })}
                        unit="g"
                      />
                    </div>
                  )}
                </div>
              </FormSection>

              <FormSection
                description="Te ustawienia nie wpływają na obliczenia kalorii i makroskładników."
                icon={Heart}
                title="Dodatkowe informacje"
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="note">Notatka</Label>

                    <Textarea
                      {...register("note")}
                      aria-invalid={Boolean(errors.note)}
                      className={cn(
                        "min-h-28 resize-y",
                        errors.note &&
                          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                      )}
                      id="note"
                      maxLength={500}
                      placeholder="np. Wartości podane dla produktu po odsączeniu."
                    />

                    <div className="flex justify-between gap-4">
                      {errors.note ? (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.note.message}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Ta notatka będzie widoczna przy produkcie.
                        </p>
                      )}

                      <p className="shrink-0 text-xs text-muted-foreground">
                        {liveProduct.note?.length ?? 0}/500
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors",
                      isFavorite && "border-primary/30 bg-primary/5",
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg bg-muted",
                          isFavorite && "bg-primary/15 text-primary",
                        )}
                      >
                        <Heart
                          className={cn(
                            "size-4",
                            isFavorite && "fill-current",
                          )}
                        />
                      </div>

                      <div>
                        <Label className="cursor-pointer font-medium" htmlFor="isFavorite">
                          Dodaj do ulubionych
                        </Label>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          Produkt pojawi się na Twojej prywatnej liście
                          ulubionych.
                        </p>
                      </div>
                    </div>

                    <Switch
                      checked={Boolean(isFavorite)}
                      id="isFavorite"
                      onCheckedChange={(checked) =>
                        setValue("isFavorite", checked, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                </div>
              </FormSection>
            </div>

            <aside className="lg:col-span-4">
              <div className="space-y-4 lg:sticky lg:top-6">
                <Card className="overflow-hidden border-border/80 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-muted-foreground">
                      Podgląd produktu
                    </p>

                    <div className="mt-5 flex items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Apple className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold tracking-tight">
                          {previewName}
                        </h2>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {previewBrand || previewCategory}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <PreviewMetric
                        icon={Flame}
                        label="Kalorie"
                        unit="kcal"
                        value={liveProduct.nutritionPer100?.calories}
                      />

                      <PreviewMetric
                        icon={Beef}
                        label="Białko"
                        unit="g"
                        value={liveProduct.nutritionPer100?.protein}
                      />

                      <PreviewMetric
                        icon={Wheat}
                        label="Węglowodany"
                        unit="g"
                        value={liveProduct.nutritionPer100?.carbohydrates}
                      />

                      <PreviewMetric
                        icon={Droplets}
                        label="Tłuszcze"
                        unit="g"
                        value={liveProduct.nutritionPer100?.fats}
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm">
                      <span className="text-muted-foreground">
                        Wartości dla
                      </span>
                      <span className="font-medium">{nutritionBasisLabel}</span>
                    </div>

                    {isFavorite && (
                      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
                        <Heart className="size-4 fill-current" />
                        Dodano do Twoich ulubionych
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-dashed bg-transparent shadow-none">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Wskazówka</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Kalorie wpisuj z etykiety. Nie przeliczamy ich automatycznie
                      z makroskładników, ponieważ producenci mogą uwzględniać
                      błonnik, poliole lub zaokrąglenia.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>

          <div className="sticky bottom-3 z-20 mt-6 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="hidden text-sm text-muted-foreground sm:block">
                Pola oznaczone <span className="text-destructive">*</span> są
                wymagane.
              </p>

              <div className="flex w-full gap-2 sm:w-auto">
                <Button asChild className="flex-1 sm:flex-none" variant="outline">
                  <Link href="/products">Anuluj</Link>
                </Button>

                <Button
                  className="flex-1 sm:flex-none"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Zapisz produkt
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
