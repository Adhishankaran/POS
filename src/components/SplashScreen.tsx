import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreenComponent: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Parallel entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade in text
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Wait 1 second then transition into main application
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(onFinish);
        }, 1000);
      });
    });
  }, [fadeAnim, scaleAnim, textFadeAnim, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.contentBox,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center' }}>
          <Text variant="headlineMedium" style={styles.title}>
            Adhi Stores POS
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Smart Billing & Inventory System
          </Text>
          <ActivityIndicator animating size="small" color="#FFFFFF" style={{ marginTop: 20 }} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A237E', // Deep Indigo theme
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBox: {
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 24,
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 26,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#C5CAE9',
    marginTop: 4,
    fontSize: 14,
  },
});
