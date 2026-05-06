import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth to get the global state manager

// Make sure your import paths are correct
import Slide1 from '../components/slides/Slide1'; 
import Slide2 from '../components/slides/Slide2';
import Slide3 from '../components/slides/Slide3';
import Slide4 from '../components/slides/Slide4';

const slides = [
  { id: '1', Component: Slide1 },
  { id: '2', Component: Slide2 },
  { id: '3', Component: Slide3 },
  { id: '4', Component: Slide4 },
];

export default function OnboardingScreen() {
  // 2. Get the completeOnboarding function from the context
  const { completeOnboarding } = useAuth();

  return (
    <View style={styles.container}>
      <FlatList
        data={slides}
        // 3. Pass that function directly to your slides
        renderItem={({ item }) => <item.Component onDone={completeOnboarding} />}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#000' } });