import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useMarketplaceStore, CartItem } from '@/stores/marketplaceStore';

export default function CartScreen() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, getCartTotal } = useMarketplaceStore();
  const insets = useSafeAreaInsets();
  const total = getCartTotal();

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cart</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/marketplace')}>
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCheckout = () => {
    router.push('/marketplace/checkout');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Cart ({cart.length})</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ]);
          }}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.product_id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemImage} />
            ) : (
              <View style={styles.itemImagePlaceholder}>
                <Text style={styles.itemImageText}>📦</Text>
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemVendor}>🏪 {item.vendor_name}</Text>
              <Text style={styles.itemPrice}>₹{item.discount_price || item.price}</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                >
                  <Text style={styles.qtyButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.itemTotal}>₹{((item.discount_price || item.price) * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFromCart(item.product_id)}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Shipping</Text>
          <Text style={styles.totalValue}>Calculated at checkout</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Proceed to Checkout • ₹{total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  header: { backgroundColor: COLORS.deepOcean, padding: SPACING.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.white },
  clearText: { fontSize: FONT_SIZE.sm, color: COLORS.coral },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemImage: { width: 90, height: 90, resizeMode: 'cover' },
  itemImagePlaceholder: { width: 90, height: 90, backgroundColor: COLORS.gray[100], alignItems: 'center', justifyContent: 'center' },
  itemImageText: { fontSize: 28 },
  itemInfo: { flex: 1, padding: SPACING.sm },
  itemName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy, marginBottom: 4 },
  itemVendor: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginBottom: SPACING.xs },
  itemPrice: { fontSize: FONT_SIZE.md, fontWeight: 'bold', color: COLORS.seaGreen, marginBottom: SPACING.xs },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyButton: { width: 28, height: 28, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100], alignItems: 'center', justifyContent: 'center' },
  qtyButtonText: { fontSize: FONT_SIZE.lg, color: COLORS.deepNavy, fontWeight: '600' },
  qtyValue: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy, minWidth: 20, textAlign: 'center' },
  itemTotal: { marginLeft: 'auto', fontSize: FONT_SIZE.md, fontWeight: 'bold', color: COLORS.deepNavy },
  removeButton: { padding: SPACING.sm, justifyContent: 'flex-start' },
  removeText: { fontSize: FONT_SIZE.md, color: COLORS.gray[400] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.gray[500], marginBottom: SPACING.lg },
  browseButton: { backgroundColor: COLORS.oceanBlue, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md },
  browseButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
  footer: { backgroundColor: COLORS.white, padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.gray[200] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  totalLabel: { fontSize: FONT_SIZE.md, color: COLORS.gray[600] },
  totalValue: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy },
  checkoutButton: { backgroundColor: COLORS.seaGreen, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  checkoutText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
