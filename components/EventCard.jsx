import { Image } from "expo-image";
import { CalendarHeart, MapPin } from "lucide-react-native";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../assets/icons";
import { hp } from "../constants";
import theme from "../constants/theme";
import { getSupabaseFileUrl } from "../services/imageService";
import { createEventInterest, removeEventInterest } from "../services/postService";

const EventCard = ({ item, currentUser, router }) => {

  const [interests, setInterests] = useState([]);


  useEffect(() => {
        setInterests(item?.eventLikes);
    },[])
    
    const toggleInterest = async () => {

      console.log('Toggling interest for event:', item?.id);
    if (interested) {
      
      console.log('Toggling interest for event2:', item?.id);

      let updatedInterests = interests.filter(interest => interest.userid != currentUser?.id);
              setInterests([...updatedInterests]);
              let res = await removeEventInterest(item?.id, currentUser?.id);
              if(!res.success){
                  Alert.alert('Error', res.msg);
              }
    }
    else {
      console.log('Toggling interest for event3:', item?.id);
      let data = {
            userid: currentUser?.id,
            eventid: item?.id,
        }
        setInterests([...interests, data]);
        const res = await createEventInterest(data);
        if(!res.success){
            console.log(res.msg);
        }
    }
  };

  const interested = interests.filter(interest => interest.userid == currentUser?.id)[0]? true : false;

  return (
    <TouchableOpacity
      style={[styles.container]}
      activeOpacity={0.9}
      // onPress={() =>
      //   router.push({
      //     pathname: "eventDetails",
      //     params: { eventId: item.id },
      //   })
      // }

    >
      {/* BANNER */}
      <View style={styles.bannerWrapper}>
        <Image
          // source={{ uri: item.banner }}
          source = {getSupabaseFileUrl(item?.banner)}
          style={styles.banner}
          contentFit="cover"
        />

        <View style={styles.bannerOverlay} />

        <Text numberOfLines={2} style={styles.bannerTitle}>
          {item.title}
        </Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* DESCRIPTION */}
        {item.description && (
          <Text numberOfLines={3} style={styles.description}>
            {item.description}
          </Text>
        )}

        {/* DATE */}
        <View style={styles.row}>
          {/* <Icon name="threeDotsHorizontal" size={hp(2)} color={theme.colors.textLight} /> */}
          <CalendarHeart color="#2563EB" size={22} strokeWidth={1.7} />
          <Text style={styles.info}>
            {/* {new Date(item.start_time).toLocaleString()} */}
            {DateTime.fromISO(item.start_time).toFormat("dd LLL h:mm a")}
          </Text>
        </View>

        {/* LOCATION */}
        <View style={styles.row}>
          {/* <Icon name="location" size={hp(2)} color={theme.colors.textLight} /> */}
          <MapPin color="#2563EB" size={22} strokeWidth={1.7} />
          <Text style={styles.info}>{item.location}</Text>
        </View>

        {/* ATTENDEES -- thinking to remove this since there can be more or less ppl there
        <View style={styles.row}>
          <Icon name="threeDotsHorizontal" size={hp(2)} color={theme.colors.textLight} />
          <Text style={styles.info}>
            {item.attending_count || 0} / {item.max_attendees || "∞"} attending
          </Text>
        </View> */} 
        

        {/* ORGANISER AND INTERESTED BUTON
        {item.organiser?.name && (
          <Text style={styles.organizer}>Organised by {item.organiser.name}</Text>
        )} */}

        {/* ORGANISER + INTERESTED BUTTON */}
        <View style={styles.footerRow}>
          <Text style={styles.organizer}>
            by {item.organiser?.name || "Unknown"}
          </Text>

          <TouchableOpacity
  onPress={toggleInterest}
  activeOpacity={0.8}
  style={[
    styles.interestBtn,
    interested && styles.interestBtnActive
  ]}
>
  <Icon
    name="heart"
    size={hp(1.8)}
    color={interested ? theme.colors.rose : theme.colors.textLight}
    fill={interested ? theme.colors.rose : "transparent"}
    strokeWidth={2}
  />

  <Text
    style={[
      styles.interestBtnText,
      interested && styles.interestBtnTextActive
    ]}
  >
    {interested ? "Interested" : "Interested"}
  </Text>
</TouchableOpacity>


            

        </View>

      </View>
    </TouchableOpacity>
  );
};

export default EventCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: theme.radius.xxl,
    borderCurve: "continuous",
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    overflow: "hidden",
  },

  bannerWrapper: {
    height: hp(22),
    width: "100%",
    position: "relative",
  },

  banner: {
    height: "100%",
    width: "100%",
  },

  bannerOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  bannerTitle: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    color: "white",
    fontSize: hp(2.1),
    fontWeight: theme.fonts.semibold,
  },

  content: {
    padding: 12,
    gap: 6,
  },

  description: {
    color: theme.colors.textLight,
    fontSize: hp(1.7),
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  info: {
    fontSize: hp(1.75),
    color: theme.colors.textDark,
  },

  organizer: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginTop: 8,
  },
  footerRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 10,
},

interestedButton: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: theme.colors.roseLight,
  backgroundColor: "rgba(255, 99, 132, 0.08)", // subtle glassy pink
},

interestedText: {
  color: theme.colors.rose,
  fontWeight: theme.fonts.medium,
  fontSize: hp(1.6),
},
interestBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "rgba(255,99,132,0.4)", // soft rose border
  backgroundColor: "rgba(255,99,132,0.08)", // glassy background
},

interestBtnActive: {
  backgroundColor: "rgba(255,99,132,0.15)",
  borderColor: theme.colors.rose,
},

interestBtnText: {
  fontSize: hp(1.55),
  color: theme.colors.textLight,
  fontWeight: theme.fonts.medium,
},

interestBtnTextActive: {
  color: theme.colors.rose,
},
interestBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.15)", // neutral, uncolored
  backgroundColor: "rgba(255,255,255,0.15)", // very subtle glass (almost invisible)
  backdropFilter: "blur(6px)", // RN workaround (see below)
},

interestBtnActive: {
  backgroundColor: "rgba(255,99,132,0.15)", // rose glass
  borderColor: theme.colors.rose,
},

interestBtnText: {
  fontSize: hp(1.55),
  color: theme.colors.textLight,
  fontWeight: theme.fonts.medium,
},

interestBtnTextActive: {
  color: theme.colors.rose,
},


});

