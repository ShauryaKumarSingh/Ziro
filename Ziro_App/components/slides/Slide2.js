import React from 'react';

import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export default function slide2() {
  return (
    <View style={{ width, height }}>
      <ImageBackground
        source={require('../assets/slide2.png')}
        style={styles.image}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
          style={styles.bottomBox}
        >
          <Text style={styles.title}>GEO-FENCING</Text>
          <Text style={styles.description}>
            Automatic SOS if tourist goes outside a safe area.
          </Text>
          <Text style={styles.swipeText}> Swipe» </Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { flex: 1, justifyContent: 'flex-end' },
  bottomBox: {
    height: height * 0.35,
    padding: 20,
    justifyContent: 'flex-end',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  description: { fontSize: 16, color: '#fff', marginBottom: 60, textAlign: 'center' },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  swipeText: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    fontSize: 16,
    color: '#61f726ff',
    fontStyle: 'italic',
  },
  
});