import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useProductDetail } from '@/hooks/useMarketplace';
import { useMarketplaceStore } from '@/stores/marketplaceStore';
import HtmlText from '@/components/HtmlText';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams();
  const { product, loading } = useProductDetail(slug as string);
  const { addToCart } = useMarketplaceStore();
  const [quantity, setQuantity] = useState(1);
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🐚</Text>
        <Text style={styles.emptyText}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const price = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      discount_price: product.discount_price ? Number(product.discount_price) : undefined,
      image: product.image,
      vendor_name: product.vendor?.shop_name || '',
      stock: product.stock,
    }, quantity);
    Alert.alert('Added to cart', `${product.name} × ${quantity}`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/marketplace/cart') },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>📦</Text>
          </View>
        )}

        <View style={styles.content}>
          {product.category && (
            <Text style={styles.category}>{product.category.icon} {product.category.name}</Text>
          )}
          <Text style={styles.title}>{product.name}</Text>

          <View style={styles.vendorRow}>
            <Text style={styles.vendorLabel}>🏪 Sold by</Text>
            <TouchableOpacity onPress={() => router.push(`/marketplace/vendor/${product.vendor?.slug || product.vendor?.id}`)}>
              <Text style={styles.vendorName}>{product.vendor?.shop_name}</Text>
            </TouchableOpacity>
            {product.vendor?.is_verified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
          </View>

          <View style={styles.priceCard}>
            <View style={styles.priceMain}>
              <Text style={styles.price}>₹{price}</Text>
              {hasDiscount && (
                <View style={styles.discountInfo}>
                  <Text style={styles.originalPrice}>₹{product.price}</Text>
                  <Text style={styles.discountPercent}>
                    {Math.round(((Number(product.price) - Number(price)) / Number(product.price)) * 100)}% OFF
                  </Text>
                </View>
              )}
            </View>
            {product.contribution_discount_percent > 0 && (
              <View style={styles.contributionDiscount}>
                <Text style={styles.contributionText}>
                  🏆 Verified contributors: {product.contribution_discount_percent}% OFF
                </Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {product.rating > 0 && (
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>★ {product.rating.toFixed(1)}</Text>
                <Text style={styles.metaLabel}>Rating</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{product.units_sold || 0}</Text>
              <Text style={styles.metaLabel}>Sold</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaValue, product.stock > 0 ? styles.inStock : styles.outOfStock]}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </Text>
              <Text style={styles.metaLabel}>Stock</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <HtmlText html={product.description} style={styles.description} />
          </View>

          {product.vendor && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vendor</Text>
              <TouchableOpacity
                style={styles.vendorCard}
                onPress={() => router.push(`/marketplace/vendor/${product.vendor.slug || product.vendor.id}`)}
              >
                <Text style={styles.vendorShopName}>{product.vendor.shop_name}</Text>
                {product.vendor.village_name && (
                  <Text style={styles.vendorVillage}>📍 {product.vendor.village_name}</Text>
                )}
                <HtmlText
                  html={product.vendor.description}
                  style={styles.vendorDescription}
                  paragraphSpacing={4}
                  numberOfLines={2}
                />
                <View style={styles.vendorStats}>
                  <Text style={styles.vendorStat}>★ {product.vendor.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={styles.vendorStat}>{product.vendor.total_sales || 0} sales</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addToCartButton, product.stock <= 0 && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={product.stock <= 0}
        >
          <Text style={styles.addToCartText}>
            {product.stock <= 0 ? 'Out of Stock' : `Add to Cart • ₹${(price * quantity).toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.foam },
  heroImage: { width: '100%', height: 280, resizeMode: 'cover' },
  heroPlaceholder: { width: '100%', height: 280, backgroundColor: COLORS.gray[100], alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { fontSize: 64 },
  content: { padding: SPACING.md },
  category: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '500', marginBottom: SPACING.xs },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.deepNavy, marginBottom: SPACING.md },
  vendorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.xs },
  vendorLabel: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500] },
  vendorName: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '600' },
  verifiedBadge: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, fontWeight: '600' },
  priceCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  priceMain: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm },
  price: { fontSize: FONT_SIZE.xxxl, fontWeight: 'bold', color: COLORS.seaGreen },
  originalPrice: { fontSize: FONT_SIZE.md, color: COLORS.gray[400], textDecorationLine: 'line-through' },
  discountPercent: { fontSize: FONT_SIZE.sm, color: COLORS.coral, fontWeight: '600' },
  discountInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  contributionDiscount: { marginTop: SPACING.sm, backgroundColor: COLORS.sand, padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  contributionText: { fontSize: FONT_SIZE.xs, color: COLORS.deepNavy, fontWeight: '500' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  metaItem: { alignItems: 'center' },
  metaValue: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.deepNavy },
  metaLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 2 },
  inStock: { color: COLORS.seaGreen },
  outOfStock: { color: COLORS.coral },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.sm },
  description: { fontSize: FONT_SIZE.md, color: COLORS.gray[600], lineHeight: 24 },
  vendorCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  vendorShopName: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.xs },
  vendorVillage: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], marginBottom: SPACING.xs },
  vendorDescription: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], marginBottom: SPACING.sm },
  vendorStats: { flexDirection: 'row', gap: SPACING.md },
  vendorStat: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500] },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], marginBottom: SPACING.sm },
  backLink: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '600' },
  footer: { flexDirection: 'row', padding: SPACING.md, paddingBottom: SPACING.xl, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray[200], gap: SPACING.md, alignItems: 'center' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyButton: { width: 36, height: 36, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100], alignItems: 'center', justifyContent: 'center' },
  qtyButtonText: { fontSize: FONT_SIZE.xl, color: COLORS.deepNavy, fontWeight: '600' },
  qtyValue: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, minWidth: 24, textAlign: 'center' },
  addToCartButton: { flex: 1, backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center' },
  addToCartText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
  disabledButton: { backgroundColor: COLORS.gray[300] },
});
