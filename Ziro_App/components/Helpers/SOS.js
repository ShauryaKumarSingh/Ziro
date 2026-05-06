import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import * as Location from "expo-location";
import * as Linking from "expo-linking";

export default function SOSButton() {
    const handleSOS = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required for SOS");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const message = `🚨 SOS ALERT!\nI need help. Here’s my location: ${mapsLink}`;
      const whatsappURL = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const smsURL = `sms:?body=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(whatsappURL);
      if (supported) {
        await Linking.openURL(whatsappURL);
        } 
      else {
        await Linking.openURL(smsURL);
      }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Something went wrong while sending SOS");
      }
};
    return(
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
           <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
    );

    
}
const styles = StyleSheet.create({
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
})