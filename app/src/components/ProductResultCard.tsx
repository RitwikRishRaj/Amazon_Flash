import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@constants/colors';
import type { Product } from '@app-types/index';
import UrgencyBadge from './UrgencyBadge';
import DeliveryETA  from './DeliveryETA';

interface Props {
  product:  Product;
  compact?: boolean;
  onPress?: () => void;
}

export default function ProductResultCard({ product, compact = false, onPress }: Props): React.JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Image source={{ uri: product.imageUrl }} style={compact ? styles.imageCompact : styles.image} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={compact ? 1 : 2}>
            {product.name}
          </Text>
          {!product.inStock && <UrgencyBadge label="OOS" />}
        </View>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        {!compact && <DeliveryETA etaMin={product.estimatedDeliveryMin} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card:         { flexDirection: 'row', backgroundColor: Colors.bgSurface, borderRadius: 14, padding: 12, gap: 12 },
  pressed:      { opacity: 0.8 },
  image:        { width: 80, height: 80, borderRadius: 10, backgroundColor: Colors.bgElevated },
  imageCompact: { width: 52, height: 52, borderRadius: 8, backgroundColor: Colors.bgElevated },
  content:      { flex: 1, justifyContent: 'center', gap: 3 },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name:         { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 4 },
  nameCompact:  { fontSize: 13 },
  brand:        { fontSize: 12, color: Colors.textMuted },
  price:        { fontSize: 16, fontWeight: '700', color: Colors.accentPrimary },
});
