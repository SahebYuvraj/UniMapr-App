import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { DateTime } from "luxon";
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../constants';
import theme from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault("Australia/Sydney");
// here i would need file url and create or update post
import { createOrUpdateEvent } from '../../services/postService';


export default function NewEvent() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  // the new post uses 
  //let data = { file, body: bodyRef.current, userid: user?.id }
  // so we need to use the same file structure -- and same file imagepicker

  const [eventData, setEventData] = useState({
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    maxAttendees: '',
    description: '',
  });

  const isLocalFile = (file) => {
  if (!file) return false;
  return typeof file === "object"; // local object from ImagePicker
  };

  const getFileUri = (file) => {
  if (!file) return null;

  if (isLocalFile(file)) {
    return file.uri; // Local upload preview
  }

  // if it's a remote saved path
  return getSupabaseFileUrl(file)?.uri; // You already have this helper from posts
  };

  const pickBanner = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) setBanner(result.assets[0]);
  };

  const handleChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const onSubmit = async () => {
    if (
      !eventData.title ||
      !eventData.startDate ||
      !eventData.startTime ||
      !eventData.endDate ||
      !eventData.endTime ||
      !eventData.location
    ) {
      alert("Please fill all required fields.");
      return;
    }

// Convert to ISO using Luxon
const start = DateTime.fromFormat(
  `${eventData.startDate} ${eventData.startTime}`,
  "MMM d, yyyy h:mm a",
  { zone: "Australia/Sydney" }
);

const end = DateTime.fromFormat(
  `${eventData.endDate} ${eventData.endTime}`,
  "MMM d, yyyy h:mm a",
  { zone: "Australia/Sydney" }
);

if (!start.isValid || !end.isValid) {
  console.log("Invalid dates:", start.invalidExplanation, end.invalidExplanation);
  alert("Invalid date or time format.");
  return;
}

const startISO = start.toUTC().toISO();
const endISO = end.toUTC().toISO();

// DEBUG
console.log("===== LUXON DEBUG =====");
console.log("Start (LOCAL):", start.toString());
console.log("Start (ISO):", startISO);
console.log("End (LOCAL):", end.toString());
console.log("End (ISO):", endISO);
console.log("========================");



    const payload = {
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    max_attendees: eventData.maxAttendees || null,
    start_time: startISO,
    end_time: endISO,
    organiser_id: user?.id,
    banner: banner, // local asset, will be uploaded inside service
  };


    setLoading(true);
    let res = await createOrUpdateEvent(payload);
    setLoading(false);



    if (res.success) {
      alert("Event created successfully!");
      setEventData({
        title: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        maxAttendees: '',
        description: '',
      });
      setBanner(null);
      router.back();

    }
    

    else {
    alert("Error: " + res.msg);
  }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title="Create Event" />

        {/* ================= HEADER ROW (Avatar + Toggle) ================= */}
        <View style={styles.header}>
          {/* LEFT: User Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar uri={user?.image} size={hp(6.5)} rounded={theme.radius.xl} />

            <View style={{ gap: 2 }}>
              <Text style={styles.username}>{user?.name}</Text>
              <Text style={styles.smallText}>Creating an event</Text>
            </View>
          </View>

          {/* RIGHT: Exact same toggle as NewPost */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              onPress={() => router.push('/newPost')}
              style={[styles.toggleButton]}
            >
              <Text style={styles.toggleText}>Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/newEvent')}
              style={[styles.toggleButton, styles.toggleButtonActive]}
            >
              <Text style={[styles.toggleText, styles.toggleTextActive]}>
                Event
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= FORM SCROLL ================= */}
        <ScrollView contentContainerStyle={{ gap: 25, paddingBottom: 50 }}>

          {/* Banner upload */}
          <TouchableOpacity style={styles.bannerUpload} onPress={pickBanner}>
            {banner ? (
              <Image source={{ uri: getFileUri(banner) }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Icon name="image" size={32} color={theme.colors.textLight} />
                <Text style={styles.bannerText}>Upload Event Banner</Text>
              </View>
            )}
          </TouchableOpacity>
          {/* missing a delete button for banner */}

          {/* FORM */}
          <View style={styles.form}>

            {/* TITLE */}
            <TextInput
              placeholder="Event Title *"
              placeholderTextColor={theme.colors.textLight}
              style={styles.input}
              value={eventData.title}
              onChangeText={t => handleChange('title', t)}
            />

            {/* START DATE + TIME */}
            <Text style={styles.sectionLabel}>Start *</Text>

            <TextInput
              placeholder="Start Date (e.g., Nov 20, 2025)"
              placeholderTextColor={theme.colors.textLight}
              style={styles.input}
              value={eventData.startDate}
              onChangeText={t => handleChange('startDate', t)}
            />

            <TextInput
              placeholder="Start Time (e.g., 6:00 PM)"
              placeholderTextColor={theme.colors.textLight}
              style={styles.input}
              value={eventData.startTime}
              onChangeText={t => handleChange('startTime', t)}
            />

            {/* END DATE + TIME */}
            <Text style={styles.sectionLabel}>End *</Text>

            <TextInput
              placeholder="End Date (e.g., Nov 20, 2025)"
              placeholderTextColor={theme.colors.textLight}
              style={styles.input}
              value={eventData.endDate}
              onChangeText={t => handleChange('endDate', t)}
            />

            <TextInput
              placeholder="End Time (e.g., 9:00 PM)"
              placeholderTextColor={theme.colors.textLight}
              style={styles.input}
              value={eventData.endTime}
              onChangeText={t => handleChange('endTime', t)}
            />

            {/* LOCATION */}
            <TextInput
              placeholder="Location *"
              placeholderTextColor={theme.colors.textLight}
              style={styles.input}
              value={eventData.location}
              onChangeText={t => handleChange('location', t)}
            />

            {/* MAX ATTENDEES */}
            <TextInput
              placeholder="Max Attendees (Optional)"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textLight}
              style={styles.input}
              value={eventData.maxAttendees}
              onChangeText={t => handleChange('maxAttendees', t)}
            />

            {/* DESCRIPTION */}
            <TextInput
              placeholder="Event Description"
              placeholderTextColor={theme.colors.textLight}
              multiline
              style={[styles.input, styles.description]}
              value={eventData.description}
              onChangeText={t => handleChange('description', t)}
            />

          </View>
        </ScrollView>

        {/* SUBMIT BUTTON */}
        <Button
          title="Create Event"
          loading={loading}
          hasShadow={true}
          buttonStyle={{ height: hp(6.5) }}
          onPress={onSubmit}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    gap: 20,
  },

  /* ============== HEADER ROW (Avatar + Toggle) ============== */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  smallText: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
  },

  /* ============== TOGGLE (Copied exactly from NewPost) ============== */
  toggleContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(9, 116, 238, 0.5)',
    borderColor: 'rgba(136, 143, 240, 0.4)',
    shadowColor: '#3b8eecff',
    shadowOpacity: 0.75,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  toggleText: {
    fontSize: hp(1.8),
    color: theme.colors.textDark,
  },
  toggleTextActive: {
    color: 'white',
    fontWeight: theme.fonts.semibold,
  },

  /* ============== BANNER ============== */
  bannerUpload: {
    width: '100%',
    height: hp(22),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bannerText: {
    color: theme.colors.textLight,
    fontSize: hp(1.7),
  },

  /* ============== FORM ============== */
  form: { gap: 18 },

  input: {
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    fontSize: hp(1.9),
    color: theme.colors.textDark,
    backgroundColor: 'white',
  },

  description: {
    minHeight: hp(12),
    textAlignVertical: 'top',
  },

  sectionLabel: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    fontWeight: '600',
    marginTop: 5,
    marginBottom: -5,
  },
});
