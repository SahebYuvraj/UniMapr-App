import type { EventItem } from '@howljs/calendar-kit';

export type DraftEvent = {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  color?: string;
  startISO: string;
  endISO: string;
};

export const toDraftEvent = (e: any): DraftEvent => {
  const startISO = e?.start?.dateTime ?? e?.start;
  const endISO = e?.end?.dateTime ?? e?.end;

  return {
    id: e?.id ? String(e.id) : undefined,
    title: e?.title ?? '',
    description: e?.description ?? '',
    location: e?.location ?? '',
    color: e?.color ?? '#E8F0FE',
    startISO,
    endISO,
  };
};

export const fromDraftEvent = (d: DraftEvent): EventItem => {
  return {
    id: d.id ? String(d.id) : '',
    title: d.title ?? '',
    description: d.description ?? '',
    location: d.location ?? '',
    color: d.color ?? '#E8F0FE',
    start: { dateTime: d.startISO },
    end: { dateTime: d.endISO },
  };
};
