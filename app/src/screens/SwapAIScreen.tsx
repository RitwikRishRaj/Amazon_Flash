import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Colors }       from '@constants/colors';
import type { RootStackParamList } from '@app-types/index';
import { useCartStore } from '@store/cartStore';
import DeliveryETA      from '@components/DeliveryETA';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'SwapAI'>;
type Route = RouteProp<RootStackParamList, 'SwapAI'>;

export default function SwapAIScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { original, substitute, similarityScore } = route.params;
  const { addItem } = useCartStore();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    addItem(substitute);
    navigation.navigate('Checkout', { items: [{ product: substitute, quantity: 1 }] });
  };

  const handleRetry = () => navigation.goBack();

  const scorePercent = Math.round(similarityScore * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.badge}>AI SUBSTITUTION</Text>
        <Text style={styles.title}>Your item is out of stock</Text>
        <Text style={styles.sub}>
          We found a highly similar alternative ({scorePercent}% match)
        </Text>

        {/* Side-by-side */}
        <View style={styles.compareRow}>
          {/* Original */}
          <View style={[styles.card, styles.originalCard]}>
            <Text style={styles.cardLabel}>Original</Text>
            <Image source={{ uri: original.imageUrl }} style={styles.productImage} />
            <Text style={styles.productName} numberOfLines={2}>{original.name}</Text>
            <Text style={styles.price}>${original.price.toFixed(2)}</Text>
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          </View>

          <View style={styles.arrowWrap}>
            <Text style={styles.arrow}>→</Text>
          </View>

          {/* Substitute */}
          <View style={[styles.card, styles.substituteCard]}>
            <Text style={styles.cardLabel}>Substitute</Text>
            <Image source={{ uri: substitute.imageUrl }} style={styles.productImage} />
            <Text style={styles.productName} numberOfLines={2}>{substitute.name}</Text>
            <Text style={styles.price}>${substitute.price.toFixed(2)}</Text>
            <DeliveryETA etaMin={substitute.estimatedDeliveryMin} />
          </View>
        </View>

        {/* Similarity bar */}
        <View style={styles.scoreWrap}>
          <Text style={styles.scoreLabel}>Similarity Score</Text>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${scorePercent}%` }]} />
          </View>
          <Text style={styles.scoreValue}>{scorePercent}%</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {accepting ? (
            <ActivityIndicator color={Colors.accentPrimary} />
          ) : (
            <>
              <Pressable style={styles.acceptBtn} onPress={handleAccept}>
                <Text style={styles.acceptText}>Accept Substitute</Text>
              </Pressable>
              <Pressable style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bgBase },
  container:      { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  badge:          { color: Colors.accentPrimary, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  title:          { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sub:            { color: Colors.textMuted, fontSize: 14, marginBottom: 28 },
  compareRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  card:           { flex: 1, backgroundColor: Colors.bgSurface, borderRadius: 12, padding: 12, gap: 6 },
  originalCard:   { borderWidth: 1, borderColor: Colors.danger + '44' },
  substituteCard: { borderWidth: 1, borderColor: Colors.success + '44' },
  cardLabel:      { fontSize: 10, fontWeight: '700', color: Colors.textMicro, textTransform: 'uppercase', letterSpacing: 1 },
  productImage:   { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: Colors.bgElevated },
  productName:    { fontSize: 12, color: Colors.textPrimary, fontWeight: '500' },
  price:          { fontSize: 14, fontWeight: '700', color: Colors.accentPrimary },
  outOfStockBadge: { backgroundColor: Colors.danger + '22', borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },
  outOfStockText: { color: Colors.danger, fontSize: 10, fontWeight: '600' },
  arrowWrap:      { paddingHorizontal: 2 },
  arrow:          { fontSize: 20, color: Colors.textMuted },
  scoreWrap:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  scoreLabel:     { color: Colors.textMuted, fontSize: 13, width: 110 },
  scoreTrack:     { flex: 1, height: 6, backgroundColor: Colors.bgBorder, borderRadius: 3, overflow: 'hidden' },
  scoreFill:      { height: '100%', backgroundColor: Colors.success, borderRadius: 3 },
  scoreValue:     { color: Colors.success, fontWeight: '700', width: 36, textAlign: 'right' },
  actions:        { gap: 12 },
  acceptBtn:      { backgroundColor: Colors.accentPrimary, padding: 16, borderRadius: 12, alignItems: 'center' },
  acceptText:     { color: Colors.bgBase, fontWeight: '700', fontSize: 16 },
  retryBtn:       { backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 12, alignItems: 'center' },
  retryText:      { color: Colors.textMuted, fontWeight: '600', fontSize: 16 },
});
