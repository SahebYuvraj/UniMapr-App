// services/icalService.js
import ICAL from 'ical.js';

/**
 * Fetch and parse iCal file into a clean list of events
 * @param {string} icalUrl - Public .ics link (e.g. ANU MyTimetable export)
 * @returns {Promise<Array>} Array of event objects
 */
export const fetchICalEvents = async (icalUrl) => {
  try {
    if (!icalUrl) {
      console.warn("fetchICalEvents: No iCal URL provided");
      return [];
    }

    // Fetch raw .ics file
    const res = await fetch(icalUrl);
    if (!res.ok) {
      console.error("fetchICalEvents: Failed to fetch iCal", res.status);
      return [];
    }
    const text = await res.text();

    // Parse into jCal structure
    const jcalData = ICAL.parse(text);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    // Convert into clean JSON objects
    const parsedEvents = vevents.map((ve, idx) => {
      const ev = new ICAL.Event(ve);

      let cleanTitle = ev.summary || "Untitled Event";
      cleanTitle = cleanTitle.replace(/\(Class.*?\)/, "").replace(/,\s*Com.*/, "").trim();

      

      return {
        id: ev.uid || `event-${idx}`,
        title: cleanTitle,
        location: ev.location || "No location",
        description: ev.description || "",
        startISO: ev.startDate?.toJSDate().toISOString(),
        endISO: ev.endDate?.toJSDate().toISOString(),
        raw: ev, // keep raw ICAL.Event for debugging/advanced use
      };
    });

    return parsedEvents;
  } catch (err) {
    console.error("fetchICalEvents: parse error", err);
    return [];
  }
};
