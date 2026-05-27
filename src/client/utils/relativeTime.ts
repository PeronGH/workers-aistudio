const RTF = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1_000]
];

export function formatRelative(ts: number): string {
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  for (const [unit, ms] of UNITS) {
    if (abs >= ms) return RTF.format(Math.round(diff / ms), unit);
  }
  return "just now";
}
