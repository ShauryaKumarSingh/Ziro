import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, Button } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { getProfile, getTouristIdCard } from "../../apis/authapi";
import { useFocusEffect, useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [idCardData, setIdCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // This hook re-fetches data every time you navigate to this screen,
  // ensuring the KYC status is always up-to-date.
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // Only show the full-screen loader on the very first load
          if (!userProfile) setIsLoading(true);
          
          const profile = await getProfile();
          setUserProfile(profile);

          if (profile.kycStatus === 'approved' && profile.touristId) {
            const cardData = await getTouristIdCard(profile.touristId);
            setIdCardData(cardData);
          } else {
            setIdCardData(null); // Clear any old card data if status is not approved
          }
        } catch (e) {
          Alert.alert("Error", "Could not load profile data.");
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }, [])
  );

  // Replace your existing useFocusEffect with this one
// useFocusEffect(
//   useCallback(() => {
//     const loadData = async () => {
//       try {
//         if (!userProfile) setIsLoading(true);
//         const profile = await getProfile();
//         setUserProfile(profile);

//         if (profile.kycStatus === 'approved' && profile.touristId) {
//           // DEBUG LOG 1: Check the ID we are sending
//           console.log(`Attempting to fetch ID card with touristId: ${profile.touristId}`);

//           const cardData = await getTouristIdCard(profile.touristId);

//           // DEBUG LOG 2: Check the data we received
//           console.log('Successfully fetched ID card data:', cardData);
//           setIdCardData(cardData);
//         } else {
//           setIdCardData(null);
//         }
//       } catch (e) {
//         // DEBUG LOG 3: This will show us the exact error
//         console.error('--- ERROR LOADING PROFILE OR ID CARD ---', e);
//         Alert.alert("Error", "Could not load profile data.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadData();
//   }, [])
// );
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{userProfile?.username || 'Tourist'}</Text>
          <Text style={styles.email}>{userProfile?.email || 'No email'}</Text>
        </View>

        {/* This is the logic that decides what to show */}
        {userProfile?.kycStatus === 'approved' ? (
          // If status is 'approved', show the ID card section.
          <View style={styles.idCardSection}>
            <Text style={styles.sectionTitle}>Digital Tourist ID</Text>
            {idCardData ? (
              // If the ID card data has loaded, show the QR code.
              <View style={styles.idCard}>
                <Image source={{ uri: idCardData.qrCode }} style={styles.qrCode} />
                <Text style={styles.idCardText}>ID: {idCardData.touristId}</Text>
              </View>
            ) : (
              // If the ID card is still loading, show a spinner.
              <ActivityIndicator color="#fff" style={{marginTop: 20}}/>
            )}
          </View>
        ) : (
          // If status is NOT 'approved', show the button to complete KYC.
          <View style={styles.stats}>
             <Text style={styles.statText}>KYC Status: {userProfile?.kycStatus}</Text>
             <Text style={styles.statText}>Submit your KYC to generate a Digital ID.</Text>
             <Button title="Complete KYC Now" onPress={() => router.push('/(app)/kyc')} />
          </View>
        )}
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1B2A" },
  header: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  email: { fontSize: 14, color: "#aaa", marginBottom: 15 },
  stats: { backgroundColor: "#1B263B", padding: 20, borderRadius: 10, marginHorizontal: 15, marginBottom: 20, alignItems: 'center' },
  statText: { color: "#fff", fontSize: 16, marginBottom: 10, textAlign: 'center' },
  logoutButton: { backgroundColor: "#FF3B30", padding: 15, borderRadius: 10, alignItems: "center", margin: 15, marginTop: 30 },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold"},
  idCardSection: { marginHorizontal: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
  idCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center' },
  qrCode: { width: 180, height: 180, marginBottom: 15 },
  idCardText: { fontSize: 16, color: '#333', fontWeight: '500' },
});