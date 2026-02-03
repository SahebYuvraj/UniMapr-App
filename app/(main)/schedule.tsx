// Calendar.tsx
import { Ionicons } from '@expo/vector-icons';
import type { PackedEvent } from '@howljs/calendar-kit';
import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type EventItem,
} from '@howljs/calendar-kit';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { styles } from '../../assets/styles/calendarStyles';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { mapICalToCalendarKit } from '../../services/calendarServices';
import { fetchICalEvents } from '../../services/icalServices';



import {
  addDays,
  chunkKeyForISO,
  endOfDayISO,
  mergeById,
  normalizeEvent,
  startOfDayISO,
} from '../../lib/calendarUtils';

import {
  deleteEvent,
  fetchUserEvents,
  insertEvent,
  updateEvent,
} from '../../services/calendarServices';

// ✅ Your editor modal + mappers/types
import EventEditorModal from '@/components/CalendarEventModal';
import type { DraftEvent } from '@/components/calendar';
import { fromDraftEvent, toDraftEvent } from '@/components/calendar';

const HOUR_COL_WIDTH = 36;

// ---------------------------
// Seed data
// ---------------------------
const initialEvents: EventItem[] = [];

const Calendar = () => {
  const { user } = useAuth();
  const calendarRef = useRef<any>(null);



  // ---------------------------
  // visibleDate + view mode
  // ---------------------------
  const [visibleDate, setVisibleDate] = useState(dayjs());
  const [numberOfDays, setNumberOfDays] = useState<1 | 3 | 5 | 7>(1);

  // month picker modal
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  // Core state
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<any>(undefined);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const createdEventColor = '#FDE68A';

  // ===========================
  // ✅ Editor modal state
  // ===========================
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorDraft, setEditorDraft] = useState<DraftEvent | null>(null);

  // ===========================
  // windowed fetch + cache + dedupe
  // ===========================
  const WINDOW_DAYS = 14;
  const EVICT_BUFFER_DAYS = 30;

  const fetchedWindowsRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  const fetchWindowForDate = useCallback(
    async (centerISO: string, opts: { force?: boolean } = {}) => {
      if (!user?.id) return;
      if (isLoadingRef.current) return;

      const force = !!opts.force;
      const cacheKey = chunkKeyForISO(centerISO, WINDOW_DAYS * 2);

      // ✅ cache gate (skipped if force)
      if (!force) {
        if (fetchedWindowsRef.current.has(cacheKey)) return;
      }

      const center = new Date(centerISO);
      const from = startOfDayISO(addDays(center, -WINDOW_DAYS));
      const to = endOfDayISO(addDays(center, WINDOW_DAYS));


      isLoadingRef.current = true;
      try {
        const incomingRaw = await fetchUserEvents({
          userId: user.id,
          fromISO: from,
          toISO: to,
        });

        const incoming = incomingRaw.map(normalizeEvent);

        const icalRaw = await fetchICalEvents(user.icalLink);
        const fromMs = new Date(from).getTime();
        const toMs = new Date(to).getTime();

        const icalMapped = icalRaw
        .filter((e) => e.startISO && e.endISO)
        .filter((e) => {
          const s = new Date(e.startISO).getTime();
          return s >= fromMs && s <= toMs;
        })
        .map(mapICalToCalendarKit)
        .map(normalizeEvent);

        // ✅ merge
        setEvents((prev) => mergeById(prev, [...incoming, ...icalMapped]));

        // ✅ only mark cached after successful fetch
        fetchedWindowsRef.current.add(cacheKey);

        // ✅ eviction
        setEvents((prev) => {
          const min = new Date(
            startOfDayISO(addDays(center, -(WINDOW_DAYS + EVICT_BUFFER_DAYS))),
          ).getTime();
          const max = new Date(
            endOfDayISO(addDays(center, WINDOW_DAYS + EVICT_BUFFER_DAYS)),
          ).getTime();

          return prev.filter((e) => {
            const t = new Date(e.start.dateTime).getTime();
            return t >= min && t <= max;
          });
        });
      } catch (e) {
        console.log('fetchWindowForDate error:', e);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [WINDOW_DAYS, user],
  );

  // initial fetch
  useEffect(() => {
    fetchWindowForDate(new Date().toISOString(), { force: true });
  }, [user, fetchWindowForDate]);

  

  const goToToday = useCallback(() => {
    const now = dayjs();
    setVisibleDate(now);

    calendarRef.current?.goToDate({
      date: now.toISOString(),
      animatedDate: true,
      hourScroll: false,
      animatedHour: true,
    });

    fetchWindowForDate(now.toISOString(), { force: true });
  }, [fetchWindowForDate]);

  // ---------------------------
  // CREATE (drag background)
  // ---------------------------
  const handleDragCreateEnd = useCallback(
    async (event: any) => {
      setIsCreating(false);

      if (!user?.id) {
        console.log('No userId yet - cannot create event');
        return;
      }

      const localEvent: EventItem = {
        ...normalizeEvent(event),
        id: `local_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        title: event?.title ?? 'New Event',
        color: event?.color ?? createdEventColor,
      };

      // optimistic UI
      setEvents((prev) => mergeById(prev, [localEvent]));

      try {
        const saved = await insertEvent(user.id, localEvent);

        // replace temp with saved
        setEvents((prev) => {
          const withoutLocal = prev.filter((e) => String(e.id) !== String(localEvent.id));
          return mergeById(withoutLocal, [saved]);
        });

        console.log('Created event saved:', saved.id);
        fetchWindowForDate(saved.start.dateTime, { force: true });
      } catch (e) {
        console.log('Create event error:', e);
        setEvents((prev) => prev.filter((x) => String(x.id) !== String(localEvent.id)));
      }

      setSelectedEvent(undefined);
    },
    [createdEventColor, user?.id, fetchWindowForDate],
  );

  // ---------------------------
  // EDIT (drag existing / selected)
  // ---------------------------
  const handleDragEventStart = useCallback((event: any) => {
    setIsEditing(true);
    console.log('Started editing:', event?.id);
  }, []);

  const handleSelectedDragEnd = useCallback(
    async (updatedEvent: any) => {
      if (!user?.id) return;

      // 🔒 ignore if deleted
      if (!events.some((e) => String(e.id) === String(updatedEvent.id))) return;

      const normalized = normalizeEvent(updatedEvent);

      // optimistic UI
      setEvents((prev) => mergeById(prev, [normalized]));
      setSelectedEvent(undefined);
      setIsEditing(false);

      try {
        const saved = await updateEvent({ userId: user.id, eventItem: normalized });
        setEvents((prev) => mergeById(prev, [saved]));
        fetchWindowForDate(saved.start.dateTime, { force: true });
      } catch (e) {
        console.log('Update selected event error:', e);
        fetchWindowForDate(normalized.start.dateTime, { force: true });
      }
    },
    [user?.id, fetchWindowForDate, events],
  );

  const handleDragEventEnd = useCallback(
    async (updatedEvent: any) => {
      setIsEditing(false);
      if (!updatedEvent?.id) return;
      if (!user?.id) return;

      if (!events.some((e) => String(e.id) === String(updatedEvent.id))) return;

      const normalized = normalizeEvent(updatedEvent);

      // optimistic UI
      setEvents((prev) => mergeById(prev, [normalized]));

      try {
        const saved = await updateEvent({ userId: user.id, eventItem: normalized });
        setEvents((prev) => mergeById(prev, [saved]));
        console.log('Updated event saved:', saved.id);
        fetchWindowForDate(saved.start.dateTime, { force: true });
      } catch (e) {
        console.log('Update event error:', e);
        fetchWindowForDate(normalized.start.dateTime, { force: true });
      }

      setSelectedEvent(undefined);
    },
    [user?.id, fetchWindowForDate, events],
  );

  // ===========================
  // Week strip
  // ===========================
  const weekDays = useMemo(() => {
    const start = visibleDate.startOf('week');
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
  }, [visibleDate]);

  const onPressMonth = useCallback(() => {
    setIsMonthOpen(true);
  }, []);

  // ✅ Plus opens create modal (prefilled for visible day)
  const onPressPlus = useCallback(() => {
    const base = visibleDate;
    const start = base.hour(dayjs().hour()).minute(0).second(0).millisecond(0);
    const end = start.add(1, 'hour');

    setEditorMode('create');
    setEditorDraft({
      title: '',
      description: '',
      location: '',
      color: createdEventColor,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
    } as DraftEvent);
    setEditorOpen(true);
  }, [visibleDate, createdEventColor]);

  // ---------------------------
  // UI renderers
  // ---------------------------
  const renderEvent = useCallback((event: PackedEvent) => {
    return (
      <View style={[styles.eventCard, { backgroundColor: event.color }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="calendar" size={10} color="#111" />
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
      </View>
    );
  }, []);

  const renderHour = useCallback(({ hourStr }: { hourStr: string }) => {
    return (
      <View style={{ alignItems: 'flex-end', paddingRight: 2 }}>
        <Text style={styles.hourText}>{hourStr.replace(':00 ', '')}</Text>
      </View>
    );
  }, []);

  const renderCustomHorizontalLine = useCallback(() => {
    return <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />;
  }, []);

  // Month grid
  const monthGridDays = useMemo(() => {
    const monthStart = visibleDate.startOf('month');
    const gridStart = monthStart.startOf('week');
    return Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'));
  }, [visibleDate]);

  // ===========================
  // ✅ Editor handlers
  // ===========================
  const saveDraft = useCallback(
    async (draft: DraftEvent) => {
      if (!user?.id) return;

      if (editorMode === 'create') {
        const tempId = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const localEvent = fromDraftEvent({ ...draft, id: tempId });

        setEvents((prev) => mergeById(prev, [localEvent]));
        setEditorOpen(false);

        try {
          const saved = await insertEvent(user.id, localEvent);
          setEvents((prev) =>
            mergeById(prev.filter((e) => String(e.id) !== String(tempId)), [saved]),
          );
          fetchWindowForDate(draft.startISO, { force: true });
        } catch (e) {
          console.log('Create from editor error:', e);
          setEvents((prev) => prev.filter((e) => String(e.id) !== String(tempId)));
        }
      } else {
        if (!draft.id) return;

        const localEvent = fromDraftEvent(draft);

        setEvents((prev) => mergeById(prev, [localEvent]));
        setEditorOpen(false);

        try {
          const saved = await updateEvent({ userId: user.id, eventItem: localEvent });
          setEvents((prev) => mergeById(prev, [saved]));
          fetchWindowForDate(draft.startISO, { force: true });
        } catch (e) {
          console.log('Update from editor error:', e);
          fetchWindowForDate(draft.startISO, { force: true });
        }
      }
    },
    [user?.id, editorMode, fetchWindowForDate],
  );

  const deleteFromEditor = useCallback(
    async (draft: DraftEvent) => {
      if (!user?.id) return;
      if (!draft?.id) return;

      const targetId = String(draft.id);

      setEvents((prev) => prev.filter((e) => String(e.id) !== targetId));
      setEditorOpen(false);
      setSelectedEvent(undefined);

      try {
        await deleteEvent({ userId: user.id, eventId: draft.id });
        fetchWindowForDate(draft.startISO, { force: true });
      } catch (e) {
        console.log('Delete from editor error:', e);
        fetchWindowForDate(draft.startISO, { force: true });
      }
    },
    [user?.id, fetchWindowForDate],
  );

  return (
    <ScreenWrapper>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.safe}>
          {/* HEADER + WEEK STRIP */}
          <View style={styles.dateBox}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onPressMonth} style={styles.navBtn}>
                <Ionicons name="calendar-outline" size={16} color="#111" />
              </TouchableOpacity>

              <TouchableOpacity onPress={onPressMonth} activeOpacity={0.7}>
                <Text style={styles.title}>{visibleDate.format('MMMM YYYY')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onPressPlus} style={styles.navBtn}>
                <Ionicons name="add" size={18} color="#111" />
              </TouchableOpacity>
            </View>

            {/* Today + view mode row */}
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={goToToday} style={styles.todayBtn}>
                <Ionicons name="locate" size={14} color="#111" />
                <Text style={styles.todayText}>Today</Text>
              </TouchableOpacity>

              <View style={styles.viewRow}>
                {[1, 3, 5, 7].map((n) => {
                  const active = numberOfDays === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[styles.viewPill, active && styles.viewPillActive]}
                      onPress={() => {
                        calendarRef.current?.setVisibleDate(visibleDate.toISOString());
                        setNumberOfDays(n as 1 | 3 | 5 | 7);
                      }}
                    >
                      <Text style={[styles.viewPillText, active && styles.viewPillTextActive]}>
                        {n}D
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <FlatList
              horizontal
              data={weekDays}
              keyExtractor={(d) => d.format('YYYY-MM-DD')}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}
              renderItem={({ item }) => {
                const isActive = item.isSame(visibleDate, 'day');
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setVisibleDate(item);
                      calendarRef.current?.goToDate({
                        date: item.toISOString(),
                        animatedDate: true,
                      });
                      fetchWindowForDate(item.toISOString());
                    }}
                    style={[styles.dateItem, isActive && styles.dateActive]}
                  >
                    <Text style={[styles.dateDow, isActive && styles.dateDowActive]}>
                      {item.format('dd').toUpperCase()}
                    </Text>
                    <Text style={[styles.dateNum, isActive && styles.dateNumActive]}>
                      {item.format('D')}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Zoom controls */}
          <View style={styles.zoomRow}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => calendarRef.current?.zoom({ scale: 1.15 })}
            >
              <Ionicons name="add" size={18} color="#111" />
              <Text style={styles.zoomText}>Zoom in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => calendarRef.current?.zoom({ scale: 0.87 })}
            >
              <Ionicons name="remove" size={18} color="#111" />
              <Text style={styles.zoomText}>Zoom out</Text>
            </TouchableOpacity>
          </View>

          {/* Optional banners */}
          {isCreating && (
            <View style={styles.bannerCreate}>
              <Text style={styles.bannerText}>Creating event…</Text>
            </View>
          )}
          {isEditing && (
            <View style={styles.bannerEdit}>
              <Text style={styles.bannerText}>Editing event…</Text>
            </View>
          )}

          {/* CALENDAR */}
          <View style={styles.calendarFull}>
            <CalendarContainer
              ref={calendarRef}
              events={events}
              numberOfDays={numberOfDays}
              defaultDuration={60}
              allowDragToCreate
              allowDragToEdit
              allowPinchToZoom
              scrollByDay={true}
              scrollToNow={false}
              onDateChanged={(date: string) => {
                setVisibleDate(dayjs(date));
                fetchWindowForDate(date);
              }}
              selectedEvent={selectedEvent}
              onPressBackground={() => setSelectedEvent(undefined)}
              // ✅ Tap opens editor (edit)
              onPressEvent={(event) => {
                setSelectedEvent(event);
                setEditorMode('edit');
                setEditorDraft(toDraftEvent(event));
                setEditorOpen(true);
              }}
              onDragCreateEventStart={() => {
                setIsCreating(true);
                setSelectedEvent(undefined);
              }}
              onDragCreateEventEnd={handleDragCreateEnd}
              onDragEventStart={handleDragEventStart}
              onDragEventEnd={handleDragEventEnd}
              onDragSelectedEventEnd={handleSelectedDragEnd}
              // long-press delete (still supported)
              onLongPressEvent={(event) => {
                if (!user?.id) return;

                Alert.alert('Delete event?', event.title ?? 'This event', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      const targetId = String(event.id);
                      setEvents((prev) => prev.filter((e) => String(e.id) !== targetId));

                      try {
                        await deleteEvent({ userId: user.id, eventId: event.id });
                        setSelectedEvent(undefined);
                        fetchWindowForDate(visibleDate.toISOString(), { force: true });
                      } catch (e) {
                        console.log('Delete error:', e);
                        fetchWindowForDate(event.start?.dateTime ?? new Date().toISOString(), {
                          force: true,
                        });
                      }
                    },
                  },
                ]);
              }}
            >
              <CalendarHeader />
              <CalendarBody
                renderEvent={renderEvent}
                renderHour={renderHour}
                renderCustomHorizontalLine={renderCustomHorizontalLine}
                timeColumnStyle={{
                  width: HOUR_COL_WIDTH,
                  alignItems: 'flex-end',
                  paddingRight: 2,
                }}
                showNowIndicator={visibleDate.isSame(dayjs(), 'day')}
              />
            </CalendarContainer>
          </View>

          {/* Month picker modal */}
          <Modal
            visible={isMonthOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsMonthOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => setVisibleDate((d) => d.subtract(1, 'month'))}
                  >
                    <Ionicons name="chevron-back" size={16} color="#111" />
                  </TouchableOpacity>

                  <Text style={styles.modalTitle}>{visibleDate.format('MMMM YYYY')}</Text>

                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => setVisibleDate((d) => d.add(1, 'month'))}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#111" />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                    <Text key={w} style={styles.weekHeaderText}>
                      {w}
                    </Text>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {monthGridDays.map((d, idx) => {
                    const inMonth = d.month() === visibleDate.month();
                    const isToday = d.isSame(dayjs(), 'day');
                    const isSelected = d.isSame(visibleDate, 'day');

                    return (
                      <TouchableOpacity
                        key={`${d.format('YYYY-MM-DD')}_${idx}`}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                          isToday && styles.dayCellToday,
                        ]}
                        onPress={() => {
                          setIsMonthOpen(false);
                          setVisibleDate(d);

                          calendarRef.current?.goToDate({
                            date: d.toISOString(),
                            animatedDate: true,
                            hourScroll: false,
                            animatedHour: true,
                          });

                          fetchWindowForDate(d.toISOString());
                        }}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            !inMonth && styles.dayCellTextMuted,
                            isSelected && styles.dayCellTextSelected,
                          ]}
                        >
                          {d.date()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setIsMonthOpen(false)}
                  >
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalToday}
                    onPress={() => {
                      setIsMonthOpen(false);
                      goToToday();
                    }}
                  >
                    <Text style={styles.modalTodayText}>Today</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ✅ Event editor modal */}
          <EventEditorModal
            visible={editorOpen}
            mode={editorMode}
            initialDraft={editorDraft}
            onClose={() => setEditorOpen(false)}
            onSave={saveDraft}
            onDelete={
              editorMode === 'edit' && editorDraft?.id
                ? () => deleteFromEditor(editorDraft)
                : undefined
            }
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </ScreenWrapper>
  );
};

export default Calendar;
