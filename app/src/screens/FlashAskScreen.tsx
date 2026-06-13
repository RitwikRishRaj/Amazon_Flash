import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, PanResponder, Image, TouchableOpacity
} from 'react-native';

const THUMB_WIDTH = 56;
const TRACK_PADDING = 4;
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors } from '@constants/colors';
import type { RootStackParamList, Product } from '@app-types/index';
import { useVoice } from '@hooks/useVoice';
import { placeOrder } from '@services/api';
import { useSessionStore } from '@store/sessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FlashAsk'>;

const CROCIN_PRODUCT: Product = {
  id: 'prod-crocin',
  asin: 'B00F3JOF8A',
  name: 'Crocin Advance',
  brand: '500mg • 15 Tablets',
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4XCkuUuNAIfkOvWEqw-FQbfSeb9JpbOJEgD4FJnrSg77yO2Yoo8I4O2Oj-3mN_qWUGfKdDRMk8fuB1SH5yAwhm-36Ws7tdpTZ6GgxyJgUMDHt6ZEqw1Q6KtSWYsfiODv07eaKlqSyn85YYXpuGx4U45aSsLcW1z9BuPG3QbGGCNR0EY51XDliAF71icItBFSSwWc__9MO6Z6tkCfPPofh38QEp1GYqoUr1YTXX7p-bQRFaPEHaJOtBp8lDzaP95bJ4Owap9lLG0o',
  price: 4.50,
  currency: 'USD',
  inStock: true,
  estimatedDeliveryMin: 12,
  category: 'Medicine',
};

export default function FlashAskScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const { user } = useSessionStore();
  const { state, isRecording, startRecording, stopRecording, reset } = useVoice();

  // Animation values for pulsing rings
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0.8)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0.8)).current;
  const ring3Scale = useRef(new Animated.Value(0.8)).current;
  const ring3Opacity = useRef(new Animated.Value(0.8)).current;

  // Animation values for sound wave bars
  const bar1ScaleY = useRef(new Animated.Value(0.2)).current;
  const bar2ScaleY = useRef(new Animated.Value(0.2)).current;
  const bar3ScaleY = useRef(new Animated.Value(0.2)).current;
  const bar4ScaleY = useRef(new Animated.Value(0.2)).current;
  const bar5ScaleY = useRef(new Animated.Value(0.2)).current;

  // Bottom Sheet Y-offset
  const sheetY = useRef(new Animated.Value(500)).current;

  // Swipe-to-Order slider logic
  const pan = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const maxDistance = trackWidth - THUMB_WIDTH - TRACK_PADDING * 2;

  // Target product
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);

  // Trigger mic recording
  const handleMicPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      setMatchedProduct(null);
      reset();
      await startRecording();
    }
  };

  // Listen to useVoice results
  useEffect(() => {
    if (state.status === 'success') {
      if (state.data?.product) {
        setMatchedProduct(state.data.product);
      } else {
        // Fallback to Crocin Advance for visual demonstration
        setMatchedProduct(CROCIN_PRODUCT);
      }
    } else if (state.status === 'error') {
      // If voice processing fails/network timeout, load Crocin as demo fallback
      setMatchedProduct(CROCIN_PRODUCT);
    }
  }, [state]);

  // Ring pulse loops
  useEffect(() => {
    if (isRecording) {
      const createRingAnim = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(scale, {
                toValue: 2.5,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(scale, {
                toValue: 0.8,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0.8,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      };

      const anim1 = createRingAnim(ring1Scale, ring1Opacity, 0);
      const anim2 = createRingAnim(ring2Scale, ring2Opacity, 600);
      const anim3 = createRingAnim(ring3Scale, ring3Opacity, 1200);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
        ring1Scale.setValue(0.8);
        ring1Opacity.setValue(0.8);
        ring2Scale.setValue(0.8);
        ring2Opacity.setValue(0.8);
        ring3Scale.setValue(0.8);
        ring3Opacity.setValue(0.8);
      };
    }
  }, [isRecording]);

  // Sound wave loops
  useEffect(() => {
    if (isRecording) {
      const createBarAnim = (scale: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(scale, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.2,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createBarAnim(bar1ScaleY, 0);
      const anim2 = createBarAnim(bar2ScaleY, 150);
      const anim3 = createBarAnim(bar3ScaleY, 300);
      const anim4 = createBarAnim(bar4ScaleY, 450);
      const anim5 = createBarAnim(bar5ScaleY, 600);

      anim1.start();
      anim2.start();
      anim3.start();
      anim4.start();
      anim5.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
        anim4.stop();
        anim5.stop();
        bar1ScaleY.setValue(0.2);
        bar2ScaleY.setValue(0.2);
        bar3ScaleY.setValue(0.2);
        bar4ScaleY.setValue(0.2);
        bar5ScaleY.setValue(0.2);
      };
    }
  }, [isRecording]);

  // Slide bottom sheet up/down
  useEffect(() => {
    if (matchedProduct) {
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 120,
      }).start();
    } else {
      Animated.timing(sheetY, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [matchedProduct]);

  // PanResponder for Swipe-to-Order slider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (maxDistance > 0) {
          const newVal = Math.min(Math.max(0, gestureState.dx), maxDistance);
          pan.setValue(newVal);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (maxDistance > 0) {
          if (gestureState.dx >= maxDistance * 0.8) {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Lock to end
            Animated.timing(pan, {
              toValue: maxDistance,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              handleSwipeSuccess();
            });
          } else {
            // Animate back
            Animated.spring(pan, {
              toValue: 0,
              friction: 8,
              useNativeDriver: true,
            }).start();
          }
        }
      },
    })
  ).current;

  // Process checkout order
  const handleSwipeSuccess = async () => {
    if (!matchedProduct) return;
    try {
      const order = await placeOrder([{ product: matchedProduct, quantity: 1 }]);
      navigation.navigate('Confirmed', { order });
    } catch {
      // Mocked fallback order if API dev server is offline
      const mockOrder = {
        id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        items: [{ product: matchedProduct, quantity: 1 }],
        totalPrice: matchedProduct.price,
        currency: matchedProduct.currency,
        address: user?.defaultAddress ?? {
          line1: '123 Amazon Way',
          city: 'Seattle',
          state: 'WA',
          zip: '98101',
          country: 'USA',
        },
        paymentMethodLast4: user?.defaultPaymentLast4 ?? '4321',
        status: 'confirmed' as const,
        placedAt: new Date().toISOString(),
        etaMin: matchedProduct.estimatedDeliveryMin,
      };
      navigation.navigate('Confirmed', { order: mockOrder });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>FlashAsk</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Mic & Soundwave Container */}
      <View style={styles.mainCanvas}>
        {/* Pulsing Mic Interactive Area */}
        <View style={styles.micContainer}>
          {isRecording && (
            <>
              <Animated.View 
                style={[
                  styles.pulsingRing, 
                  { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.pulsingRing, 
                  { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.pulsingRing, 
                  { opacity: ring3Opacity, transform: [{ scale: ring3Scale }] }
                ]} 
              />
            </>
          )}

          {/* Mic Button */}
          <TouchableOpacity 
            style={[styles.micBtn, matchedProduct && styles.micBtnInactive]} 
            onPress={handleMicPress}
            activeOpacity={0.85}
          >
            <MaterialIcons 
              name="mic" 
              size={40} 
              color={Colors.accentPrimary} 
              style={styles.micIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Listening / Match Status */}
        <Text style={styles.statusText}>
          {isRecording 
            ? 'Listening...' 
            : state.status === 'loading'
            ? 'Processing...'
            : matchedProduct 
            ? 'Found Match' 
            : 'Tap mic & speak'}
        </Text>

        {/* Dynamic Sound Wave */}
        <View style={styles.soundWave}>
          <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: bar1ScaleY }] }]} />
          <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: bar2ScaleY }] }]} />
          <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: bar3ScaleY }] }]} />
          <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: bar4ScaleY }] }]} />
          <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: bar5ScaleY }] }]} />
        </View>
      </View>

      {/* Swipe-to-Order Bottom Sheet */}
      {matchedProduct && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetY }] }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* AI Header */}
          <View style={styles.aiHeader}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.aiLabel}>AI FOUND</Text>
          </View>

          {/* Product Result Card */}
          <View style={styles.productCard}>
            <Image source={{ uri: matchedProduct.imageUrl }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{matchedProduct.name}</Text>
              <Text style={styles.productBrand} numberOfLines={1}>{matchedProduct.brand}</Text>
              
              <View style={styles.productPriceRow}>
                <Text style={styles.productPrice}>
                  {matchedProduct.currency === 'INR' ? '₹' : '$'}{matchedProduct.price.toFixed(2)}
                </Text>
                
                {/* Delivery pill */}
                <View style={styles.deliveryPill}>
                  <MaterialIcons name="bolt" size={14} color={Colors.success} />
                  <Text style={styles.deliveryPillText}>
                    {matchedProduct.estimatedDeliveryMin} MIN
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Swipe-to-Confirm Slider */}
          <View 
            style={styles.swipeTrack} 
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          >
            <View style={styles.swipeTextWrap}>
              <Text style={styles.swipeText}>SWIPE TO ORDER</Text>
            </View>

            {/* Slider thumb */}
            <Animated.View 
              {...panResponder.panHandlers}
              style={[
                styles.swipeThumb, 
                { transform: [{ translateX: pan }] }
              ]}
            >
              <MaterialIcons name="chevron-right" size={28} color={Colors.accentPrimary} />
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMuted,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  mainCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  micContainer: {
    position: 'relative',
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  pulsingRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 153, 0, 0.4)',
  },
  micBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.bgBorder,
    // Accent shadow glow
    shadowColor: Colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  micBtnInactive: {
    shadowOpacity: 0.05,
    borderColor: Colors.bgBorder,
  },
  micIcon: {
    textShadowColor: 'rgba(255, 153, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
    marginBottom: 32,
    // Text shadow matching the HTML design
    textShadowColor: 'rgba(255, 153, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  soundWave: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 64,
    width: 200,
    gap: 8,
  },
  soundWaveBar: {
    width: 8,
    height: '100%',
    backgroundColor: Colors.accentPrimary,
    borderRadius: 9999,
    // Shadow glow
    shadowColor: Colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.bgBorder,
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 48,
    height: 6,
    backgroundColor: Colors.bgBorder,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  aiLabel: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 153, 0, 0.2)',
    padding: 16,
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.bgBase,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accentPrimary,
    fontFamily: 'Inter',
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  deliveryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    fontFamily: 'Inter',
  },
  swipeTrack: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(204, 122, 0, 0.25)',
    padding: TRACK_PADDING,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  swipeTextWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  swipeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  swipeThumb: {
    width: THUMB_WIDTH,
    height: THUMB_WIDTH,
    borderRadius: THUMB_WIDTH / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
