import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@constants/colors';

interface Props {
  isScanning: boolean;
}

export default function ScanReticle({ isScanning }: Props): React.JSX.Element {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isScanning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      anim.setValue(0);
    }
  }, [anim, isScanning]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  const Corner = ({ style }: { style: object }) => (
    <Animated.View style={[styles.corner, style, { opacity }]} />
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.overlay}>
        {/* Top-left */}
        <Corner style={styles.topLeft} />
        {/* Top-right */}
        <Corner style={styles.topRight} />
        {/* Bottom-left */}
        <Corner style={styles.bottomLeft} />
        {/* Bottom-right */}
        <Corner style={styles.bottomRight} />
      </View>
    </View>
  );
}

const BRACKET = 28;
const THICKNESS = 3;
const OFFSET = '25%';

const styles = StyleSheet.create({
  overlay:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corner:      { position: 'absolute', width: BRACKET, height: BRACKET, borderColor: Colors.accentPrimary },
  topLeft:     { top: OFFSET, left: OFFSET, borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS },
  topRight:    { top: OFFSET, right: OFFSET, borderTopWidth: THICKNESS, borderRightWidth: THICKNESS },
  bottomLeft:  { bottom: OFFSET, left: OFFSET, borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS },
  bottomRight: { bottom: OFFSET, right: OFFSET, borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS },
});
