// app/(main)/_layout.jsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

export default function MainTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ size, color }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', tabBarIcon: ({ size, color }) => <Ionicons name="map-outline" size={size} color={color} /> }}
      />
       <Tabs.Screen 
       name="schedule"
       options={{ title: 'Schedule',tabBarIcon: ({size,color}) => <Ionicons name="calendar-outline" size={size} color={color} /> }} 
      />
      <Tabs.Screen 
      name="events"  
      options={{ title: 'Events',  tabBarIcon: ({size,color}) => <Ionicons name="pricetags-outline" size={size} color={color} /> }} 
      />
      <Tabs.Screen 
      name="profile" 
      options={{ title: 'Profile', tabBarIcon: ({size,color}) => <Ionicons name="person-outline" size={size} color={color} /> }} 
      />
      <Tabs.Screen
        name="newPost"
        options={{ href: null }} // This hides the tab
        />
        <Tabs.Screen
        name="notifications"
        options={{ href: null }} // This hides the tab
        />
        <Tabs.Screen
        name="editProfile"
        options={{ href: null }} // This hides the tab
        />
          <Tabs.Screen
          name="newEvent"
          options={{ href: null }} // This hides the tab
          />
        
    </Tabs>
    
  );
  
}
