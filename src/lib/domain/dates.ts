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
