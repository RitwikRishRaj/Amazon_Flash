import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Colors } from '@constants/colors';
import { formatPrice } from '@constants/format';
import type { RootStackParamList } from '@app-types/index';
import DeliveryETA from '@components/DeliveryETA';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Confirmed'>;
type Route = RouteProp<RootStackParamList, 'Confirmed'>;

export default function ConfirmedScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { order } = route.params;

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [opacity, scale]);

  const goHome = () => navigation.popToTop();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Check animation */}
        <Animated.View style={[styles.checkWrap, { opacity, transform: [{ scale }] }]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </Animated.View>

        <Text style={styles.heading}>Order Confirmed!</Text>
        <Text style={styles.orderId}>Order #{order.id}</Text>

        <View style={styles.etaWrap}>
          <DeliveryETA etaMin={order.etaMin} />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          {order.items.map(({ product, quantity }) => (
            <View key={product.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{product.name}</Text>
              <Text style={styles.itemQty}>×{quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalPrice, order.currency)}</Text>
          </View>
        </View>

        <Pressable style={styles.homeBtn} onPress={goHome}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgBase },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  checkWrap: { marginBottom: 24 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 52, color: Colors.textPrimary },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  orderId: { fontSize: 14, color: Colors.textMuted, marginBottom: 16 },
  etaWrap: { marginBottom: 24 },
  summaryCard: { width: '100%', backgroundColor: Colors.bgSurface, borderRadius: 14, padding: 16, marginBottom: 32 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { color: Colors.textPrimary, fontSize: 14, flex: 1, marginRight: 8 },
  itemQty: { color: Colors.textMuted, fontSize: 14 },
  divider: { height: 1, backgroundColor: Colors.bgBorder, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: Colors.textMuted, fontSize: 15 },
  totalValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  homeBtn: { backgroundColor: Colors.bgSurface, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12 },
  homeBtnText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 16 },
});
