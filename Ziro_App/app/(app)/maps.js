import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Share, Alert, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview"; // Use WebView instead of MapView
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { triggerSos, updateLocation, stopSos } from "../../apis/authapi";

// Function to format location data
const formatLocation = (coords) => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  accuracy: coords.accuracy,
  timestamp: new Date().toISOString(),
});

export default function MapsScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSosActive, setIsSosActive] = useState(false);
  const [activeSosId, setActiveSosId] = useState(null);
  const locationInterval = useRef(null);
  const webViewRef = useRef(null);

  // Generate Leaflet HTML
  const mapHtml = location ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
       <style>
  body, html { margin: 0; padding: 0; height: 100%; width: 100%; }
  #map { height: 100%; width: 100%; position: absolute; top: 0; left: 0; }
</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${location.latitude}, ${location.longitude}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          var marker = L.marker([${location.latitude}, ${location.longitude}]).addTo(map)
            .bindPopup('You are here')
            .openPopup();

          // Function to update marker from React Native
          window.addEventListener('message', (event) => {
            const coords = JSON.parse(event.data);
            marker.setLatLng([coords.lat, coords.lng]);
            map.panTo([coords.lat, coords.lng]);
          });
        </script>
      </body>
    </html>
  ` : '';

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied");
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLoading(false);
    })();

    // Cleanup on unmount
    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, []);

  // Update WebView marker when location changes
  useEffect(() => {
    if (location && webViewRef.current) {
      const data = JSON.stringify({ lat: location.latitude, lng: location.longitude });
      webViewRef.current.postMessage(data);
    }
  }, [location]);

  // Handle Start SOS
  const handleStartSos = async () => {
    try {
      setLoading(true);
      const locationData = formatLocation(location);
      const response = await triggerSos(locationData);
      setActiveSosId(response.sosId || response._id);
      setIsSosActive(true);

      // Start location tracking every 10 seconds
      locationInterval.current = setInterval(async () => {
        let updatedLoc = await Location.getCurrentPositionAsync({});
        setLocation(updatedLoc.coords);
        await updateLocation(formatLocation(updatedLoc.coords));
      }, 10000);

      Alert.alert("SOS Activated", "Emergency services have been notified with your location.");
    } catch (error) {
      Alert.alert("Error", "Failed to activate SOS. Please try again.");
      console.error("SOS Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Stop SOS
  const handleStopSos = async () => {
    try {
      setLoading(true);
      if (activeSosId) {
        await stopSos(activeSosId);
      }
      setIsSosActive(false);
      setActiveSosId(null);

      // Clear location tracking interval
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }

      Alert.alert("SOS Stopped", "Emergency alert has been cancelled.");
    } catch (error) {
      Alert.alert("Error", "Failed to stop SOS. Please try again.");
      console.error("Stop SOS Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Share Location
  const handleShare = async () => {
    try {
      if (!location) {
        Alert.alert("Error", "Location not available");
        return;
      }
      const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      const message = `Check my location: ${mapsLink}`;

      await Share.share({
        message: message,
        url: mapsLink,
        title: "My Location",
      });
    } catch (error) {
      console.error("Share Error:", error);
      Alert.alert("Error", "Failed to share location");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isSosActive ? (
        <LinearGradient colors={["#c0392b", "#a93226"]} style={styles.sosActiveContainer}>
          <Text style={styles.sosTitle}>🚨 SOS</Text>
          <Text style={styles.sosSubtitle}>
            Emergency services have been notified{"\n"}Your location is being shared
          </Text>
          <ActivityIndicator size="large" color="#fff" />
          <TouchableOpacity
            style={styles.stopSosButton}
            onPress={handleStopSos}
            disabled={loading}
          >
            <Text style={styles.stopSosButtonText}>
              {loading ? "Stopping..." : "Stop SOS"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.map}
          />
          
          <TouchableOpacity style={styles.sosButton} onPress={handleStartSos}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fab} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text style={styles.fabText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}


// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  map: { flex: 1 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#0D1B2A'
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 20
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12
  },
  errorText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "#1D3557",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  sosButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E63946",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#E63946",
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  sosText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  sosActiveContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosTitle: { fontSize: 40, fontWeight: 'bold', color: 'white', marginVertical: 20 },
  sosSubtitle: { fontSize: 16, color: 'white', textAlign: 'center', paddingHorizontal: 20, marginBottom: 40 },
  stopSosButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  stopSosButtonText: {
    color: '#c0392b',
    fontSize: 18,
    fontWeight: 'bold',
  },
});