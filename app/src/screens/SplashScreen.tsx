import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@constants/colors';
import type { RootStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  
  // Animation values
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseScaleX = useRef(new Animated.Value(0.1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;
  const statusOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // 1. Initial fade-in and scale-up for content
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 100,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Pulse line animation loop (scaleX and opacity pulse)
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScaleX, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScaleX, {
            toValue: 0.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 3. Status text opacity pulsing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(statusOpacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Timer to navigate to Home
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, scale, opacity, pulseScaleX, pulseOpacity, statusOpacity]);

  return (
    <View style={styles.container}>
      {/* Subtle background glow for depth */}
      <View style={styles.glow} />

      {/* Splash Content Container */}
      <Animated.View style={[styles.contentWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.textWrap}>
          <Text style={styles.brandTitle}>FlashCart</Text>
          <Text style={styles.brandSubtitle}>by Amazon Now</Text>
        </View>
        
        {/* Pulsing Indicator */}
        <Animated.View 
          style={[
            styles.pulseLine, 
            { 
              opacity: pulseOpacity,
              transform: [{ scaleX: pulseScaleX }] 
            }
          ]} 
        />
      </Animated.View>

      {/* Bottom Status Text */}
      <Animated.View style={[styles.bottomTextWrap, { opacity: statusOpacity }]}>
        <Text style={styles.statusText}>Preparing your cart...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: Colors.accentPrimary,
    opacity: 0.04,
    // Soft glow effect using standard shadow styling
    shadowColor: Colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  textWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  pulseLine: {
    height: 4,
    width: 60,
    backgroundColor: Colors.accentPrimary,
    borderRadius: 9999,
    marginTop: 20,
  },
  bottomTextWrap: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
