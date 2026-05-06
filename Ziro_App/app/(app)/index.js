import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView,
  ImageBackground, LayoutAnimation, Platform, UIManager, Alert, Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getProfile, triggerSos, updateLocation } from "../../apis/authapi";
import * as Location from 'expo-location';

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Card Component ---
const Card = ({ icon, summary, details }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };
  return (
    <TouchableOpacity
      style={[styles.card, expanded && styles.cardItemExpanded]}
      activeOpacity={0.9}
      onPress={toggleExpand}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={20} color="#fff" />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#fff", marginTop: 10 }}>{summary}</Text>
          {expanded && (
            <View style={styles.details}>
              <Text style={styles.detailText}>{details}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Emergency Contact Component ---
const EmergencyContact = ({ icon, name, number }) => (
  <TouchableOpacity 
    style={styles.emergencyCard}
    onPress={() => {
      Alert.alert(`Call ${name}`, `Ready to call ${number}?`, [
        { text: 'Cancel', onPress: () => {} },
        { text: 'Call', onPress: () => Alert.alert('Calling', `Dialing ${number}...`) }
      ]);
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
      <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      <View style={{flex: 1}}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{name}</Text>
        <Text style={{ color: '#aaa', fontSize: 12 }}>{number}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </View>
  </TouchableOpacity>
);

// --- Menu Component ---
const HamburgerMenu = ({ visible, onClose, onLogout }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={styles.menuBackdrop}
      onPress={onClose}
      activeOpacity={1}
    >
      <View style={styles.menuContainer}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings" size={24} color="#fff" />
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle" size={24} color="#fff" />
          <Text style={styles.menuItemText}>Help & Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle" size={24} color="#fff" />
          <Text style={styles.menuItemText}>About Ziro</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={onLogout}
        >
          <Ionicons name="log-out" size={24} color="#fff" />
          <Text style={styles.menuItemText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

// --- Main HomeScreen Component ---
export default function HomeScreen() {
  const { logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [isSosActive, setIsSosActive] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [loadingWeather, setLoadingWeather] = useState(false);
  const locationSubscription = useRef(null);
  
  // Static data for demo purposes
  const staticAlerts = [
    { id: "1", title: "🚧 Landslide Alert", description: "Road blocked for 2 hrs" },
    { id: "2", title: "🌊 Flood Warning", description: "Reported at 1:30 PM" },
  ];

  // Update date/time every minute
  useEffect(() => {
    const updateDateTime = () => {
      setDateTime(new Date());
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get user profile and location
  useEffect(() => {
    const loadProfileAndLocation = async () => {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
      } catch (error) {
        console.log('Profile load error:', error);
        setUserProfile(null);
      }

      // Get current location
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc.coords);
          
          // Get reverse geocode for location name
          try {
            const address = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (address && address.length > 0) {
              const addr = address[0];
              setLocation((prev) => ({
                ...prev,
                city: addr.city || addr.district || 'Unknown',
                region: addr.region || '',
              }));
            }
          } catch (e) {
            console.log('Geocode error:', e);
          }

          // Get weather for this location
          await fetchWeather(loc.coords.latitude, loc.coords.longitude);
        }
      } catch (error) {
        console.log('Location error:', error);
      }
    };

    loadProfileAndLocation();
    
    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  // Fetch weather data from Open-Meteo API (free, no key required)
  const fetchWeather = async (latitude, longitude) => {
    try {
      setLoadingWeather(true);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m&temperature_unit=celsius`
      );
      const data = await response.json();
      
      if (data.current) {
        const weatherCode = data.current.weather_code;
        const description = getWeatherDescription(weatherCode);
        
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          description: description,
          humidity: data.current.relative_humidity_2m,
        });
      }
    } catch (error) {
      console.log('Weather API error:', error);
      // Fallback to default
      setWeather({
        temperature: 28,
        description: 'Check weather',
        humidity: 65,
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  // Convert WMO weather codes to descriptions
  const getWeatherDescription = (code) => {
    const weatherDescriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with hail',
    };
    return weatherDescriptions[code] || 'Check weather';
  };

  const handleStartSos = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required for SOS.');
      return;
    }
    Alert.alert('Activating SOS', 'Triggering alert and starting live location sharing...');
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      await triggerSos(locationData);
      setIsSosActive(true);
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        (newLocation) => {
          const newLocationData = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          updateLocation(newLocationData);
        }
      );
    } catch (error) {
      console.error('SOS Trigger Failed:', error);
      Alert.alert('SOS Failed', `An error occurred: ${error.message}`);
    }
  };

  const handleStopSos = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    setIsSosActive(false);
    Alert.alert('SOS Deactivated', 'Live location sharing has been stopped.');
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D1B2A", "#1B263B"]} style={styles.container}>
        {isSosActive ? (
          <SafeAreaView style={[styles.content, styles.sosActiveContainer]}>
            <Ionicons name="warning" size={80} color="#fff" />
            <Text style={styles.sosTitle}>SOS ACTIVE</Text>
            <Text style={styles.sosSubtitle}>Your live location is being shared.</Text>
            <TouchableOpacity style={styles.stopSosButton} onPress={handleStopSos}>
              <Text style={styles.stopSosButtonText}>STOP SOS</Text>
            </TouchableOpacity>
          </SafeAreaView>
        ) : (
          <>
            <ImageBackground
              source={require("../../components/assets/bg1.png")}
              style={styles.headerBackground}
              resizeMode="cover"
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.4)", "rgba(27,38,59,1)"]}
                style={styles.gradientOverlay}
              />
            </ImageBackground>
            
            <SafeAreaView style={styles.content}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.topBar}>
                  <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Ionicons name="menu" size={28} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.topBarTitle}>Ziro</Text>
                  <TouchableOpacity>
                    <Ionicons name="notifications-outline" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.greeting}>Stay Safe, {userProfile?.username || 'Tourist'}</Text>

                <View style={styles.cardContainer}>
                  <Card 
                    icon="calendar" 
                    summary={dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                    details={dateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
                  />
                  <Card 
                    icon="cloud" 
                    summary={`${weather?.temperature || '--'}°C`} 
                    details={`${weather?.description || 'Loading...'}\nHumidity: ${weather?.humidity || '--'}%`} 
                  />
                  <Card 
                    icon="location" 
                    summary={location?.city || 'Fetching...'} 
                    details={`${location?.city || ''}, ${location?.region || ''}`} 
                  />
                </View>

                <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                <View style={styles.emergencyContainer}>
                  <EmergencyContact icon="hospital-box" name="Nearest Hospital" number="Call 108" />
                  <EmergencyContact icon="police-badge" name="Police Helpline" number="100" />
                  <EmergencyContact icon="fire-truck" name="Fire Emergency" number="101" />
                </View>
                
                <Text style={styles.sectionTitle}>Nearby Alerts</Text>
                <FlatList
                  data={staticAlerts}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.alertCard}>
                      <Text style={styles.alertTitle}>{item.title}</Text>
                      <Text style={styles.alertDesc}>{item.description}</Text>
                    </View>
                  )}
                />
                
                <View style={{ height: 120 }} />
              </ScrollView>
              
              <TouchableOpacity style={styles.sosButton} onPress={handleStartSos}>
                <Text style={styles.sosText}>SOS</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </>
        )}
      </LinearGradient>

      <HamburgerMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)}
        onLogout={handleLogout}
      />
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: { position: "absolute", top: 0, left: 0, right: 0, height: 250 },
  gradientOverlay: { flex: 1 },
  topBar: { width: "100%", paddingHorizontal: 20, paddingVertical: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topBarTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  content: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: "700", color: "#fff", marginTop: 20, paddingHorizontal: 20 },
  cardContainer: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 10, marginTop: 20, marginBottom: 20 },
  card: { backgroundColor: "rgba(30, 42, 56, 0.8)", width: "30%", alignItems: "center", justifyContent: "flex-start", padding: 10, borderRadius: 12, minHeight: 100 },
  cardItemExpanded: { flex: 2 },
  cardHeader: { alignItems: "center" },
  details: { marginTop: 10, alignItems: "center" },
  detailText: { fontSize: 12, color: "#ffffffff", textAlign: 'center', marginVertical: 2, lineHeight: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", paddingHorizontal: 20, marginVertical: 15 },
  
  // Emergency Contacts Styles
  emergencyContainer: { marginHorizontal: 20, marginVertical: 10, gap: 8, marginBottom: 20 },
  emergencyCard: { backgroundColor: "#d63031", padding: 16, borderRadius: 8, marginVertical: 4 },
  
  alertCard: { backgroundColor: "#243447", marginHorizontal: 20, marginVertical: 5, padding: 16, borderRadius: 12 },
  alertTitle: { color: "#fff", fontWeight: "700", marginBottom: 4 },
  alertDesc: { color: "#ccc", fontSize: 14 },
  sosButton: { position: "absolute", bottom: 20, alignSelf: "center", width: 80, height: 80, borderRadius: 40, backgroundColor: "#FF3B30", justifyContent: "center", alignItems: "center", elevation: 10 },
  sosText: { color: "#fff", fontSize: 24, fontWeight: "bold" },

  // SOS Active View Styles
  sosActiveContainer: { backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center' },
  sosTitle: { fontSize: 40, fontWeight: 'bold', color: 'white', marginVertical: 20 },
  sosSubtitle: { fontSize: 16, color: 'white', textAlign: 'center', paddingHorizontal: 20, marginBottom: 40 },
  stopSosButton: { backgroundColor: 'white', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  stopSosButtonText: { color: '#c0392b', fontSize: 18, fontWeight: 'bold' },

  // Menu Styles
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start' },
  menuContainer: { backgroundColor: '#1B263B', width: '80%', height: '100%', paddingTop: 20 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: '#2a3f5f' },
  menuTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#243447', gap: 15 },
  menuItemText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  menuItemDanger: { marginTop: 20, backgroundColor: '#d63031', borderBottomColor: '#d63031' },
});