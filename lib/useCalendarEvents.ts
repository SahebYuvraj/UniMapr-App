import { deleteEvent, fetchUserEvents, insertEvent, updateEvent } from "@/services/calendarServices";
import type { EventItem } from "@howljs/calendar-kit";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { addDays, chunkKeyForISO, endOfDayISO, mergeById, normalizeEvent, startOfDayISO } from "./calendarUtils";

type FetchOpts = { force?: boolean };

export function useCalendarEvents(userId?: string, createdEventColor = "#FDE68A") {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const WINDOW_DAYS = 14;
  const EVICT_BUFFER_DAYS = 30;

  const fetchedWindowsRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  const fetchWindowForDate = useCallback(
    async (centerISO: string, opts: FetchOpts = {}) => {
      if (!userId) return;
      if (isLoadingRef.current) return;

      const cacheKey = chunkKeyForISO(centerISO, WINDOW_DAYS * 2);

      if (!opts.force) {
        if (fetchedWindowsRef.current.has(cacheKey)) return;
        fetchedWindowsRef.current.add(cacheKey);
      }

      const center = new Date(centerISO);
      const from = startOfDayISO(addDays(center, -WINDOW_DAYS));
      const to = endOfDayISO(addDays(center, WINDOW_DAYS));

      isLoadingRef.current = true;
      try {
        const incomingRaw = await fetchUserEvents({ userId, fromISO: from, toISO: to });
        const incoming = incomingRaw.map(normalizeEvent);

        setEvents((prev) => mergeById(prev, incoming));
        fetchedWindowsRef.current.add(cacheKey);

        setEvents((prev) => {
          const min = new Date(startOfDayISO(addDays(center, -(WINDOW_DAYS + EVICT_BUFFER_DAYS)))).getTime();
          const max = new Date(endOfDayISO(addDays(center, WINDOW_DAYS + EVICT_BUFFER_DAYS))).getTime();

          return prev.filter((e) => {
            const t = new Date(e.start.dateTime).getTime();
            return t >= min && t <= max;
          });
        });
      } finally {
        isLoadingRef.current = false;
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchWindowForDate(new Date().toISOString(), { force: true });
  }, [userId, fetchWindowForDate]);

  const handleDragCreateEnd = useCallback(
    async (event: any) => {
      setIsCreating(false);
      if (!userId) return;

      const localEvent: EventItem = {
        ...normalizeEvent(event),
        id: `local_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        title: event?.title ?? "New Event",
        color: event?.color ?? createdEventColor,
      };

      setEvents((prev) => mergeById(prev, [localEvent]));

      try {
        const saved = await insertEvent(userId, localEvent);
        setEvents((prev) => {
          const withoutLocal = prev.filter((e) => String(e.id) !== String(localEvent.id));
          return mergeById(withoutLocal, [saved]);
        });
      } catch {
        setEvents((prev) => prev.filter((e) => String(e.id) !== String(localEvent.id)));
      }

      setSelectedEvent(undefined);
    },
    [userId, createdEventColor]
  );

  const handleDragEventStart = useCallback(() => setIsEditing(true), []);

  const handleSelectedDragEnd = useCallback(
    async (updatedEvent: any) => {
      if (!userId) return;
      if (!events.some((e) => String(e.id) === String(updatedEvent.id))) return;

      const normalized = normalizeEvent(updatedEvent);
      setEvents((prev) => mergeById(prev, [normalized]));
      setSelectedEvent(undefined);
      setIsEditing(false);

      try {
        const saved = await updateEvent({ userId, eventItem: normalized });
        setEvents((prev) => mergeById(prev, [saved]));
      } catch {
        fetchWindowForDate(normalized.start.dateTime, { force: true });
      }
    },
    [userId, events, fetchWindowForDate]
  );

  const handleDragEventEnd = useCallback(
    async (updatedEvent: any) => {
      setIsEditing(false);
      if (!updatedEvent?.id) return;
      if (!userId) return;

      if (!events.some((e) => String(e.id) === String(updatedEvent.id))) return;

      const normalized = normalizeEvent(updatedEvent);
      setEvents((prev) => mergeById(prev, [normalized]));

      try {
        const saved = await updateEvent({ userId, eventItem: normalized });
        setEvents((prev) => mergeById(prev, [saved]));
      } catch {
        fetchWindowForDate(normalized.start.dateTime, { force: true });
      }

      setSelectedEvent(undefined);
    },
    [userId, events, fetchWindowForDate]
  );

  const deleteOne = useCallback(
    async (event: any) => {
      if (!userId) return;
      const id = String(event.id);

      setEvents((prev) => prev.filter((e) => String(e.id) !== id));

      try {
        await deleteEvent({ userId, eventId: id });
        fetchWindowForDate(event?.start?.dateTime ?? new Date().toISOString(), { force: true });
      } catch {
        fetchWindowForDate(event?.start?.dateTime ?? new Date().toISOString(), { force: true });
      }
    },
    [userId, fetchWindowForDate]
  );

  const confirmDeleteEvent = useCallback(
  (event: any) => {
    if (!userId) return;

    Alert.alert(
      "Delete event?",
      event?.title ?? "This event",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteOne(event),
        },
      ]
    );
  },
  [userId, deleteOne]
);

  return {
    events,
    setEvents,
    selectedEvent,
    setSelectedEvent,
    isCreating,
    setIsCreating,
    isEditing,
    setIsEditing,
    fetchWindowForDate,
    handleDragCreateEnd,
    handleDragEventStart,
    handleDragEventEnd,
    handleSelectedDragEnd,
    deleteOne,
    confirmDeleteEvent,
  };
}
