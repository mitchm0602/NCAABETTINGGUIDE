import aliases from "../data/aliases.json";

const CONFERENCES = [
  "A-10",
  "ACC",
  "Am. East",
  "America East",
  "American",
  "ASUN",
  "Big 12",
  "Big East",
  "Big Sky",
  "Big South",
  "Big Ten",
  "Big West",
  "CAA",
  "CUSA",
  "Conference USA",
  "Horizon",
  "Ivy",
  "MAAC",
  "MAC",
  "MEAC",
  "Mountain West",
  "MVC",
  "Missouri Valley",
  "NEC",
  "OVC",
  "Ohio Valley",
  "Patriot",
  "SEC",
  "SoCon",
  "Southern",
  "Southland",
  "Summit",
  "Sun Belt",
  "SWAC",
  "WAC",
  "WCC"
];

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function canonicalTeamName(name: string) {
  const trimmed = normalizeWhitespace(name);
  const map = aliases as Record<string, string>;
  return map[trimmed] || trimmed;
}

export function parseRecord(record: string): [number, number] {
  const match = record.match(/(\d+)-(\d+)/);
  if (!match) return [0, 0];
  return [Number(match[1]), Number(match[2])];
}

export function isConference(value: string) {
  return CONFERENCES.includes(value);
}

export function toNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const clean = value.replace(/,/g, "").trim();
  const match = clean.match(/[-+]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function average(...values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function titleLineDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}
