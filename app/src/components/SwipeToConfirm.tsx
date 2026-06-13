import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@constants/colors';

interface Props {
  onConfirm: () => void;
  label?:    string;
}

const TRACK_HEIGHT  = 60;
const THUMB_SIZE    = 48;
const TRACK_PADDING = 6;

export default function SwipeToConfirm({ onConfirm, label = 'Swipe to Confirm' }: Props): React.JSX.Element {
  const trackWidth = useRef(0);
  const translateX = useSharedValue(0);
  const confirmed  = useSharedValue(false);

  const maxTranslate = () => trackWidth.current - THUMB_SIZE - TRACK_PADDING * 2;

  const triggerHaptic = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (confirmed.value) return;
      translateX.value = Math.max(0, Math.min(e.translationX, maxTranslate()));
    })
    .onEnd(() => {
      if (confirmed.value) return;
      if (translateX.value >= maxTranslate() * 0.85) {
        confirmed.value = true;
        translateX.value = withSpring(maxTranslate());
        runOnJS(triggerHaptic)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE + TRACK_PADDING,
  }));

  const labelOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 60], [1, 0]),
  }));

  return (
    <View
      style={styles.track}
      onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
    >
      {/* Fill */}
      <Animated.View style={[styles.fill, fillStyle]} />

      {/* Label */}
      <Animated.Text style={[styles.label, labelOpacity]}>{label}</Animated.Text>

      {/* Thumb */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Text style={styles.chevron}>›</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track:   { height: TRACK_HEIGHT, backgroundColor: Colors.bgBorder, borderRadius: TRACK_HEIGHT / 2, overflow: 'hidden', justifyContent: 'center' },
  fill:    { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.accentPrimary, borderRadius: TRACK_HEIGHT / 2 },
  label:   { textAlign: 'center', color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  thumb:   { position: 'absolute', left: TRACK_PADDING, width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, backgroundColor: Colors.accentPrimary, alignItems: 'center', justifyContent: 'center', top: (TRACK_HEIGHT - THUMB_SIZE) / 2 },
  chevron: { fontSize: 28, color: Colors.bgBase, fontWeight: '700' },
});
