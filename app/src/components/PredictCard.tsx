import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { formatPrice } from '@constants/format';
import type { Product } from '@app-types/index';
import DeliveryETA from './DeliveryETA';

interface Props {
  product: Product;
  onPress: () => void;
}

export default function PredictCard({ product, onPress }: Props): React.JSX.Element {
  const confidencePct = Math.round((product.confidence ?? 0) * 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={{ uri: product.imageUrl }} style={styles.image} />
      <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
      <DeliveryETA etaMin={product.estimatedDeliveryMin} />

      {/* Confidence bar */}
      <View style={styles.confTrack}>
        <View style={[styles.confFill, { width: `${confidencePct}%` }]} />
      </View>
      <Text style={styles.confLabel}>{confidencePct}% predicted</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 148, backgroundColor: Colors.bgSurface, borderRadius: 14, padding: 12, marginRight: 12, gap: 6 },
  pressed: { opacity: 0.8 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: Colors.bgElevated },
  name: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  price: { fontSize: 14, fontWeight: '700', color: Colors.accentPrimary },
  confTrack: { height: 3, backgroundColor: Colors.bgBorder, borderRadius: 2, overflow: 'hidden' },
  confFill: { height: '100%', backgroundColor: Colors.accentDim, borderRadius: 2 },
  confLabel: { fontSize: 10, color: Colors.textMicro },
});
