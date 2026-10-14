import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useVendorProfile } from '@/hooks/useMarketplace';
import { useMarketplaceStore } from '@/stores/marketplaceStore';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

export default function VendorProfileScreen() {
  const { slug } = useLocalSearchParams();
  const { vendor, loading } = useVendorProfile(slug as string);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!vendor?.id) return;
    setLoadingProducts(true);
    api.get(ENDPOINTS.MARKETPLACE.PRODUCTS, { vendor: vendor.id })
      .then((res: any) => setProducts(res.results || res))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [vendor?.id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🏪</Text>
        <Text style={styles.emptyText}>Vendor not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.shopName}>{vendor.shop_name}</Text>
        {vendor.is_verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified Vendor</Text>
          </View>
        )}
        {vendor.village_name && <Text style={styles.village}>📍 {vendor.village_name}</Text>}
        <HtmlText html={vendor.description} style={styles.description} />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>★ {vendor.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{vendor.total_sales || 0}</Text>
            <Text style={styles.statLabel}>Sales</Text>
          </View>
          {vendor.phone && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>📞</Text>
              <Text style={styles.statLabel}>{vendor.phone}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Products by {vendor.shop_name}</Text>
        {loadingProducts && <ActivityIndicator style={{ padding: SPACING.lg }} color={COLORS.oceanBlue} />}
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productList}
          ListEmptyComponent={
            !loadingProducts ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No products yet</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => router.push(`/marketplace/${item.slug || item.id}`)}
            >
              {item.image ? (
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.productImageText}>📦</Text>
                </View>
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.productImageText}>📦</Text>
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>₹{item.discount_price || item.price}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.foam },
  header: { backgroundColor: COLORS.deepOcean, padding: SPACING.lg },
  shopName: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.white, marginBottom: SPACING.xs },
  verifiedBadge: { backgroundColor: COLORS.seaGreen, alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full, marginBottom: SPACING.sm },
  verifiedText: { fontSize: FONT_SIZE.xs, color: COLORS.white, fontWeight: '600' },
  village: { fontSize: FONT_SIZE.sm, color: COLORS.white, opacity: 0.8, marginBottom: SPACING.sm },
  description: { fontSize: FONT_SIZE.md, color: COLORS.white, opacity: 0.9, marginBottom: SPACING.md, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: SPACING.lg },
  stat: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.white },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.white, opacity: 0.7, marginTop: 2 },
  productsSection: { flex: 1, padding: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.md },
  productRow: { paddingHorizontal: 0, gap: SPACING.sm },
  productList: { paddingBottom: SPACING.xxl },
  productCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm },
  productImagePlaceholder: { width: '100%', height: 100, backgroundColor: COLORS.gray[100], alignItems: 'center', justifyContent: 'center' },
  productImageText: { fontSize: 28 },
  productInfo: { padding: SPACING.sm },
  productName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.deepNavy, marginBottom: 4 },
  productPrice: { fontSize: FONT_SIZE.md, fontWeight: 'bold', color: COLORS.seaGreen },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500] },
});
