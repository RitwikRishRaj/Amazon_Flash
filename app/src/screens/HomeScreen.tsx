import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '@constants/colors';
import type { RootStackParamList, Product } from '@app-types/index';
import { useContextMode } from '@hooks/useContextMode';
import { usePredictCart }  from '@hooks/usePredictCart';
import { useCartStore }    from '@store/cartStore';
import { useSessionStore } from '@store/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const { mode } = useContextMode();
  const { state } = usePredictCart();
  const { items, addItem } = useCartStore();
  const { user } = useSessionStore();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const goToCheckout = () => {
    navigation.navigate('Checkout', { items });
  };

  const addRecentItem = (name: string, price: number, brand: string) => {
    // Check if we already have it in predictions
    const found = state.data?.items.find(
      (item) =>
        item.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(item.name.toLowerCase())
    );
    if (found) {
      addItem(found);
    } else {
      // Construct fallback product representation
      const dummyProduct: Product = {
        id: `recent-${name.toLowerCase().replace(/\s+/g, '-')}`,
        asin: `ASIN-${name.substring(0, 3).toUpperCase()}`,
        name,
        brand,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBw2-WN88q1GxH7nZVjGD9dHMcnB5VFECh6HuXYGNamuYYALj0F2n1v0sPYBk0p7Bhg9T9t5rusLgBCzmSGDtHQucMnxtNhk6wTaiQe9Mot_4uBkj2q5VwpZlRUsQKB5IbSbNTvVAdrmTJXQfOQ23ZABUn8ccTXoQHVFIHFTBXK-gQKRAMPFt9PsXgLtk2dzLjUKxjIvwpo4qX4Ypscg_g0ISXfudS7q_P5z62kRJ3Aaj7dEr3VPKrcgON-dRTqmQQUtYxB9h9X8l8',
        price,
        currency: 'INR',
        inStock: true,
        estimatedDeliveryMin: 10,
        category: 'Recent',
      };
      addItem(dummyProduct);
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
                      {product.currency === 'INR' ? '₹' : '$'}{product.price}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => addItem(product)}
                  >
                    <MaterialIcons name="add" size={16} color="#FFFFFF" />
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
              onPress={() => addRecentItem('Milk & Bread', 65, 'Mother Dairy')}
            >
              <MaterialIcons name="history" size={16} color={Colors.textMuted} />
              <Text style={styles.chipText}>Milk & Bread</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.chip}
              onPress={() => addRecentItem('Paracetamol', 30, 'Crocin')}
            >
              <MaterialIcons name="history" size={16} color={Colors.textMuted} />
              <Text style={styles.chipText}>Paracetamol</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.chip}
              onPress={() => addRecentItem('Batteries AA', 150, 'Duracell')}
            >
              <MaterialIcons name="history" size={16} color={Colors.textMuted} />
              <Text style={styles.chipText}>Batteries AA</Text>
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
    fontFamily: 'Inter',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
  },
  errorCard: {
    backgroundColor: Colors.danger,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
  },
  productBrand: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    backgroundColor: 'rgba(19, 19, 19, 0.95)',
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
    fontFamily: 'Inter',
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
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
});
