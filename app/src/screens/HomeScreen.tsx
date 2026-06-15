import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Pressable, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { fetchSubstitution } from '@services/api';
import { Colors } from '@constants/colors';
import { formatPrice } from '@constants/format';
import type { RootStackParamList, Product } from '@app-types/index';
import { useContextMode } from '@hooks/useContextMode';
import { usePredictCart } from '@hooks/usePredictCart';
import { useCartStore } from '@store/cartStore';
import { useSessionStore } from '@store/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const RECENT_AMAZON_PRODUCTS: Record<string, Product> = {
  juice: {
    id: "prod-001",
    asin: "B0014D8D5A",
    name: "Tropicana Orange Juice, 52 fl oz",
    brand: "Tropicana",
    imageUrl: "https://images-na.ssl-images-amazon.com/images/I/71uF6b+KqyL._SL1500_.jpg",
    price: 199,
    currency: "INR",
    inStock: true,
    estimatedDeliveryMin: 12,
    category: "beverages"
  },
  redbull: {
    id: "prod-006",
    asin: "B004F34EY6",
    name: "Red Bull Energy Drink, 12-pack (8.4 fl oz)",
    brand: "Red Bull",
    imageUrl: "https://images-na.ssl-images-amazon.com/images/I/81e592hR2qL._SL1500_.jpg",
    price: 1499,
    currency: "INR",
    inStock: true,
    estimatedDeliveryMin: 10,
    category: "beverages"
  },
  advil: {
    id: "prod-004",
    asin: "B000052WY6",
    name: "Advil Ibuprofen 200mg, 100 Tablets",
    brand: "Advil",
    imageUrl: "https://images-na.ssl-images-amazon.com/images/I/81+21zK5s9L._SL1500_.jpg",
    price: 250,
    currency: "INR",
    inStock: false,
    estimatedDeliveryMin: 15,
    category: "health"
  }
};

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const { mode } = useContextMode();
  const { state } = usePredictCart();
  const { items, addItem } = useCartStore();
  const { user } = useSessionStore();

  const [loadingSubstitution, setLoadingSubstitution] = useState(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const goToCheckout = () => {
    navigation.navigate('Checkout', { items });
  };

  const handleAddToCart = async (product: Product) => {
    if (product.inStock) {
      addItem(product);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Trigger AI substitution
      setLoadingSubstitution(true);
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const res = await fetchSubstitution(product.asin);
        setLoadingSubstitution(false);
        navigation.navigate('SwapAI', {
          original: product,
          substitute: res.substitute,
          similarityScore: res.similarityScore,
        });
      } catch (err) {
        setLoadingSubstitution(false);
        Alert.alert('Out of Stock', `This item is out of stock and no substitutes were found.`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.profileRow}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvkgFUQhZw-JfvYikCEd9o4_pj1gyTLlNAJVxF7sKAFICUuvBaASq2GR7761VBHtn_A8n7oSNZZSvlhkuzkGmrQew8CA2n4eQ9wkkKnpsDm6Ypq1CDD8R2vkoz9HMlC-W7jIzl6XhR-q-HPC9btg9Vyn70Xvj_7bxvnTPHeC5VfYMzzkmZnML26Ekv-trbvTXpawJoNd-3Ii0ap2pa8z6_O5vjVrcai9KWT6jjLWACCX8moi4P5Z8cm0P5tnRxfkCKNCvmuH6OwgI',
            }}
            style={styles.avatar}
          />
          <View style={styles.profileTextWrap}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.profileName}>{user?.name ?? 'Rishu'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialIcons name="settings" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bento Grid Quick Actions */}
        <View style={styles.bentoGrid}>
          {/* FlashAsk (Voice) - full width row */}
          <Pressable
            style={styles.bentoVoiceCard}
            onPress={() => navigation.navigate('FlashAsk')}
          >
            <View style={styles.micIconRing}>
              <MaterialIcons name="mic" size={32} color={Colors.accentPrimary} />
            </View>
            <Text style={styles.bentoTitle}>FlashAsk</Text>
          </Pressable>

          {/* SnapReorder & Browse side-by-side */}
          <View style={styles.bentoRow}>
            {/* SnapReorder */}
            <Pressable
              style={styles.bentoHalfCard}
              onPress={() => navigation.navigate('SnapReorder')}
            >
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="center-focus-strong" size={24} color={Colors.textMuted} />
              </View>
              <Text style={styles.bentoSubTitle}>SnapReorder</Text>
            </Pressable>

            {/* Browse */}
            <Pressable
              style={styles.bentoHalfCard}
              onPress={goToCheckout}
            >
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="search" size={24} color={Colors.textMuted} />
              </View>
              <Text style={styles.bentoSubTitle}>Browse</Text>
            </Pressable>
          </View>
        </View>

        {/* PredictCart Section */}
        <View style={styles.predictSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="auto-awesome" size={20} color={Colors.accentPrimary} style={styles.sparkleIcon} />
              <Text style={styles.sectionTitle}>PredictCart</Text>
            </View>
            <Text style={styles.sectionLabel}>Usually ordered now</Text>
          </View>

          {state.status === 'loading' && (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>Analyzing items...</Text>
            </View>
          )}

          {state.status === 'error' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}

          {state.status === 'success' && state.data && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.productCarousel}
              contentContainerStyle={styles.productCarouselContent}
            >
              {state.data.items.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImageWrap}>
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
                    <Text style={styles.productPrice}>
                      {formatPrice(product.price, product.currency)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddToCart(product)}
                  >
                    <MaterialIcons name="add" size={16} color={Colors.textPrimary} />
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent Orders Chips */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Reorder from recent</Text>
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => handleAddToCart(RECENT_AMAZON_PRODUCTS.juice)}
            >
              <MaterialIcons name="history" size={16} color={Colors.textMuted} />
              <Text style={styles.chipText}>Orange Juice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chip}
              onPress={() => handleAddToCart(RECENT_AMAZON_PRODUCTS.redbull)}
            >
              <MaterialIcons name="history" size={16} color={Colors.textMuted} />
              <Text style={styles.chipText}>Red Bull</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chip}
              onPress={() => handleAddToCart(RECENT_AMAZON_PRODUCTS.advil)}
            >
              <MaterialIcons name="history" size={16} color={Colors.textMuted} />
              <Text style={styles.chipText}>Advil Ibuprofen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialIcons name="home" size={24} color={Colors.accentPrimary} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <MaterialIcons name="search" size={24} color={Colors.textMuted} />
          <Text style={styles.tabLabel}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={goToCheckout}>
          <View style={styles.cartIconWrap}>
            <MaterialIcons name="shopping-cart" size={24} color={Colors.textMuted} />
            {items.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{items.reduce((sum, i) => sum + i.quantity, 0)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.tabLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <MaterialIcons name="person" size={24} color={Colors.textMuted} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {loadingSubstitution && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accentPrimary} />
          <Text style={styles.loadingOverlayText}>Finding AI Substitute...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  topAppBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: Colors.bgBase,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.bgBorder,
  },
  profileTextWrap: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 104, // Space for bottom tab bar
  },
  bentoGrid: {
    marginBottom: 24,
  },
  bentoVoiceCard: {
    width: '100%',
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.bgBorder,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  micIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    // Accent glow mimicking shadow
    shadowColor: Colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bentoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bentoHalfCard: {
    width: '48.5%',
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.bgBorder,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bentoSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  predictSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeholderCard: {
    height: 120,
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: Colors.danger,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: Colors.textPrimary,
    fontSize: 13,
  },
  productCarousel: {
    marginHorizontal: -24,
  },
  productCarouselContent: {
    paddingHorizontal: 24,
  },
  productCard: {
    width: 160,
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.bgBorder,
    padding: 12,
    marginRight: 12,
  },
  productImageWrap: {
    height: 80,
    width: '100%',
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  productInfo: {
    marginTop: 12,
    marginBottom: 12,
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  productBrand: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  addBtn: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.bgBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  recentSection: {
    marginTop: 8,
  },
  recentTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.bgBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.tabBarBg,
    borderTopWidth: 1,
    borderColor: Colors.bgBorder,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  tabLabelActive: {
    color: Colors.accentPrimary,
    fontWeight: '500',
  },
  cartIconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.accentPrimary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayBase,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayText: {
    color: Colors.textPrimary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});
