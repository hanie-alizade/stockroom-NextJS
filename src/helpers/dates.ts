const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const APP_TIME_ZONE = "Asia/Kuala_Lumpur";

function parseDate(date: Date | string): Date {
  const result = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(result.getTime())) {
    throw new RangeError("Invalid date");
  }
  return result;
}

function getCalendarParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(partMap.year),
    month: Number(partMap.month) - 1,
    day: Number(partMap.day),
    hour: Number(partMap.hour),
    minute: Number(partMap.minute),
  };
}

function getDayDifference(a: Date, b: Date): number {
  const partsA = getCalendarParts(a);
  const partsB = getCalendarParts(b);
  const dateA = new Date(partsA.year, partsA.month, partsA.day);
  const dateB = new Date(partsB.year, partsB.month, partsB.day);
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format a date relative to now for human-readable display.
 * Returns "Just now" for under 1 minute, "Xm ago" under 1 hour, "Xh ago" under 12 hours,
 * "Today, HH:MM" for same day, "Yesterday" for the day before, "D Mon" for older dates.
 */
export function formatWhen(date: Date | string, now: Date): string {
  const dateObj = parseDate(date);
  const nowObj = parseDate(now);

  const diffMs = nowObj.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = diffMinutes / 60;

  if (diffMinutes < 1 && diffMinutes >= -1) {
    return "Just now";
  }

  const dayDiff = getDayDifference(dateObj, nowObj);
  if (dayDiff === 1) {
    return "Yesterday";
  }
  if (dayDiff === 0) {
    if (diffMinutes < 60 && diffMinutes >= 0) {
      return `${diffMinutes}m ago`;
    }
    if (diffHours < 12 && diffHours >= 0) {
      return `${Math.floor(diffHours)}h ago`;
    }
    const parts = getCalendarParts(dateObj);
    const hour = String(parts.hour).padStart(2, "0");
    const minute = String(parts.minute).padStart(2, "0");
    return `Today, ${hour}:${minute}`;
  }

  const parts = getCalendarParts(dateObj);
  const monthName = MONTHS[parts.month];
  if (parts.year !== getCalendarParts(nowObj).year) {
    return `${parts.day} ${monthName} ${parts.year}`;
  }
  return `${parts.day} ${monthName}`;
}

/**
 * Format a date as "D Mon, HH:MM" in 24-hour format in the app time zone.
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = parseDate(date);
  const parts = getCalendarParts(dateObj);
  const monthName = MONTHS[parts.month];
  const hour = String(parts.hour).padStart(2, "0");
  const minute = String(parts.minute).padStart(2, "0");
  return `${parts.day} ${monthName}, ${hour}:${minute}`;
}

/**
 * Format a date as "D Mon" (e.g. "9 Oct") in the app time zone.
 */
export function formatDay(date: Date | string): string {
  const dateObj = parseDate(date);
  const parts = getCalendarParts(dateObj);
  return `${parts.day} ${MONTHS[parts.month]}`;
}

/**
 * Format a chart axis/tooltip date: "Today" if on the same calendar day
 * in Asia/Kuala_Lumpur as now, otherwise "D Mon" (e.g. "9 Oct").
 */
export function formatChartDay(date: Date | string, now: Date = new Date()): string {
  const dateObj = parseDate(date);
  const nowObj = parseDate(now);
  const partsDate = getCalendarParts(dateObj);
  const partsNow = getCalendarParts(nowObj);

  if (
    partsDate.year === partsNow.year &&
    partsDate.month === partsNow.month &&
    partsDate.day === partsNow.day
  ) {
    return "Today";
  }
  return formatDay(dateObj);
}

/**
 * Format timestamp relative to now for "synced N min ago".
 * Returns "just now" for under 1 minute, "N min ago" under 60 minutes, and "N h ago" otherwise.
 */
export function formatRelativeTime(
  timestamp: number | Date,
  now: Date | number = new Date(),
): string {
  const timeMs = typeof timestamp === "number" ? timestamp : timestamp.getTime();
  const nowMs = typeof now === "number" ? now : now.getTime();

  if (Number.isNaN(timeMs) || Number.isNaN(nowMs)) {
    throw new RangeError("Invalid date");
  }

  const diffMs = Math.max(0, nowMs - timeMs);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffHours < 1) {
    return `${diffMinutes} min ago`;
  }

  return `${diffHours} h ago`;
}
