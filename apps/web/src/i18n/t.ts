import { esCL, type MessageKey } from "./es-CL";

export type { MessageKey };

/** Looks up a UI string and fills `{placeholders}`. */
export function t(
  key: MessageKey,
  vars: Readonly<Record<string, string | number>> = {},
): string {
  return esCL[key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
