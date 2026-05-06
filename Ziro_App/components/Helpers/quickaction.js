import { View, TouchableOpacity, Text, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function QuickActions() {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openURL("tel:112")} // Police helpline in India
      >
        <Ionicons name="shield-checkmark" size={28} color="#fff" />
        <Text style={styles.label}>Police</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openURL("tel:108")} // Ambulance/Hospital
      >
        <Ionicons name="medkit" size={28} color="#fff" />
        <Text style={styles.label}>Hospital</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openURL("tel:1363")} // Emergency helpline
      >
        <Ionicons name="call" size={28} color="#fff" />
        <Text style={styles.label}>Helpline</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: -90,
    marginBottom: 10,  
  },
  button: {
    backgroundColor: "#1E90FF",
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  label: {
    marginTop: 5,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});