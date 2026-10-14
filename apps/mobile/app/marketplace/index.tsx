import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useProducts, useCategories } from '@/hooks/useMarketplace';
import { useMarketplaceStore } from '@/stores/marketplaceStore';

export default function MarketplaceScreen() {
  const params = useLocalSearchParams();
  const { products, error, isLoading, hasMore, loadMore, refresh } = useProducts();
  const categories = useCategories();
  const { filters, setFilter, resetFilters, getCartCount } = useMarketplaceStore();
  const cartCount = useMarketplaceStore((s) => s.getCartCount());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (params.category) setFilter('category', params.category);
  }, [params.category]);

  const activeCategory = (categories || []).find((c: any) => c.slug === filters.category);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Marketplace</Text>
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/marketplace/cart')}>
            <Text style={styles.cartIcon}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Ocean-friendly products for coastal communities</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={filters.search}
          onChangeText={(t) => setFilter('search', t)}
          onSubmitEditing={() => refresh()}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>⚙</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, !filters.category && styles.categoryChipActive]}
              onPress={() => { setFilter('category', null); resetFilters(); }}
            >
              <Text style={[styles.categoryChipText, !filters.category && styles.categoryChipTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, filters.category === cat.slug && styles.categoryChipActive]}
                onPress={() => setFilter('category', cat.slug)}
              >
                <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryChipText, filters.category === cat.slug && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.sortRow}>
            {(['newest', 'price_asc', 'price_desc', 'rating', 'popular'] as const).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[styles.sortChip, filters.sortBy === sort && styles.sortChipActive]}
                onPress={() => setFilter('sortBy', sort)}
              >
                <Text style={[styles.sortChipText, filters.sortBy === sort && styles.sortChipTextActive]}>
                  {sort === 'newest' ? 'New' : sort === 'price_asc' ? 'Low$' : sort === 'price_desc' ? 'High$' : sort === 'rating' ? '★ Top' : '🔥 Hot'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={COLORS.oceanBlue} />}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🐚</Text>
              <Text style={styles.emptyText}>No products found</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.emptyLink}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={isLoading ? <ActivityIndicator style={styles.loader} color={COLORS.oceanBlue} /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => router.push(`/marketplace/${item.slug || item.id}`)}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.productImage} />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Text style={styles.productImagePlaceholderText}>📦</Text>
              </View>
            )}
            <View style={styles.productInfo}>
              {item.category_name && (
                <Text style={styles.productCategory}>{item.category_name}</Text>
              )}
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.vendorRow}>
                <Text style={styles.vendorName} numberOfLines={1}>🏪 {item.vendor_name}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>₹{item.discount_price || item.price}</Text>
                {item.discount_price && item.discount_price < item.price && (
                  <Text style={styles.originalPrice}>₹{item.price}</Text>
                )}
                {item.contribution_discount_percent > 0 && (
                  <Text style={styles.discountBadge}>-{item.contribution_discount_percent}%</Text>
                )}
              </View>
              <View style={styles.productMeta}>
                {item.rating > 0 && <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>}
                <Text style={styles.stock}>{item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  header: { backgroundColor: COLORS.deepOcean, padding: SPACING.md, paddingTop: SPACING.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  cartButton: { position: 'relative', padding: SPACING.sm },
  cartIcon: { fontSize: 24, color: COLORS.white },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.coral, borderRadius: BORDER_RADIUS.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', padding: SPACING.md, paddingBottom: 0, gap: SPACING.sm },
  searchInput: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, borderWidth: 1, borderColor: COLORS.gray[200] },
  filterToggle: { width: 44, height: 44, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.gray[200] },
  filterToggleActive: { backgroundColor: COLORS.oceanBlue, borderColor: COLORS.oceanBlue },
  filterToggleText: { fontSize: 18 },
  filterPanel: { backgroundColor: COLORS.white, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray[200] },
  categoryScroll: { marginBottom: SPACING.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100], marginRight: SPACING.sm },
  categoryChipActive: { backgroundColor: COLORS.oceanBlue },
  categoryChipIcon: { fontSize: 14, marginRight: SPACING.xs },
  categoryChipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600] },
  categoryChipTextActive: { color: COLORS.white },
  sortRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  sortChip: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100] },
  sortChipActive: { backgroundColor: COLORS.seaGreen },
  sortChipText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[600] },
  sortChipTextActive: { color: COLORS.white },
  productRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  productList: { paddingVertical: SPACING.md },
  productCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  productImage: { width: '100%', height: 130, resizeMode: 'cover' },
  productImagePlaceholder: { width: '100%', height: 130, backgroundColor: COLORS.gray[100], alignItems: 'center', justifyContent: 'center' },
  productImagePlaceholderText: { fontSize: 32 },
  productInfo: { padding: SPACING.sm },
  productCategory: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, fontWeight: '500', marginBottom: 2 },
  productName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.xs },
  vendorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  vendorName: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  productPrice: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.seaGreen },
  originalPrice: { fontSize: FONT_SIZE.sm, color: COLORS.gray[400], textDecorationLine: 'line-through' },
  discountBadge: { fontSize: FONT_SIZE.xs, color: COLORS.coral, fontWeight: '600' },
  productMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  rating: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  stock: { fontSize: FONT_SIZE.xs, color: COLORS.gray[400] },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], marginBottom: SPACING.sm },
  emptyLink: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '600' },
  loader: { paddingVertical: SPACING.lg },
});
