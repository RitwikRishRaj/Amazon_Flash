import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';

interface Props {
  etaMin: number;
}

export default function DeliveryETA({ etaMin }: Props): React.JSX.Element {
  const label =
    etaMin < 60
      ? `${etaMin} min`
      : `${Math.round(etaMin / 60)} hr`;

  return (
    <View style={styles.row}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.text}>
        Arrives in <Text style={styles.bold}>{label}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  icon: { fontSize: 13 },
  text: { fontSize: 13, color: Colors.success },
  bold: { fontWeight: '700' },
});
