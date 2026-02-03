import { supabase } from "../lib/supabase";

export const mapICalToCalendarKit = (icalEvent) => ({
  id: icalEvent.id,
  title: icalEvent.title,
  description: icalEvent.location,
  color: "#E8F0FE", // You can randomize or categorize later
  start: {
    dateTime: icalEvent.startISO,
  },
  end: {
    dateTime: icalEvent.endISO,
  },
});

export function dbToEventItem(row) {
  return {
    id: String(row.id),
    title: row.title ?? "Untitled",
    start: { dateTime: new Date(row.start_time).toISOString() },
    end: { dateTime: new Date(row.end_time).toISOString() },
    color: row.color ?? "#E5E7EB",
    description: row.description ?? null,
    location: row.location ?? null,
    user_id: row.user_id ?? null,
    created_at: row.created_at ?? null,
  };
}

export function eventItemToDbInsert(event, userId) {
  return {
    user_id: userId,
    title: event.title ?? "New Event",
    description: event.description ?? null,
    location: event.location ?? null,
    color: event.color ?? null,
    start_time: new Date(event.start?.dateTime ?? event.start).toISOString(),
    end_time: new Date(event.end?.dateTime ?? event.end).toISOString(),
  };
}

export async function fetchUserEvents({userId, fromISO, toISO}) {
  const { data, error } = await supabase
    .from("timeTable")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", fromISO)
    .lte("end_time", toISO);

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  return (data ?? []).map(dbToEventItem);
}

export async function insertEvent(userId, eventItem) {
  const eventData = eventItemToDbInsert(eventItem, userId);
  
  const { data, error } = await supabase
    .from("timeTable")
    .insert(eventData)
    .select()
    .single();

  if (error) {
    console.error("Error inserting event:", error);
    throw error;
  }

  return dbToEventItem(data);
}

export async function updateEvent({ userId, eventItem }) {
  const updatePayload = eventItemToDbUpdate(eventItem);

  const { data, error } = await supabase
    .from("timeTable")
    .update(updatePayload)
    .eq("id", eventItem.id)
    .eq("user_id", userId)     // protects against editing others
    .select("*")
    .single();

  if (error) throw error;
  return dbToEventItem(data);
}

export function eventItemToDbUpdate(event) {
  return {
    title: event.title ?? "Untitled",
    description: event.description ?? null,
    location: event.location ?? null,
    color: event.color ?? null,
    start_time: new Date(event.start?.dateTime ?? event.start).toISOString(),
    end_time: new Date(event.end?.dateTime ?? event.end).toISOString(),
  };
}

export async function deleteEvent({ userId, eventId }) {
  const { error } = await supabase
    .from("timeTable")
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) throw error;
  return true;
}

