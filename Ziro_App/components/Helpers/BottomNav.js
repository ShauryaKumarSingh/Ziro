import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function BottomNav({ navigation }) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <Ionicons name="home" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Map")}>
        <Ionicons name="map" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Alerts")}>
        <MaterialCommunityIcons name="alert-circle" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
        <Ionicons name="person" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1B263B",
    paddingVertical: 12,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
});
