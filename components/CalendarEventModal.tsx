// components/calendar/EventEditorModal.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { DraftEvent } from '../components/calendar';

type Props = {
  visible: boolean;
  mode: 'create' | 'edit';
  initialDraft: DraftEvent | null;
  onClose: () => void;
  onSave: (draft: DraftEvent) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

const COLORS = ['#E8F0FE', '#DCFCE7', '#FDE2E4', '#FEF3C7', '#E0F2FE', '#F3E8FF', '#111111'];

export default function EventEditorModal({
  visible,
  mode,
  initialDraft,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<DraftEvent | null>(initialDraft);
  const [saving, setSaving] = useState(false);

  const [picker, setPicker] = useState<{
    open: boolean;
    which: 'start' | 'end';
    mode: 'date' | 'time';
  }>({ open: false, which: 'start', mode: 'date' });

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft, visible]);

  const title = mode === 'create' ? 'New event' : 'Edit event';

  const startLabel = useMemo(() => {
    if (!draft?.startISO) return '';
    return dayjs(draft.startISO).format('ddd, D MMM YYYY • h:mm A');
  }, [draft?.startISO]);

  const endLabel = useMemo(() => {
    if (!draft?.endISO) return '';
    return dayjs(draft.endISO).format('ddd, D MMM YYYY • h:mm A');
  }, [draft?.endISO]);

  if (!draft) return null;

  const setField = (k: keyof DraftEvent, v: any) => {
    setDraft((prev) => (prev ? { ...prev, [k]: v } : prev));
  };

  const ensureEndAfterStart = (nextStartISO: string, nextEndISO: string) => {
    const s = dayjs(nextStartISO);
    const e = dayjs(nextEndISO);
    if (e.isAfter(s)) return { startISO: nextStartISO, endISO: nextEndISO };
    return { startISO: nextStartISO, endISO: s.add(1, 'hour').toISOString() };
  };

  const handlePick = (date: Date) => {
    const which = picker.which;

    const currentStart = dayjs(draft.startISO);
    const currentEnd = dayjs(draft.endISO);

    if (picker.mode === 'date') {
      // keep time, change date
      if (which === 'start') {
        const next = currentStart
          .year(date.getFullYear())
          .month(date.getMonth())
          .date(date.getDate())
          .toISOString();

        const fixed = ensureEndAfterStart(next, draft.endISO);
        setDraft((p) => (p ? { ...p, ...fixed } : p));
      } else {
        const next = currentEnd
          .year(date.getFullYear())
          .month(date.getMonth())
          .date(date.getDate())
          .toISOString();

        // if end becomes before start, bump end
        const s = dayjs(draft.startISO);
        const e = dayjs(next);
        const finalEnd = e.isAfter(s) ? next : s.add(1, 'hour').toISOString();
        setField('endISO', finalEnd);
      }
    } else {
      // time
      if (which === 'start') {
        const next = currentStart
          .hour(date.getHours())
          .minute(date.getMinutes())
          .second(0)
          .millisecond(0)
          .toISOString();

        const fixed = ensureEndAfterStart(next, draft.endISO);
        setDraft((p) => (p ? { ...p, ...fixed } : p));
      } else {
        const next = currentEnd
          .hour(date.getHours())
          .minute(date.getMinutes())
          .second(0)
          .millisecond(0)
          .toISOString();

        const s = dayjs(draft.startISO);
        const e = dayjs(next);
        const finalEnd = e.isAfter(s) ? next : s.add(1, 'hour').toISOString();
        setField('endISO', finalEnd);
      }
    }
  };

  const openPicker = (which: 'start' | 'end', mode: 'date' | 'time') => {
    setPicker({ open: true, which, mode });
  };

  const closePicker = () => setPicker((p) => ({ ...p, open: false }));

  const handleSave = async () => {
    // minimal validation
    const t = (draft.title ?? '').trim();
    if (!t) {
      setField('title', 'New Event');
    }

    setSaving(true);
    try {
      await onSave({ ...draft, title: t || 'New Event' });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const pickerValue = () => {
    const iso = picker.which === 'start' ? draft.startISO : draft.endISO;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            value={draft.title}
            onChangeText={(v) => setField('title', v)}
            placeholder="e.g. COMP lecture"
            placeholderTextColor="rgba(0,0,0,0.35)"
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={draft.description}
            onChangeText={(v) => setField('description', v)}
            placeholder="Notes..."
            placeholderTextColor="rgba(0,0,0,0.35)"
            style={[styles.input, { height: 70 }]}
            multiline
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            value={draft.location}
            onChangeText={(v) => setField('location', v)}
            placeholder="e.g. Kambri"
            placeholderTextColor="rgba(0,0,0,0.35)"
            style={styles.input}
          />

          <Text style={styles.label}>Start</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.pill} onPress={() => openPicker('start', 'date')}>
              <Text style={styles.pillText}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => openPicker('start', 'time')}>
              <Text style={styles.pillText}>Time</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>
          <Text style={styles.datetimeText}>{startLabel}</Text>

          <Text style={styles.label}>End</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.pill} onPress={() => openPicker('end', 'date')}>
              <Text style={styles.pillText}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => openPicker('end', 'time')}>
              <Text style={styles.pillText}>Time</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>
          <Text style={styles.datetimeText}>{endLabel}</Text>

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorsRow}>
            {COLORS.map((c) => {
              const active = (draft.color ?? '') === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setField('color', c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    active && styles.colorDotActive,
                    c === '#111111' && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.footer}>
            {mode === 'edit' && !!onDelete ? (
              <TouchableOpacity
                style={[styles.footerBtn, styles.deleteBtn]}
                onPress={handleDelete}
                disabled={saving}
              >
                <Text style={[styles.footerBtnText, styles.deleteText]}>
                  {saving ? 'Working…' : 'Delete'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <TouchableOpacity
              style={[styles.footerBtn, styles.saveBtn]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[styles.footerBtnText, styles.saveText]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Picker */}
          {picker.open && (
            <DateTimePicker
              value={pickerValue()}
              mode={picker.mode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(evt, selected) => {
                if (Platform.OS !== 'ios') closePicker();
                if (!selected) return;
                handlePick(selected);
              }}
            />
          )}

          {Platform.OS === 'ios' && picker.open && (
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity style={[styles.footerBtn, styles.saveBtn]} onPress={closePicker}>
                <Text style={[styles.footerBtnText, styles.saveText]}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 14, fontWeight: '900', color: '#111' },

  label: { marginTop: 10, fontSize: 12, fontWeight: '800', color: 'rgba(0,0,0,0.55)' },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    backgroundColor: '#fff',
  },

  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  pillText: { fontSize: 12, fontWeight: '800', color: '#111' },
  datetimeText: { marginTop: 6, fontSize: 13, fontWeight: '700', color: '#111' },

  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
  },
  colorDotActive: {
    transform: [{ scale: 1.2 }],
    borderWidth: 2,
    borderColor: '#111',
  },

  footer: { flexDirection: 'row', gap: 10, marginTop: 14 },
  footerBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: { backgroundColor: '#111' },
  deleteBtn: { backgroundColor: '#F3F4F6' },
  footerBtnText: { fontSize: 13, fontWeight: '900' },
  saveText: { color: '#fff' },
  deleteText: { color: '#111' },
});
