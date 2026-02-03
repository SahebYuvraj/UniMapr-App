import { supabase } from "../lib/supabase";

export async function addPersonalEvent(event) {
  const { data, error } = await supabase
    .from("personal_events")
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPersonalEvents(userId) {
  const { data, error } = await supabase
    .from("personal_events")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

export async function deletePersonalEvent(id) {
  const { error } = await supabase
    .from("personal_events")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
