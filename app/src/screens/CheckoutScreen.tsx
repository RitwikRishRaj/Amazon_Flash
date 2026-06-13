import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Colors }        from '@constants/colors';
import type { RootStackParamList } from '@app-types/index';
import { placeOrder }    from '@services/api';
import { useSessionStore } from '@store/sessionStore';
import { useCartStore }  from '@store/cartStore';
import SwipeToConfirm    from '@components/SwipeToConfirm';
import DeliveryETA       from '@components/DeliveryETA';
import ProductResultCard from '@components/ProductResultCard';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;
type Route = RouteProp<RootStackParamList, 'Checkout'>;

export default function CheckoutScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { items }  = route.params;
  const { user }   = useSessionStore();
  const { clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity, 0,
  );

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const order = await placeOrder(items);
      clearCart();
      navigation.replace('Confirmed', { order });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Order failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Text style={styles.title}>Review Order</Text>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Items</Text>
          {items.map(({ product, quantity }) => (
            <View key={product.id} style={styles.itemRow}>
              <ProductResultCard product={product} compact />
              <Text style={styles.qty}>×{quantity}</Text>
            </View>
          ))}
        </View>

        {/* Delivery ETA */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Delivery</Text>
          <DeliveryETA etaMin={items[0]?.product.estimatedDeliveryMin ?? 10} />
        </View>

        {/* Address */}
        {user?.defaultAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Deliver To</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>{user.defaultAddress.line1}</Text>
              {user.defaultAddress.line2 && (
                <Text style={styles.cardText}>{user.defaultAddress.line2}</Text>
              )}
              <Text style={styles.cardText}>
                {user.defaultAddress.city}, {user.defaultAddress.state}{' '}
                {user.defaultAddress.zip}
              </Text>
            </View>
          </View>
        )}

        {/* Payment */}
        {user?.defaultPaymentLast4 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>
                •••• •••• •••• {user.defaultPaymentLast4}
              </Text>
            </View>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ${totalPrice.toFixed(2)}
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm */}
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator color={Colors.accentPrimary} size="large" />
        ) : (
          <SwipeToConfirm onConfirm={handleConfirm} label="Swipe to Order" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bgBase },
  scroll:       { padding: 20, paddingBottom: 16 },
  title:        { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 24 },
  section:      { marginBottom: 20 },
  sectionLabel: { fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  itemRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  qty:          { color: Colors.textMuted, fontSize: 14 },
  card:         { backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 10 },
  cardText:     { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.bgBorder },
  totalLabel:   { fontSize: 16, color: Colors.textMuted },
  totalValue:   { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  errorBanner:  { backgroundColor: Colors.danger, padding: 12, borderRadius: 8, marginTop: 8 },
  errorText:    { color: Colors.textPrimary, fontSize: 13 },
  footer:       { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.bgBorder },
});
