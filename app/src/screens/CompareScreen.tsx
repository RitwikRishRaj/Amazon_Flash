import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, Pressable, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors } from '@constants/colors';
import { formatPrice, amazonInUrl } from '@constants/format';
import type { RootStackParamList } from '@app-types/index';
import { useCompareStore } from '@store/compareStore';
import { useCartStore } from '@store/cartStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Compare'>;

const COL_WIDTH = 180;

export default function CompareScreen(): React.JSX.Element {
    const navigation = useNavigation<Nav>();
    const { items, remove, clear } = useCompareStore();
    const { addItem } = useCartStore();

    const cheapest = items.length
        ? Math.min(...items.map((p) => p.price))
        : 0;
    const fastest = items.length
        ? Math.min(...items.map((p) => p.estimatedDeliveryMin))
        : 0;

    const handleAdd = (productId: string) => {
        const product = items.find((p) => p.id === productId);
        if (!product) return;
        addItem(product);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Compare</Text>
                {items.length > 0 ? (
                    <Pressable onPress={clear} style={styles.iconBtn}>
                        <Text style={styles.clearText}>Clear</Text>
                    </Pressable>
                ) : (
                    <View style={styles.iconBtn} />
                )}
            </View>

            {items.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <MaterialIcons name="compare-arrows" size={48} color={Colors.textMicro} />
                    <Text style={styles.emptyTitle}>Nothing to compare yet</Text>
                    <Text style={styles.emptySub}>
                        Tap the compare icon on products to add them here.
                    </Text>
                    <Pressable style={styles.emptyBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.emptyBtnText}>Browse products</Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                    {items.map((p) => {
                        const isCheapest = p.price === cheapest;
                        const isFastest = p.estimatedDeliveryMin === fastest;
                        return (
                            <View key={p.id} style={styles.col}>
                                {/* Remove */}
                                <Pressable style={styles.removeBtn} onPress={() => remove(p.id)}>
                                    <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                                </Pressable>

                                <Image source={{ uri: p.imageUrl }} style={styles.image} resizeMode="contain" />
                                <Text style={styles.name} numberOfLines={2}>{p.name}</Text>
                                <Text style={styles.brand}>{p.brand}</Text>

                                {/* Price */}
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>Price</Text>
                                    <View style={styles.metricValueRow}>
                                        <Text style={[styles.metricValue, isCheapest && styles.bestValue]}>
                                            {formatPrice(p.price, p.currency)}
                                        </Text>
                                        {isCheapest && <Text style={styles.bestTag}>LOWEST</Text>}
                                    </View>
                                </View>

                                {/* Delivery */}
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>Delivery</Text>
                                    <View style={styles.metricValueRow}>
                                        <Text style={[styles.metricValue, isFastest && styles.bestValue]}>
                                            {p.estimatedDeliveryMin} min
                                        </Text>
                                        {isFastest && <Text style={styles.bestTag}>FASTEST</Text>}
                                    </View>
                                </View>

                                {/* Stock */}
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>Availability</Text>
                                    <Text style={[styles.metricValue, { color: p.inStock ? Colors.success : Colors.danger }]}>
                                        {p.inStock ? 'In stock' : 'Out of stock'}
                                    </Text>
                                </View>

                                {/* Category */}
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>Category</Text>
                                    <Text style={styles.metricValue}>{p.category}</Text>
                                </View>

                                {/* Actions */}
                                <Pressable
                                    style={[styles.addBtn, !p.inStock && styles.addBtnDisabled]}
                                    onPress={() => handleAdd(p.id)}
                                    disabled={!p.inStock}
                                >
                                    <MaterialIcons name="add-shopping-cart" size={16} color={Colors.bgBase} />
                                    <Text style={styles.addBtnText}>Add</Text>
                                </Pressable>

                                <Pressable style={styles.amazonLink} onPress={() => void Linking.openURL(amazonInUrl(p.asin))}>
                                    <MaterialIcons name="open-in-new" size={14} color={Colors.accentPrimary} />
                                    <Text style={styles.amazonLinkText}>View on Amazon.in</Text>
                                </Pressable>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bgBase },
    header: {
        height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.bgBorder,
    },
    iconBtn: { minWidth: 56, justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    clearText: { color: Colors.accentPrimary, fontWeight: '600', textAlign: 'right' },
    row: { padding: 16, gap: 12 },
    col: {
        width: COL_WIDTH, backgroundColor: Colors.bgSurface, borderRadius: 14, padding: 12,
        borderWidth: 1, borderColor: Colors.bgBorder, gap: 6,
    },
    removeBtn: { alignSelf: 'flex-end', padding: 2 },
    image: {
        width: '100%', height: 96, borderRadius: 8, backgroundColor: Colors.bgElevated, marginBottom: 6,
    },
    name: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, minHeight: 34 },
    brand: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
    metricRow: { borderTopWidth: 1, borderTopColor: Colors.bgBorder, paddingVertical: 6 },
    metricLabel: { fontSize: 10, color: Colors.textMicro, textTransform: 'uppercase', letterSpacing: 0.5 },
    metricValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    metricValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    bestValue: { color: Colors.success },
    bestTag: {
        fontSize: 8, fontWeight: '700', color: Colors.success, borderWidth: 1, borderColor: Colors.success,
        borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
    },
    addBtn: {
        marginTop: 10, height: 36, borderRadius: 8, backgroundColor: Colors.accentPrimary,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    addBtnDisabled: { backgroundColor: Colors.bgElevated },
    addBtnText: { color: Colors.bgBase, fontWeight: '700', fontSize: 14 },
    amazonLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
    amazonLinkText: { color: Colors.accentPrimary, fontSize: 12, fontWeight: '600' },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 12 },
    emptyBtn: { backgroundColor: Colors.bgSurface, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
    emptyBtnText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 16 },
});
