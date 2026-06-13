import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@constants/colors';

interface Props {
  icon:    string;
  label:   string;
  onPress: () => void;
}

export default function EntryPointButton({ icon, label, onPress }: Props): React.JSX.Element {
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button:  { alignItems: 'center', gap: 8, flex: 1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  iconWrap: {
    width:           72,
    height:          72,
    borderRadius:    20,
    backgroundColor: Colors.bgSurface,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.bgBorder,
  },
  icon:    { fontSize: 30 },
  label:   { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
});
