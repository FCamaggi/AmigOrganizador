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

function wordGraphemes(name: string): string[][] {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => [...word.toLocaleUpperCase("es-CL")]);
}

function candidateInitial(words: readonly string[][], level: number): string {
  const firstWord = words[0];
  if (!firstWord || firstWord.length === 0) return "?";
  if (level === 0) return firstWord[0] ?? "?";
  const secondWord = words[1];
  if (secondWord && secondWord.length > 0) {
    return `${firstWord[0] ?? ""}${secondWord.slice(0, level).join("")}`;
  }
  return firstWord.slice(0, level + 1).join("");
}

function canExtendInitial(words: readonly string[][], level: number): boolean {
  const firstWord = words[0];
  if (!firstWord) return false;
  const secondWord = words[1];
  if (secondWord && secondWord.length > 0) {
    return level < secondWord.length;
  }
  return level + 1 < firstWord.length;
}

/**
 * Disambiguates initials across a list of member names so two people sharing
 * a first letter (e.g. "Ana" and "Ana Rojas") get distinct labels ("A" vs
 * "AR"), while keeping single-letter initials when unique.
 */
export function initialsFor(names: readonly string[]): string[] {
  const wordLists = names.map(wordGraphemes);
  const levels = names.map(() => 0);
  const labels = wordLists.map((words, i) =>
    candidateInitial(words, levels[i] ?? 0),
  );

  for (;;) {
    const groups = new Map<string, number[]>();
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i] ?? "?";
      const bucket = groups.get(label);
      if (bucket) bucket.push(i);
      else groups.set(label, [i]);
    }

    let changed = false;
    for (const indices of groups.values()) {
      if (indices.length < 2) continue;
      // Keep single-word names at 1 letter when only multi-word names collide
      // with them on the first letter ("A" vs "AR").
      const hasMultiWordAtZero = indices.some(
        (i) => (levels[i] ?? 0) === 0 && (wordLists[i]?.length ?? 0) >= 2,
      );
      const hasSingleWordAtZero = indices.some(
        (i) => (levels[i] ?? 0) === 0 && (wordLists[i]?.length ?? 0) === 1,
      );
      const targets =
        hasMultiWordAtZero && hasSingleWordAtZero
          ? indices.filter(
              (i) => (levels[i] ?? 0) === 0 && (wordLists[i]?.length ?? 0) >= 2,
            )
          : indices;

      for (const i of targets) {
        const words = wordLists[i];
        const level = levels[i] ?? 0;
        if (words && canExtendInitial(words, level)) {
          const next = level + 1;
          levels[i] = next;
          labels[i] = candidateInitial(words, next);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  return labels;
}
