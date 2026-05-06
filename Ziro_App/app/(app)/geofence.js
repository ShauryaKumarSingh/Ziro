
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import axios from '../../apis/axios';
// import { useAuth } from '../../context/AuthContext';
import MapView, { Circle, Marker } from 'react-native-maps';

const DANGER_ZONES = [
  { 
    name: 'Restricted Area Near Embassy', 
    lat: 28.5983, 
    lon: 77.1828, 
    radius: 500 
  },
  { 
    name: 'Unsafe Zone After Dark', 
    lat: 28.6328, 
    lon: 77.2196, 
    radius: 1000 
  },
];

const GeofenceScreen = () => {
  const [location, setLocation] = useState(null);
  const [inDangerZone, setInDangerZone] = useState(false);
  const [zoneName, setZoneName] = useState('');
  // const { authToken:user } = useAuth();

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    };

    getLocation();
  }, []);

  useEffect(() => {
    if (location) {
      const checkGeofence = async () => {
        try {
          // const response = await axios.post('/location/check', {
          //   latitude: location.coords.latitude,
          //   longitude: location.coords.longitude,
          // }, {
          //   headers: {
          //     Authorization: `Bearer ${user}`,
          //   },
          // });

          // const { inDangerZone, zoneName } = response.data;
          // setInDangerZone(inDangerZone);
          // if (inDangerZone) {
          //   setZoneName(zoneName);
          //   Alert.alert(
          //     'Danger Zone Alert',
          //     `You have entered a high-risk area: ${zoneName}`
          //   );
          // }
        } catch (error) {
          console.error('Error checking geofence:', error);
          Alert.alert('Error', 'Could not check geofence status.');
        }
      };

      const interval = setInterval(checkGeofence, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [location]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Geofencing Status</Text>
      {inDangerZone ? (
        <Text style={styles.dangerText}>You are in a danger zone: {zoneName}</Text>
      ) : (
        <Text style={styles.safeText}>You are in a safe area.</Text>
      )}
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
          />
          {DANGER_ZONES.map((zone, index) => (
            <Circle
              key={index}
              center={{ latitude: zone.lat, longitude: zone.lon }}
              radius={zone.radius}
              strokeColor="rgba(255, 0, 0, 0.5)"
              fillColor="rgba(255, 0, 0, 0.2)"
            />
          ))}
        </MapView>
      ) : (
        <Text>Getting your location...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dangerText: {
    color: 'red',
    fontSize: 18,
    marginTop: 20,
  },
  safeText: {
    color: 'green',
    fontSize: 18,
    marginTop: 20,
  },
  map: {
    width: '100%',
    height: '60%',
    marginTop: 20,
  },
});

export default GeofenceScreen;
