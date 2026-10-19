import { TIME_ZONE } from "@/constants";
import type { MovementRecord } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getCalendarDateUtc(date: Date): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [yearStr, monthStr, dayStr] = formatter.format(date).split("-");
  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
}

/**
 * Shifts all movement createdAt timestamps by whole days so that the newest movement
 * is today in Asia/Kuala_Lumpur, or yesterday if today would place it in the future.
 */
export function rebaseSeed(movements: MovementRecord[], now: Date): MovementRecord[] {
  if (movements.length === 0) {
    return [];
  }

  let newestMs = -Infinity;
  for (const m of movements) {
    const t = new Date(m.createdAt).getTime();
    if (t > newestMs) {
      newestMs = t;
    }
  }

  const newestDate = new Date(newestMs);
  const nowCalendar = getCalendarDateUtc(now);
  const newestCalendar = getCalendarDateUtc(newestDate);

  let shiftDays = Math.round((nowCalendar.getTime() - newestCalendar.getTime()) / MS_PER_DAY);

  if (newestMs + shiftDays * MS_PER_DAY > now.getTime()) {
    shiftDays -= 1;
  }

  if (shiftDays <= 0) {
    return movements;
  }

  const shiftMs = shiftDays * MS_PER_DAY;
  return movements.map((m) => ({
    ...m,
    createdAt: new Date(new Date(m.createdAt).getTime() + shiftMs).toISOString(),
  }));
}
