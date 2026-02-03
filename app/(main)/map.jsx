import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';

import MapboxGL, { Logger } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import Icon from '@expo/vector-icons/MaterialIcons';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'PointAnnotation supports max 1 subview',
  'Error in sending style.load event: EventsDisabled',
]);

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
  throw new Error("Missing EXPO_PUBLIC_MAPBOX_TOKEN in env.");
}

// Mapbox init
MapboxGL.setAccessToken(MAPBOX_TOKEN);
MapboxGL.setTelemetryEnabled(false);
MapboxGL.setWellKnownTileServer('mapbox');

// Silence noisy logs
Logger.setLogCallback((log) => {
  const { message } = log;
  if (
    message.includes('Request failed due to a permanent error: Canceled') ||
    message.includes('Request failed due to a permanent error: Socket Closed')
  ) return true;
  return false;
});

// Default to ANU area [lng, lat]
const FALLBACK_DEST = [149.12173222326797, -35.27837872677979];


// Nominatim headers (for search + reverse)
const NOMINATIM_HEADERS = {
  'User-Agent': 'supa-social-app/1.0 (contact: you@example.com)',
  'Accept-Language': 'en',
};

// (optional) bound search around campus
const BBOX = [149.05, -35.33, 149.20, -35.20]; // [west,south,east,north]

// Debounce helper
function debounce(fn, ms = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function reverseGeocodeMapbox([lng, lat]) {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${MAPBOX_TOKEN}&language=en&limit=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox reverse failed: ${res.status}`);
  const json = await res.json();

  const features = json?.features || [];
  const top = json?.features?.[0];
  const poi = features.find((f) => (f.place_type || []).includes('poi'));

  const displayLabel =
    poi?.text ||                    // “Hancock Library”
    top?.text ||                    // short label
    top?.place_name ||              // fallback long
    null;

  return {
    displayLabel,
    name: poi?.text || top?.text || null,
    place_name: top?.place_name || null,
    raw: json,
  };
  // return {
  //   name: top?.text || top?.place_name || null,
  //   place_name: top?.place_name || null,
  //   context: top?.context || [],
  //   raw: json,
  // };
}

// ---- Stat Card (toggle-capable, blue glow when active) ----
function StatCard({ title, value, footer, onPress, active }) {
  return (
    <Pressable onPress={onPress} style={styles.cardShadow}>
      <View style={[styles.statCard, active && styles.statCardActive]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.statTitle, active && styles.statTitleActive]}>
            {title}{active ? ' • Navigating' : ''}
          </Text>
          <Text style={[styles.statValue, active && styles.statValueActive]}>{value}</Text>
          {footer ? (
            <Text style={[styles.statFooter, active && styles.statFooterActive]}>{footer}</Text>
          ) : null}
        </View>
        <Image
          source={require('../../assets/images/direction.png')}
          style={[styles.statIcon, active && styles.statIconActive]}
          resizeMode="contain"
        />
      </View>
    </Pressable>
  );
}

const ROUTE_PROFILES = [
  { id: 'walking',  label: 'Walk',   profile: 'walking',  icon: 'directions-walk' },
  { id: 'cycling',  label: 'Cycle',  profile: 'cycling',  icon: 'directions-bike' },
  { id: 'driving',  label: 'Drive',  profile: 'driving',  icon: 'directions-car'  },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const cameraRef = useRef(null);
  const locationWatchRef = useRef(null);
  const [followZoom, setFollowZoom] = useState(16);

  const paramLng = params?.destLng ? Number(params.destLng) : null;
  const paramLat = params?.destLat ? Number(params.destLat) : null;

  // dest can be null (when cleared)
  const [dest, setDest] = useState(null);
  useEffect(() => {
    if (Number.isFinite(paramLng) && Number.isFinite(paramLat)) {
      setDest([paramLng, paramLat]);
    }
  }, [paramLng, paramLat]);

  // Core state
  const [startCoord, setStartCoord] = useState(null);
  const [userCoord, setUserCoord] = useState(null);          // [lng, lat]
  const [routeFeature, setRouteFeature] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [distanceKm, setDistance] = useState(null);
  const [durationMin, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRouteProfile, setSelectedRouteProfile] = useState('walking');
  const [destinationCoords, setDestinationCoords] = useState(null); // end of route
  const [selectedCoord, setSelectedCoord] = useState(null); // [lng, lat]

  // Navigation mode
  const [isNavigating, setIsNavigating] = useState(false);

  // Search UI state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]); // {display_name, lat, lon}
  const [searchBusy, setSearchBusy] = useState(false);


  // Permissions + initial location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLoading(false); return; }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserCoord([pos.coords.longitude, pos.coords.latitude]);
      setStartCoord([pos.coords.longitude, pos.coords.latitude]);
    })();
  }, []);

  // Start/stop live tracking when isNavigating changes
  useEffect(() => {
    let unsub = null;

    const startWatch = async () => {
      try {
        unsub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 2,
          },
          (loc) => {
            const lngLat = [loc.coords.longitude, loc.coords.latitude];
            setUserCoord(lngLat);
            cameraRef.current?.flyTo(lngLat, 400);
          }
        );
        locationWatchRef.current = unsub;
      } catch (e) {
        console.warn('watchPositionAsync failed', e?.message || e);
      }
    };

    if (isNavigating) {
      startWatch();
    } else {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove?.();
        locationWatchRef.current = null;
      }
    }

    return () => {
      if (unsub) unsub.remove?.();
    };
  }, [isNavigating]);

  // Directions fetch (Mapbox) whenever user/dest/profile change
  useEffect(() => {
    (async () => {
      if (!userCoord || !dest) return; // <-- guard: no route if dest cleared
      setLoading(true);

      const profile = selectedRouteProfile; // 'walking' | 'cycling' | 'driving'
      const coordinates = `${userCoord[0]},${userCoord[1]};${dest[0]},${dest[1]}`;
      const url =
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}` +
        `?alternatives=false&overview=full&geometries=geojson&access_token=${MAPBOX_TOKEN}`;

      try {
        const res = await fetch(url);
        const json = await res.json();

        if (!json?.routes?.length) {
          setRouteFeature(null);
          setDistance(null);
          setDuration(null);
          setDestinationCoords(null);
          setLoading(false);
          return;
        }

        const route = json.routes[0];
        setDistance(Number((route.distance / 1000).toFixed(2))); // km
        setDuration(Math.round(route.duration / 60));            // minutes

        const last = route.geometry?.coordinates?.slice(-1)?.[0] ?? null;
        setDestinationCoords(last || dest);

        const line = route.geometry; // GeoJSON LineString
        setRouteFeature({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: line }],
        });
      } catch (e) {
        console.warn('Directions fetch failed', e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userCoord, dest, selectedRouteProfile]);

  // Reverse-geocode current dest for modal info
  useEffect(() => {
  let cancelled = false;

  (async () => {
    if (!dest) return;
    try {
      const data = await reverseGeocodeMapbox(dest);
      if (!cancelled) setLocationData(data);
    } catch (err) {
      console.warn('Reverse geocode failed', err?.message || err);
    }
  })();

  return () => { cancelled = true; };
}, [dest]);
 
  const initialCamera = userCoord || FALLBACK_DEST;

  // --- Search: fetch suggestions with debounce ---
  const doSearch = useMemo(
    () => 
      debounce(async (text) => { 
        if (!text || text.trim().length < 2) {
          setSuggestions([]);
          setSearchBusy(false);
          return;
        }
        try {
          setSearchBusy(true);
          const params = new URLSearchParams({
            q: text.trim(),
            format: 'json',
            addressdetails: '1',
            limit: '8',
            viewbox: BBOX.join(','),
            bounded: '1',
          }).toString();

          const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: NOMINATIM_HEADERS,
          });
          const arr = await resp.json();
          setSuggestions(arr || []);
        } catch (e) {
          console.warn('Search failed', e?.message || e);
          setSuggestions([]);
        } finally {
          setSearchBusy(false);
        }
      }, 350),
    []
  );

  const onChangeQuery = (text) => {
    if (isNavigating) return; // lock while navigating
    setQuery(text);
    setSuggestions([]);
    setSearchBusy(true);
    doSearch(text);
  };

  const selectSuggestion = (item) => {
    if (isNavigating) return; // lock while navigating
    const lng = Number(item.lon);
    const lat = Number(item.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      setDest([lng, lat]);
      setQuery(item.display_name || '');
      setSuggestions([]);
      cameraRef.current?.flyTo([lng, lat], 800);
    }
  };

  const onMapPress = async (e) => {
    if (isNavigating) return; // lock while navigating
    const [lng, lat] = e.geometry?.coordinates || [];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    const next = [lng, lat];    
    setSelectedCoord(next);
    setDest(next);
    cameraRef.current?.flyTo([lng, lat], 600);

    try {
      const data = await reverseGeocodeMapbox(next);
      setQuery(data?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  // ← UPDATED: clear also removes destination & route when NOT navigating
  const clearQuery = () => {
    if (isNavigating) return; // keep locked during navigation
    setQuery('');
    setSuggestions([]);
    setDest(null);               // remove destination completely
    setRouteFeature(null);       // clear route
    setDistance(null);
    setDuration(null);
    setDestinationCoords(null);  // clear end marker
  };

  const toggleNavigation = async () => {
    if (!dest || !userCoord) return;
    setIsNavigating((prev) => !prev);
    if (!isNavigating) {
      setFollowZoom(16);
      cameraRef.current?.flyTo(userCoord, 300);
    }
  };

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity style={styles.suggestionRow} onPress={() => selectSuggestion(item)}>
      <Ionicons name="business-outline" size={16} color="#334155" style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.suggestionTitle}>
          {item.display_name}
        </Text>
        {item.address?.building || item.address?.amenity ? (
          <Text numberOfLines={1} style={styles.suggestionSubtitle}>
            {item.address?.building || item.address?.amenity}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderProfileItem = ({ item }) => {
    const selected = item.id === selectedRouteProfile;
    return (
      <TouchableOpacity
        style={[
          styles.routeProfileButton,
          selected && styles.routeProfileButtonSelected,
          isNavigating && { opacity: 0.4 },
        ]}
        onPress={() => !isNavigating && setSelectedRouteProfile(item.id)}
        activeOpacity={0.8}
      >
        <Icon name={item.icon} size={18} color={selected ? '#fff' : '#e5e7eb'} style={{ marginBottom: 2 }} />
        <Text style={[styles.routeProfileText, selected && styles.routeProfileTextSelected]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper style={styles.container}>

    {/* <View
        style={[
          styles.searchWrap,
          { top: insets.top + 8, opacity: isNavigating ? 0.5 : 1 },
        ]}
        pointerEvents={isNavigating ? 'none' : 'auto'}
      ><Text>Search</Text></View>  */}
      {/* the small search written on top */}
      {/* very important for new search bar to be below this one */}
    
      {/* SEARCH BAR */}

      <View
        style={[
          styles.searchWrap,
          { top: insets.top + 8, opacity: isNavigating ? 0.5 : 1 },
        ]}
        pointerEvents={isNavigating ? 'none' : 'auto'}
      >
      
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748b" style={{ marginHorizontal: 8 }} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search buildings, places…"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} hitSlop={10} style={styles.clearPill}>
              <Ionicons name="close" size={16} color="#0f172a" />
            </TouchableOpacity>
          )}
        </View>

        {(suggestions.length > 0 || searchBusy) && (
          <View style={styles.suggestionBox}>
            {searchBusy ? (
              <View style={styles.suggestionLoading}>
                <ActivityIndicator size="small" />
                <Text style={{ marginLeft: 8, color: '#475569' }}>Searching…</Text>
              </View>
            ) : (
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={suggestions}
                keyExtractor={(item, idx) => `${item.place_id}-${idx}`}
                renderItem={renderSuggestion}
                style={{ maxHeight: 240 }}
              />
            )}
          </View>
        )}
      </View>

      <MapboxGL.MapView
        style={{ flex: 1 }}
        styleURL="mapbox://styles/yuvraj275/cmf88sn6h000z01sshm0u1xbf"
        rotateEnabled
        zoomEnabled
        onPress={onMapPress}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={followZoom}
          centerCoordinate={initialCamera}
          pitch={isNavigating ? 20 : 10}
          bearing={0}
          followUserLocation={isNavigating}
          followZoomLevel={followZoom}
          animationMode="flyTo"
          animationDuration={400}
        />
        {selectedCoord && (
  <MapboxGL.ShapeSource
    id="selectedPoint"
    shape={{
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: selectedCoord },
        },
      ],
    }}
  >
    {/* Outer glow */}
    <MapboxGL.CircleLayer
      id="selectedGlow"
      style={{
        circleRadius: 18,
        circleColor: '#1673ff',
        circleOpacity: 0.25,
      }}
    />
    {/* Inner dot */}
    <MapboxGL.CircleLayer
      id="selectedDot"
      style={{
        circleRadius: 7,
        circleColor: '#1673ff',
        circleOpacity: 0.95,
        circleStrokeWidth: 2,
        circleStrokeColor: '#ffffff',
      }}
    />
  </MapboxGL.ShapeSource>
)}

        {/* User marker */}
        <MapboxGL.UserLocation animated androidRenderMode="gps" showsUserHeadingIndicator />

        {/* Route end marker (from geometry) */}
        {destinationCoords && (
          <MapboxGL.PointAnnotation id="destinationPoint" coordinate={destinationCoords}>
            <View style={styles.destinationIcon}>
              <Ionicons name="storefront" size={22} color="#3300ff" />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Original dest marker for modal — render only if dest exists */}
        {dest && (
          <MapboxGL.MarkerView coordinate={dest} allowOverlap>
            <Pressable
              onPress={() => !isNavigating && setModalVisible(true)}
              hitSlop={20}
              style={styles.markerPressable}
            >
              <View style={styles.markerChip}>
                <Fontisto name="map-marker" size={24} color="#0073ff" style={{ marginTop: 1 }} />
              </View>
            </Pressable>
          </MapboxGL.MarkerView>
        )}

        {/* Route line */}
        {routeFeature && (
          <MapboxGL.ShapeSource id="route" shape={routeFeature}>
            <MapboxGL.LineLayer
              id="routeLine"
              style={{
                lineColor: isNavigating ? '#1673ff' : '#288aeb',
                lineWidth: isNavigating ? 6 : 5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {/* Back */}
      {/* <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => router.back()}
      >
        <Icon name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity> */}

      {/* Top-right: stats + profile pills */}
      <View style={[styles.topRightStack, { top: insets.top + 56 /* below search */ }]}>
        {!loading && distanceKm != null && durationMin != null && (
          <StatCard
            title={selectedRouteProfile === 'walking' ? 'Walk' : selectedRouteProfile === 'cycling' ? 'Cycle' : 'Drive'}
            value={`${durationMin} min`}
            footer={`• ${distanceKm} km`}
            active={isNavigating}
            onPress={toggleNavigation}
          />
        )}

        <FlatList
          data={ROUTE_PROFILES}
          renderItem={renderProfileItem}
          keyExtractor={(item) => item.id}
          horizontal
          contentContainerStyle={styles.routeProfileList}
          showsHorizontalScrollIndicator={false}
          style={styles.routeProfileListWrapper}
        />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Calculating route…</Text>
        </View>
      )}

      {/* Info modal for dest marker */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Location info</Text>
              <Pressable onPress={() => setModalVisible(false) }  hitSlop={12} style={styles.closePill}>
                
                <Text style={styles.closePillText}>Close</Text>
              </Pressable>
            </View>
            {/* {console.log('Location data:', locationData)} */}
            <Text>Place: {locationData?.place_name ?? '—'}</Text>
            <Text>Name: {locationData?.name ?? '—'}</Text>
          </View>
        </View>
      </Modal>
      
          

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // SEARCH
  searchWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    height: 28,
    fontSize: 14,
    color: '#0f172a',
  },
  clearPill: {
    paddingHorizontal: 10,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionBox: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  suggestionTitle: { color: '#0f172a', fontWeight: '600', fontSize: 13 },
  suggestionSubtitle: { color: '#475569', fontSize: 12, marginTop: 2 },
  suggestionLoading: { flexDirection: 'row', alignItems: 'center', padding: 12 },

  // Back
  backButton: {
    position: 'absolute',
    left: 14,
    zIndex: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
  },

  // Top-right stack
  topRightStack: {
    position: 'absolute',
    right: 15,
    zIndex: 3,
    alignItems: 'flex-end',
  },

  // Card
  cardShadow: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  statCard: {
    width: 200,
    minHeight: 88,
    borderRadius: 12,
    backgroundColor: 'rgba(51,73,95,0.86)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statCardActive: {
    backgroundColor: 'rgba(22, 115, 255, 0.9)',
    shadowColor: '#1673ff',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  statTitle: { color: '#cbd5e1', fontSize: 12, letterSpacing: 0.3 },
  statTitleActive: { color: '#e6f0ff' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 },
  statValueActive: { color: '#fff' },
  statFooter: { color: '#cbd5e1', fontSize: 12, marginTop: 4 },
  statFooterActive: { color: '#e6f0ff' },
  statIcon: { width: 22, height: 22, opacity: 0.9, tintColor: '#fff' },
  statIconActive: { tintColor: '#dbeafe' },

  // Profile pills
  routeProfileListWrapper: { marginTop: 8 },
  routeProfileList: { paddingVertical: 4, paddingHorizontal: 6 },
  routeProfileButton: {
    minWidth: 66,
    height: 32,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(17,24,39,0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeProfileButtonSelected: {
    backgroundColor: 'rgba(37,99,235,0.9)',
    borderColor: 'rgba(37,99,235,1)',
  },
  routeProfileText: { color: '#e5e7eb', fontSize: 12, fontWeight: '600' },
  routeProfileTextSelected: { color: '#fff' },

  // Marker/route visuals
  markerPressable: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerChip: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  destinationIcon: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)',
  },

  // Loader
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -40 }],
    width: 160,
    paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 3,
  },
  loadingText: { color: '#fff', marginTop: 8, fontWeight: '600' },

  // Modal
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 16,
    marginHorizontal: 20, padding: 20, elevation: 5,
    width: Dimensions.get('window').width - 40,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between', },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  closePill: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f2f2f2', borderRadius: 8 },
  closePillText: { fontSize: 14, color: '#111' },
});
