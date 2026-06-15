import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { Colors }        from '@constants/colors';
import type { RootStackParamList } from '@app-types/index';
import { useCamera }     from '@hooks/useCamera';
import { useCartStore }  from '@store/cartStore';
import ScanReticle       from '@components/ScanReticle';
import ProductResultCard from '@components/ProductResultCard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SnapReorder'>;

export default function SnapReorderScreen(): React.JSX.Element {
  const navigation   = useNavigation<Nav>();
  const { permission, requestPermission, cameraRef, state, captureAndScan, reset } = useCamera();
  const { addItem }  = useCartStore();

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionWrap}>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSub}>
            SnapReorder needs your camera to identify products instantly.
          </Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleAdd = () => {
    if (state.data?.product) {
      addItem(state.data.product);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Checkout', { items: [{ product: state.data.product, quantity: 1 }] });
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Reticle overlay */}
      <ScanReticle isScanning={state.status === 'loading'} />

      {/* Close button */}
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>✕</Text>
        </Pressable>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {state.status === 'idle' && (
          <>
            <Text style={styles.hint}>Point camera at a product label or barcode</Text>
            <Pressable style={styles.scanBtn} onPress={captureAndScan}>
              <Text style={styles.scanBtnText}>⚡ Scan Now</Text>
            </Pressable>
          </>
        )}

        {state.status === 'loading' && (
          <Text style={styles.hint}>Identifying product…</Text>
        )}

        {state.status === 'error' && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{state.error}</Text>
            <Pressable style={styles.scanBtn} onPress={reset}>
              <Text style={styles.scanBtnText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {state.status === 'success' && state.data?.product && (
          <>
            <ProductResultCard product={state.data.product} />
            <Pressable style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>Add to Cart →</Text>
            </Pressable>
          </>
        )}

        {state.status === 'success' && !state.data?.product && (
          <View style={styles.noMatch}>
            <Text style={styles.hint}>No product matched. Try again.</Text>
            <Pressable onPress={reset}><Text style={styles.retryLink}>Rescan</Text></Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:        { backgroundColor: 'transparent' },
  container:   { flex: 1, backgroundColor: Colors.bgBase },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgBase },
  muted:       { color: Colors.textMuted },
  topBar:      { position: 'absolute', top: 0, left: 0, right: 0 },
  closeBtn:    { margin: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.scrim, alignItems: 'center', justifyContent: 'center' },
  closeTxt:    { color: Colors.textPrimary, fontSize: 16 },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgSurface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 48 },
  hint:        { color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
  scanBtn:     { backgroundColor: Colors.accentPrimary, padding: 16, borderRadius: 12, alignItems: 'center' },
  scanBtnText: { color: Colors.bgBase, fontWeight: '700', fontSize: 16 },
  errorWrap:   { gap: 12 },
  errorText:   { color: Colors.danger, textAlign: 'center' },
  addBtn:      { backgroundColor: Colors.accentPrimary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  addBtnText:  { color: Colors.bgBase, fontWeight: '700', fontSize: 16 },
  noMatch:     { alignItems: 'center', gap: 8 },
  retryLink:   { color: Colors.accentPrimary, fontWeight: '600' },
  permissionWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  permTitle:   { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  permSub:     { color: Colors.textMuted, textAlign: 'center' },
  permBtn:     { backgroundColor: Colors.accentPrimary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  permBtnText: { color: Colors.bgBase, fontWeight: '700', fontSize: 16 },
  backLink:    { color: Colors.textMuted },
});
