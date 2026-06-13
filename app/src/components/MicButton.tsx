import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@constants/colors';

interface Props {
  isRecording: boolean;
  onPress:     () => void;
}

export default function MicButton({ isRecording, onPress }: Props): React.JSX.Element {
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.5)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1Scale,   { toValue: 1.5, duration: 800, useNativeDriver: true }),
            Animated.timing(ring1Scale,   { toValue: 1.0, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring1Opacity, { toValue: 0,   duration: 800, useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring2Scale,   { toValue: 1.9, duration: 1100, useNativeDriver: true }),
            Animated.timing(ring2Scale,   { toValue: 1.0, duration: 1100, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring2Opacity, { toValue: 0,   duration: 1100, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0.3, duration: 1100, useNativeDriver: true }),
          ]),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      ring1Scale.setValue(1);
      ring1Opacity.setValue(0);
      ring2Scale.setValue(1);
      ring2Opacity.setValue(0);
    }
  }, [isRecording, ring1Opacity, ring1Scale, ring2Opacity, ring2Scale]);

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={styles.wrap}>
      {/* Ring 2 (outer) */}
      <Animated.View
        style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]}
      />
      {/* Ring 1 (inner) */}
      <Animated.View
        style={[styles.ring, styles.ring1, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]}
      />
      {/* Button */}
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.button, isRecording && styles.buttonActive, pressed && styles.pressed]}
      >
        <Text style={styles.icon}>🎙️</Text>
      </Pressable>
      <Text style={styles.label}>{isRecording ? 'Tap to stop' : 'Tap to speak'}</Text>
    </View>
  );
}

const SIZE = 88;

const styles = StyleSheet.create({
  wrap:        { alignItems: 'center', justifyContent: 'center' },
  ring:        { position: 'absolute', borderRadius: SIZE, backgroundColor: Colors.accentPrimary },
  ring1:       { width: SIZE + 24, height: SIZE + 24 },
  ring2:       { width: SIZE + 48, height: SIZE + 48 },
  button:      { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: Colors.accentPrimary, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  buttonActive: { backgroundColor: Colors.accentDim },
  pressed:     { transform: [{ scale: 0.95 }] },
  icon:        { fontSize: 36 },
  label:       { marginTop: SIZE / 2 + 16, color: Colors.textMuted, fontSize: 13 },
});
