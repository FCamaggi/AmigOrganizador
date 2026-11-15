import { type LocalDate, weekdayOf } from "@amigo/core";
import { type MessageKey, t } from "@/i18n/t";

/** "Vie 19 dic" */
export function formatDay(date: LocalDate): string {
  const [, month, day] = date.split("-").map(Number);
  return `${t(`weekday.short.${weekdayOf(date)}` as MessageKey)} ${day} ${t(
    `month.short.${month}` as MessageKey,
  )}`;
}

/** "19 dic" */
export function formatShortDate(date: LocalDate): string {
  const [, month, day] = date.split("-").map(Number);
  return `${day} ${t(`month.short.${month}` as MessageKey)}`;
}

/** "19:00"; minutes past 1440 wrap to the next day. */
export function formatTime(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** "19:00–22:00" */
export function formatSpan(start: number, end: number): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

/** "3 h", "1,5 h" */
export function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  return t("duration.minutes", {
    hours: Number.isInteger(hours) ? hours : hours.toFixed(1).replace(".", ","),
  });
}

/** First grapheme of a name, upper-cased, for line labels and avatars. */
export function initialOf(name: string): string {
  const first = [...name.trim()][0] ?? "?";
  return first.toLocaleUpperCase("es-CL");
}
