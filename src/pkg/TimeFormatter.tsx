// pkg/TimeFormatter.ts

export type TimeMode = "relative" | "absolute";

/**
 * Default: "relative" (just now / X seconds ago / X minutes ago / …)
 * For absolute time, pass mode = "absolute" or call formatTimeAbsolute().
 */
export default function formatTime(isoString: string, mode: TimeMode = "relative"): string {
  if (mode === "absolute") return formatTimeAbsolute(isoString);
  return formatTimeAgo(isoString);
}

/** Relative time: just now, X seconds ago, X minutes ago, X hours ago, X days ago, X months ago, X years ago */
export function formatTimeAgo(isoString: string, now: Date = new Date()): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const diffMs = now.getTime() - date.getTime();
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);

  const sec = Math.floor(abs / 1000);
  const min = Math.floor(sec / 60);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const mon = Math.floor(day / 30);   // rough
  const yr  = Math.floor(day / 365);  // rough

  // Helpers
  const unit = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;
  const suffix = (txt: string) => (future ? `in ${txt}` : `${txt} ago`);

  if (sec < 30) return "just now";
  if (sec < 60) return suffix(unit(sec, "second", "seconds"));
  if (min < 60) return suffix(unit(min, "minute", "minutes"));
  if (hr  < 24) return suffix(unit(hr,  "hour",   "hours"));
  if (day < 30) return suffix(unit(day, "day",    "days"));
  if (day < 365) return suffix(unit(Math.max(mon, 1), "month", "months"));
  return suffix(unit(Math.max(yr, 1), "year", "years"));
}

/** Absolute time: keeps your original format (MM/DD/YYYY HH:MM:SS) */
export function formatTimeAbsolute(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(",", "");
  } catch {
    return isoString;
  }
}
