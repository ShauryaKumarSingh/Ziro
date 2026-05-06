import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getProfile, submitKyc } from '../../apis/authapi';

export default function KycScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    aadhaar: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    emergency_contact: '',
    trip_itinerary: '',
  });
  const [isLoading, setIsLoading] = useState(true); // Start true to check status

  // --- New: Add a check to see if KYC is already approved ---
  useEffect(() => {
    const checkKycStatus = async () => {
      try {
        const profile = await getProfile();
        if (profile.kycStatus === 'approved') {
          // If already approved, show an alert and redirect
          Alert.alert("KYC Approved", "Your profile is already verified.");
          router.replace('/(app)'); // Go back to the main dashboard
        } else {
          // If not approved, stop loading and show the form
          setIsLoading(false);
        }
      } catch (error) {
        Alert.alert("Error", "Could not verify your KYC status.");
        router.replace('/(app)');
      }
    };
    checkKycStatus();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    for (const key in formData) {
      if (!formData[key]) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await submitKyc(formData);
      Alert.alert('Success', 'Your KYC details have been submitted!');
      router.replace('/(app)');
    } catch (error) {
      Alert.alert('Submission Failed', error.msg || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // If we are still loading/checking, show an activity indicator
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // If KYC is not approved, show the form
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your KYC</Text>
      <Text style={styles.subtitle}>
        This information is required to generate your Digital Tourist ID.
      </Text>
      <TextInput style={styles.input} placeholder="Aadhaar Number" onChangeText={(val) => handleInputChange('aadhaar', val)} />
      <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" onChangeText={(val) => handleInputChange('dob', val)} />
      <TextInput style={styles.input} placeholder="Gender" onChangeText={(val) => handleInputChange('gender', val)} />
      <TextInput style={styles.input} placeholder="Phone Number (+91...)" onChangeText={(val) => handleInputChange('phone', val)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Email" onChangeText={(val) => handleInputChange('email', val)} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Emergency Contact (+91...)" onChangeText={(val) => handleInputChange('emergency_contact', val)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Trip Itinerary (e.g., Delhi -> Agra)" onChangeText={(val) => handleInputChange('trip_itinerary', val)} />
      <Button title="Submit KYC" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#6B7280', marginBottom: 30 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
});