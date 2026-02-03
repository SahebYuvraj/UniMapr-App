import type { EventItem } from "@howljs/calendar-kit";


export const startOfDayISO = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};
export const endOfDayISO = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
};
export const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

export const chunkKeyForISO = (centerISO: string, chunkDays: number) => {
  const d = new Date(centerISO);
  d.setHours(0, 0, 0, 0);
  const epochDays = Math.floor(d.getTime() / (24 * 60 * 60 * 1000));
  const chunkStartDays = Math.floor(epochDays / chunkDays) * chunkDays;
  return `chunk_${chunkStartDays}_${chunkDays}`;
};

export const normalizeEvent = (e: any): EventItem => ({
  ...e,
  start: { dateTime: e?.start?.dateTime ?? e?.start },
  end: { dateTime: e?.end?.dateTime ?? e?.end },
});

export const mergeById = (prev: EventItem[], incoming: EventItem[]) => {
  const map = new Map<string, EventItem>();
  for (const e of prev) map.set(String(e.id), e);
  for (const e of incoming) map.set(String(e.id), e);
  return Array.from(map.values());
};
