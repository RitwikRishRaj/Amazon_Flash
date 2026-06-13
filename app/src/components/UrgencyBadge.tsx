import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Colors } from '@constants/colors';

interface Props {
  label?: string;
}

export default function UrgencyBadge({ label = 'URGENT' }: Props): React.JSX.Element {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>⚡ {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.danger,
    borderRadius:    6,
    paddingVertical: 2,
    paddingHorizontal: 7,
    alignSelf: 'flex-start',
  },
  text: {
    color:      Colors.textPrimary,
    fontSize:   10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
