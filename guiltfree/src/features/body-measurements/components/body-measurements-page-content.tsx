"use client";

import { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  Line,
  LineChart,
  type NumberDomain,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Loader2,
  Pencil,
  Save,
  Scale,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  deleteBodyMeasurement,
  saveBodyMeasurement,
} from "../data/body-measurements.repository";
import {
  BODY_MEASUREMENT_KEYS,
  BODY_MEASUREMENT_LABELS,
  BODY_MEASUREMENT_RANGES,
  BODY_MEASUREMENT_UNITS,
} from "../domain/body-measurement.constants";
import {
  bodyMeasurementFormSchema,
  type BodyMeasurementFormValues,
} from "../domain/body-measurement.schemas";
import type {
  BodyMeasurementEntry,
  BodyMeasurementKey,
  BodyMeasurementRangeKey,
  BodyMeasurements,
} from "../domain/body-measurement.types";
import { useBodyMeasurements } from "../hooks/use-body-measurements";

type MeasurementDraft = {
  measuredOn: string;
  note: string;
  measurements: Record<BodyMeasurementKey, string>;
};

type ChartPoint = {
  measuredOn: string;
  value: number;
};

type YAxisScaleMode = "auto" | "zero";
type YAxisDomain = [number, number] | ((domain: NumberDomain) => NumberDomain);

function createEmptyDraft(): MeasurementDraft {
  return {
    measuredOn: format(new Date(), "yyyy-MM-dd"),
    note: "",
    measurements: {
      weightKg: "",
      waistCm: "",
      hipsCm: "",
      chestCm: "",
      neckCm: "",
      armCm: "",
      thighCm: "",
      calfCm: "",
    },
  };
}

function createDraftFromMeasurement(
  measurement: BodyMeasurementEntry,
): MeasurementDraft {
  return {
    measuredOn: measurement.measuredOn,
    note: measurement.note ?? "",
    measurements: Object.fromEntries(
      BODY_MEASUREMENT_KEYS.map((key) => [
        key,
        measurement.measurements[key]?.toString() ?? "",
      ]),
    ) as Record<BodyMeasurementKey, string>,
  };
}

function parseDecimal(value: string): number | undefined {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue.replace(",", "."));

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

function buildFormValues(draft: MeasurementDraft): BodyMeasurementFormValues {
  return {
    measuredOn: draft.measuredOn,
    note: draft.note,
    measurements: Object.fromEntries(
      BODY_MEASUREMENT_KEYS.map((key) => [
        key,
        parseDecimal(draft.measurements[key]),
      ]),
    ) as BodyMeasurements,
  };
}

function formatMeasurement(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 1,
  }).format(value);
}

function filterChartData(
  measurements: BodyMeasurementEntry[],
  metric: BodyMeasurementKey,
  range: BodyMeasurementRangeKey,
): ChartPoint[] {
  const rangeConfig = BODY_MEASUREMENT_RANGES.find((item) => item.key === range);
  const minDate =
    rangeConfig?.days === null || rangeConfig === undefined
      ? null
      : subDays(new Date(), rangeConfig.days);

  return measurements
    .filter((measurement) => {
      if (measurement.measurements[metric] === undefined) {
        return false;
      }

      if (!minDate) {
        return true;
      }

      return parseISO(measurement.measuredOn) >= minDate;
    })
    .sort((first, second) => first.measuredOn.localeCompare(second.measuredOn))
    .map((measurement) => ({
      measuredOn: measurement.measuredOn,
      value: measurement.measurements[metric] as number,
    }));
}

function getAutoYAxisDomain(chartData: ChartPoint[]): [number, number] {
  const values = chartData.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue;
  const padding = Math.max(spread * 0.35, maxValue * 0.01, 1);

  if (spread === 0) {
    return [
      Math.max(0, minValue - padding),
      maxValue + padding,
    ];
  }

  return [
    Math.max(0, minValue - padding),
    maxValue + padding,
  ];
}

function getZeroYAxisDomain([, dataMax]: NumberDomain): NumberDomain {
  return [0, Number(dataMax)];
}

function MeasurementChart({
  measurements,
}: {
  measurements: BodyMeasurementEntry[];
}) {
  const [metric, setMetric] = useState<BodyMeasurementKey>("weightKg");
  const [range, setRange] = useState<BodyMeasurementRangeKey>("90d");
  const [yAxisScaleMode, setYAxisScaleMode] =
    useState<YAxisScaleMode>("auto");
  const chartData = useMemo(
    () => filterChartData(measurements, metric, range),
    [measurements, metric, range],
  );
  const firstPoint = chartData[0];
  const lastPoint = chartData[chartData.length - 1];
  const change =
    firstPoint && lastPoint ? lastPoint.value - firstPoint.value : null;
  const unit = BODY_MEASUREMENT_UNITS[metric];
  const yAxisDomain: YAxisDomain =
    yAxisScaleMode === "zero"
      ? getZeroYAxisDomain
      : getAutoYAxisDomain(chartData);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Wykres postępów</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Wybierz metrykę i zakres danych.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              onChange={(event) =>
                setMetric(event.target.value as BodyMeasurementKey)
              }
              value={metric}
            >
              {BODY_MEASUREMENT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {BODY_MEASUREMENT_LABELS[key]}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              onChange={(event) =>
                setRange(event.target.value as BodyMeasurementRangeKey)
              }
              value={range}
            >
              {BODY_MEASUREMENT_RANGES.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              onChange={(event) =>
                setYAxisScaleMode(event.target.value as YAxisScaleMode)
              }
              value={yAxisScaleMode}
            >
              <option value="auto">Skala: auto</option>
              <option value="zero">Skala: od zera</option>
            </select>
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed text-center text-sm text-muted-foreground">
            Dodaj co najmniej dwa pomiary dla wybranej metryki.
          </div>
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="measuredOn" tick={{ fontSize: 12 }} />
                  <YAxis
                    domain={yAxisDomain}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatMeasurement(Number(value))}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${formatMeasurement(Number(value))} ${unit}`,
                      BODY_MEASUREMENT_LABELS[metric],
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Line
                    dataKey="value"
                    dot
                    stroke="var(--primary)"
                    strokeWidth={3}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <TrendBox
                label="Pierwszy pomiar"
                value={`${formatMeasurement(firstPoint.value)} ${unit}`}
              />
              <TrendBox
                label="Ostatni pomiar"
                value={`${formatMeasurement(lastPoint?.value ?? 0)} ${unit}`}
              />
              <TrendBox
                label="Zmiana"
                value={`${change !== null && change > 0 ? "+" : ""}${formatMeasurement(
                  change ?? 0,
                )} ${unit}`}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TrendBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function BodyMeasurementsManager({ userId }: { userId: string }) {
  const { measurements, isLoading, error } = useBodyMeasurements(userId);
  const [draft, setDraft] = useState<MeasurementDraft>(() => createEmptyDraft());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [measurementToDelete, setMeasurementToDelete] =
    useState<BodyMeasurementEntry | null>(null);

  function updateMeasurementValue(key: BodyMeasurementKey, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      measurements: {
        ...currentDraft.measurements,
        [key]: value,
      },
    }));
  }

  async function handleSave() {
    const values = buildFormValues(draft);
    const validation = bodyMeasurementFormSchema.safeParse(values);

    if (!validation.success) {
      setFieldErrors(
        Object.fromEntries(
          validation.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message || "Sprawdź wartość.",
          ]),
        ),
      );
      return;
    }

    setIsSaving(true);
    setFieldErrors({});

    try {
      await saveBodyMeasurement(
        userId,
        validation.data.measuredOn,
        validation.data.measurements,
        validation.data.note,
      );
      setDraft(createEmptyDraft());
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!measurementToDelete) {
      return;
    }

    await deleteBodyMeasurement(userId, measurementToDelete.measuredOn);
    setMeasurementToDelete(null);
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--dashboard-tint)_0%,var(--background)_28rem)]">
      <div className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-5">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Progress
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Pomiary ciała
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Śledź wagę i obwody. Trend z kilku tygodni mówi więcej niż jeden pomiar.
            </p>
          </div>

          <MeasurementChart measurements={measurements} />

          <Card>
            <CardContent className="p-5">
              <h2 className="text-xl font-semibold">Historia pomiarów</h2>
              {error && (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  Nie udało się pobrać pomiarów.
                </p>
              )}
              {isLoading ? (
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Pobieram pomiary...
                </div>
              ) : measurements.length === 0 ? (
                <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Brak pomiarów.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {measurements.map((measurement) => (
                    <div
                      className="rounded-2xl border bg-background p-4"
                      key={measurement.id}
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{measurement.measuredOn}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {BODY_MEASUREMENT_KEYS.filter(
                              (key) => measurement.measurements[key] !== undefined,
                            ).map((key) => (
                              <span
                                className="rounded-full bg-muted px-2.5 py-1 text-xs"
                                key={key}
                              >
                                {BODY_MEASUREMENT_LABELS[key]}:{" "}
                                {formatMeasurement(
                                  measurement.measurements[key] as number,
                                )}{" "}
                                {BODY_MEASUREMENT_UNITS[key]}
                              </span>
                            ))}
                          </div>
                          {measurement.note && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {measurement.note}
                            </p>
                          )}
                        </div>
                        <Button
                          className="size-9"
                          onClick={() => {
                            setEditingId(measurement.id);
                            setDraft(createDraftFromMeasurement(measurement));
                          }}
                          size="icon"
                          variant="outline"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          className="size-9 text-muted-foreground hover:text-destructive"
                          onClick={() => setMeasurementToDelete(measurement)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardContent className="p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {editingId ? "Edycja" : "Nowy pomiar"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Dane pomiaru</h2>
                </div>
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Scale className="size-5" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="measured-on">Data pomiaru</Label>
                  <Input
                    id="measured-on"
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        measuredOn: event.target.value,
                      }))
                    }
                    type="date"
                    value={draft.measuredOn}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {BODY_MEASUREMENT_KEYS.map((key) => (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={`measurement-${key}`}>
                        {BODY_MEASUREMENT_LABELS[key]}
                      </Label>
                      <div className="relative">
                        <Input
                          aria-invalid={Boolean(
                            fieldErrors[`measurements.${key}`],
                          )}
                          id={`measurement-${key}`}
                          inputMode="decimal"
                          onChange={(event) =>
                            updateMeasurementValue(key, event.target.value)
                          }
                          value={draft.measurements[key]}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                          {BODY_MEASUREMENT_UNITS[key]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurement-note">Notatka</Label>
                  <Textarea
                    id="measurement-note"
                    maxLength={500}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        note: event.target.value,
                      }))
                    }
                    placeholder="np. pomiar rano, po treningu, po weekendzie..."
                    value={draft.note}
                  />
                </div>

                {fieldErrors.measurements && (
                  <p className="text-sm text-destructive" role="alert">
                    {fieldErrors.measurements}
                  </p>
                )}

                <div className="flex gap-2">
                  {editingId && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setDraft(createEmptyDraft());
                        setEditingId(null);
                      }}
                      variant="outline"
                    >
                      Anuluj
                    </Button>
                  )}
                  <Button
                    className="flex-1"
                    disabled={isSaving}
                    onClick={handleSave}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Zapisz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog
        open={measurementToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMeasurementToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usunąć pomiar?</DialogTitle>
            <DialogDescription>
              Tej akcji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setMeasurementToDelete(null)} variant="outline">
              Anuluj
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export function BodyMeasurementsPageContent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return <BodyMeasurementsManager userId={user.uid} />;
}
