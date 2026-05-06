import React, {useState, useEffect} from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ImageBackground, LayoutAnimation, Animated, Platform, UIManager } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import * as Location from 'expo-location';
import BottomNav from "./Helpers/BottomNav";
import SOSButton from "./Helpers/SOS";
import QuickActions from "./Helpers/quickaction";

if(Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental){
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const Card = ({ icon, title, summary, details }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
   LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      style={[styles.card,  expanded && styles.cardItemExpanded]}
      activeOpacity={0.9}
      onPress={toggleExpand}
    >
      <View style={styles.cardHeader}>
      <Ionicons name={icon} size={20} color="#fff" />
      <View style={{ flex: 1 }}>
      <Text style={{fontSize: 14, fontWeight: "bold", color: "#fff", marginTop: "10"}}>{summary}</Text>
      {expanded && (
        <View style={styles.details}>
            <Text style={styles.detailText}>
              {details}
            </Text>
        </View>
      )}
      </View>
      </View>
    </TouchableOpacity>
  );
};

const EmergencyContact = ({ icon, name, number }) => (
  <TouchableOpacity style={styles.emergencyCard}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      <View>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{name}</Text>
        <Text style={{ color: '#aaa', fontSize: 12 }}>{number}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const alerts = [
  { id: "1", title: "🚧 Landslide Alert", description: "Road blocked for 2 hrs" },
  { id: "2", title: "🌊 Flood Warning", description: "Reported at 1:30 PM" },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('Fetching location...');
  const [userName, setUserName] = useState('Tourist');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setDateTime(`${dateStr}, ${timeStr}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const address = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (address && address.length > 0) {
            const addr = address[0];
            setLocation(`${addr.city || addr.district || ''}, ${addr.region || ''}`);
          }
        }
      } catch (error) {
        setLocation('Location unavailable');
      }
    };

    getLocation();
  }, []);

  return (
  
    <View style={styles.container}>
      <LinearGradient colors={["#0D1B2A", "#1B263B"]} style={styles.container}>
    
      <ImageBackground
        source={require("../assets/bg1.png")}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <LinearGradient
      colors={["rgba(0,0,0,0.4)", "rgba(27,38,59,1)"]}
      style={styles.gradientOverlay}
      />  
      </ImageBackground>
     
     <SafeAreaView style={styles.content}>
      <View style={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Ziro</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.greeting}>Stay Safe, {userName}</Text>

      <View style={styles.cardContainer}>
        <Card
          icon="calendar"
          title="Date" 
          summary={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
          details={dateTime} 
        />
        <Card 
          icon="cloud" 
          title="Weather" 
          summary="Check weather" 
          details="Check local weather services for accurate conditions" 
        />
        <Card 
          icon="location" 
          title="Location" 
          summary={location.split(',')[0]} 
          details={location} 
        />
      </View>

      <Text style={styles.sectionHead}>Emergency Contacts</Text>
      <View style={styles.emergencyContainer}>
        <EmergencyContact icon="hospital-box" name="Nearest Hospital" number="Call 108" />
        <EmergencyContact icon="police-badge" name="Police Helpline" number="100" />
        <EmergencyContact icon="fire-truck" name="Fire Emergency" number="101" />
      </View>

      <Text style={styles.sectionHead}>Quick Actions</Text>
      <QuickActions />

      <Text style={styles.sectionTitle}>Nearby Alerts</Text>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <Text style={styles.alertDesc}>{item.description}</Text>
          </View>
        )}
      />

      <SOSButton />

      <BottomNav navigation={navigation} />
    </View>
    </SafeAreaView>
    </LinearGradient>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  gradientOverlay: {
    flex: 1,
  },
  topBar: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 15, // adds gap inside top bar
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  topBarTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
    marginLeft: 30,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    paddingVertical: 20,
    marginTop: 20,
    marginBottom: -60,
    flex: 1, 
    zIndex: 10,
  },
  card: {
    backgroundColor: "#1E2A38",
    width: "25%" ,
    flexDirection: "column",   // 👈 vertical instead of row
    alignItems: "center",      // center horizontally
    justifyContent: "center",
    padding: 16,
    paddingVertical: 20,
    marginBottom: 70,
    borderRadius: 12,
    marginHorizontal: 15, // adds spacing between cards
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardItemExpanded: {
    flex: 2, // Takes more space when expanded
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexDirection: "column",   // 👈 vertical instead of row
    alignItems: "center",      // center horizontally
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSummary: {
    fontSize: 10,
    color: "#ccc",
    marginTop: 2,
  },
  cardDetails: {
    fontSize: 13,
    color: "#eee",
    marginTop: 5,
  },
  details: {
    marginTop: 10,
    alignItems: "center",
    color: "#1E2A38"
  },
  detailText: {
    fontSize: 12,
    color: "#ffffffff",
    marginVertical: 2,
  },
  sectionHead: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    paddingBottom: 100,
    marginLeft: 30,

  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 30,
    marginVertical: 10,
  },
  alertCard: {
    backgroundColor: "#243447",
    marginHorizontal: 20,
    marginVertical: 5,
    padding: 16,
    borderRadius: 12,
  },
  alertTitle: { color: "#fff", fontWeight: "700", marginBottom: 4 },
  alertDesc: { color: "#ccc", fontSize: 14 },

  sosButton: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  sosText: { color: "#fff", fontSize: 24, fontWeight: "bold" },

  emergencyContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    gap: 8,
  },
  emergencyCard: {
    backgroundColor: "#d63031",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1B2330",
    width: "100%",
    paddingVertical: 12,
  },
});
