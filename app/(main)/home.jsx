import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { endOfDayISO, startOfDayISO } from '../../lib/calendarUtils';
import { supabase } from '../../lib/supabase';
import { fetchUserEvents } from '../../services/calendarServices';
import { fetchICalEvents } from '../../services/icalServices';
import { fetchInterestedEvents } from '../../services/postService';


// --- helpers ---
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toDate = (iso) => new Date(iso);
const timeFmt = (d) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d);
const minutesDiff = (a, b) => Math.round((a.getTime() - b.getTime()) / 60000);
const humanTimeUntil = (mins) =>
  mins <= 0 ? 'now' : mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning!';
  if (h < 18) return 'Good afternoon!';
  return 'Good evening!';
};

// --- still mock until we wire up events & quick access ---
const upcomingEvents = [
  { id: 'club', name: 'Tech Club Meeting', when: '6:00 PM', tag: 'Club' },
  { id: 'fair', name: 'Career Fair', when: 'Tomorrow', tag: 'Event' },
  { id: 'study', name: 'Study Group', when: 'Friday', tag: 'Academic' },
];
const quickAccess = [
  { id: 'lib', name: 'Library' },
  { id: 'center', name: 'Student Center' },
  { id: 'gym', name: 'Gym' },
];

const Home = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const now = new Date();

  const [events, setEvents] = useState([]);
  const [interestedEvents, setInterestedEvents] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      if(!currentUser?.id) return;
      console.log('Loading events for user:', currentUser.id);

      const today = new Date();
      const fromISO = startOfDayISO(new Date());
      const toISO = endOfDayISO(new Date());

      const userEvents = await fetchUserEvents({
        userId: currentUser.id,
        fromISO,
        toISO,
      });
      console.log('icalLinl', currentUser.icalLink);
      const Icalevent = await fetchICalEvents(currentUser.icalLink);
      console.log('Fetched iCal events:', Icalevent);

      const dbEvents = (userEvents ?? []).map((e) => ({
        id: `db:${e.id}`, // ✅ prevent key collisions
        title: e.title,
        location: e.location ?? e.description ?? '',
        startISO: e.start?.dateTime,
        endISO: e.end?.dateTime,
        source: 'db',
      }));
      
      setEvents(dbEvents);

    };

    loadEvents();
  }, [currentUser]);

  useEffect(() => {
  const loadInterested = async () => {
    if (!currentUser?.id) return;

    const res = await fetchInterestedEvents(currentUser.id, 10);

    if (res.success) {
      setInterestedEvents(res.data);
    } else {
      console.log("Error loading interested events:", res.msg);
    }
  };

  loadInterested();
}, [currentUser]);


  const sortedToday = useMemo(
    () => [...events].sort((a, b) => toDate(a.startISO) - toDate(b.startISO)),
    [events]
  );

  const nextClass = useMemo(() => {
    const upcoming = sortedToday.find((c) => toDate(c.startISO) > now);
    if (upcoming) {
      const mins = minutesDiff(toDate(upcoming.startISO), now);
      return {
        ...upcoming,
        timeLabel: timeFmt(toDate(upcoming.startISO)),
        startsIn: humanTimeUntil(mins),
      };
    }
    const last = sortedToday[sortedToday.length - 1];
    return last
      ? { ...last, timeLabel: timeFmt(toDate(last.startISO)), startsIn: 'ended' }
      : null;
  }, [now, sortedToday]);

  const statusColor = (startISO, endISO) => {
    const s = toDate(startISO).getTime();
    const e = toDate(endISO).getTime();
    if (now.getTime() > e) return '#6b7280'; // completed
    if (now.getTime() >= s && now.getTime() <= e) return '#2563eb'; // current
    return '#10b981'; // upcoming
  };

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Logout', 'Error logging out');
      return;
    }
    router.replace('/welcome');
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} overScrollMode="never">
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{greeting()}</Text>
            <Text style={styles.subtitle}>Ready for your next class?</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(main)/profile')}>
            <Text style={styles.avatarText}>JD</Text>
          </TouchableOpacity>
        </View>

        {/* Next Class */}
        {nextClass && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: '#cce4f7' }]}>
                <Text style={{ color: '#007bff' }}>Next Class</Text>
              </View>
              <Text style={styles.mutedText}>{nextClass.timeLabel}</Text>
            </View>

            <Text style={styles.cardTitle}>{nextClass.title}</Text>
            <Text style={[styles.mutedText, { marginTop: 3 }]}>
              {nextClass.location} • starts in {nextClass.startsIn}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push({ pathname: '/(main)/map', params: { q: nextClass.location } })
              }
            >
              <Text style={styles.buttonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today’s Classes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Classes</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/schedule')}>
              <Text style={{ color: '#007bff' }}>View All</Text>
            </TouchableOpacity>
          </View>

          {sortedToday.length > 0 ? (
            sortedToday.map((cls) => {
              const start = toDate(cls.startISO);
              return (
                <View key={cls.id} style={styles.classRow}>
                  <Text style={styles.timeText}>{timeFmt(start)}</Text>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusColor(cls.startISO, cls.endISO) },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.className}>{cls.title}</Text>
                    <Text style={styles.mutedText}>{cls.location}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.mutedText}>No classes today 🎉</Text>
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/events')}>
              <Text style={{ color: '#007bff' }}>Explore</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {upcomingEvents.map((e) => (
              <View key={e.id} style={[styles.card, styles.smallCard]}>
                <View style={[styles.badge, { backgroundColor: '#e0e7f9' }]}>
                  <Text style={{ fontSize: 10 }}>{e.tag}</Text>
                </View>
                <Text style={styles.className}>{e.name}</Text>
                <Text style={[styles.mutedText, { fontSize: 12 }]}>{e.when}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quick Access */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Access</Text>
          <View style={styles.locationGrid}>
            {quickAccess.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.locationButton}
                onPress={() => router.push({ pathname: '/(main)/map', params: { q: loc.name } })}
              >
                <Text style={styles.locationText}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, backgroundColor: '#f0f0f0' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#666', fontSize: 14 },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#007bff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  mutedText: { color: '#666' },
  cardTitle: { fontWeight: '700', fontSize: 18 },
  button: {
    marginTop: 12,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  timeText: { width: 70, color: '#666' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  className: { fontWeight: '600' },
  smallCard: { width: 160, marginRight: 12 },
  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  locationButton: {
    width: '30%',
    backgroundColor: '#f0f4ff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  locationText: { fontSize: 12, color: '#007bff', fontWeight: '600' },
});
