// src/screens/Calendar/styles.ts
import { StyleSheet } from "react-native";

export const COLORS = {
  bg: "#EEF2FF",
  card: "#fff",
  text: "#111",
  muted: "rgba(0,0,0,0.45)",
  pill: "#F3F4F6",
  blue: "#3B82F6",
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  dateBox: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },

  navBtn: {
    backgroundColor: COLORS.pill,
    borderRadius: 10,
    padding: 6,
  },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },

  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.pill,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  todayText: { fontSize: 12, fontWeight: "800", color: COLORS.text },

  viewRow: { flex: 1, flexDirection: "row", gap: 8 },
  viewPill: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  viewPillActive: { backgroundColor: COLORS.text },
  viewPillText: { fontSize: 12, fontWeight: "800", color: COLORS.text },
  viewPillTextActive: { color: "#fff" },

  strip: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },

  dateItem: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  dateActive: { backgroundColor: COLORS.blue },

  dateDow: { fontSize: 10, color: "#6B7280", marginBottom: 2, fontWeight: "600" },
  dateDowActive: { color: "#fff" },

  dateNum: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  dateNumActive: { color: "#fff" },

  zoomRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  zoomBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  zoomText: { fontSize: 12, fontWeight: "600", color: COLORS.text },

  bannerCreate: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  bannerEdit: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#E0F2FE",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  bannerText: { fontSize: 12, fontWeight: "700", color: COLORS.text },

  calendarFull: {
    flex: 1,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  hourText: { fontSize: 10, color: COLORS.muted },

  eventCard: { flex: 1, borderRadius: 12, padding: 6 },
  eventTitle: { fontWeight: "700", color: COLORS.text, fontSize: 11 },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: { backgroundColor: COLORS.card, borderRadius: 18, padding: 14 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },

  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 6,
  },
  weekHeaderText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(0,0,0,0.5)",
  },

  daysGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  dayCellSelected: { backgroundColor: COLORS.text },
  dayCellToday: { borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" },
  dayCellText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  dayCellTextMuted: { color: "rgba(0,0,0,0.25)" },
  dayCellTextSelected: { color: "#fff" },

  modalFooter: { flexDirection: "row", gap: 10, marginTop: 10 },
  modalClose: {
    flex: 1,
    backgroundColor: COLORS.pill,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  modalCloseText: { fontWeight: "800", color: COLORS.text },
  modalToday: {
    flex: 1,
    backgroundColor: COLORS.text,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  modalTodayText: { fontWeight: "800", color: "#fff" },
});
