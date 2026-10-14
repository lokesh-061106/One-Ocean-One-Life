import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useMyOrders } from '@/hooks/useMarketplace';

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.gray[500],
  confirmed: COLORS.oceanBlue,
  shipped: '#F59E0B',
  delivered: COLORS.seaGreen,
  cancelled: COLORS.coral,
  refunded: COLORS.gray[400],
};

export default function OrdersScreen() {
  const { orders, loading, refresh } = useMyOrders();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.oceanBlue} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No orders yet</Text>
              <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/marketplace')}>
                <Text style={styles.browseButtonText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#{item.order_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || COLORS.gray[300] }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.orderMeta}>
              <Text style={styles.orderItems}>{item.items_count} item{item.items_count !== 1 ? 's' : ''}</Text>
              <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.orderFooter}>
              <Text style={styles.paymentMethod}>💳 {item.payment_method}</Text>
              <Text style={styles.orderTotal}>₹{item.total}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  header: { backgroundColor: COLORS.deepOcean, padding: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.white },
  list: { padding: SPACING.md },
  orderCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  orderNumber: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  statusText: { fontSize: FONT_SIZE.xs, color: COLORS.white, fontWeight: '600', textTransform: 'capitalize' },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  orderItems: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500] },
  orderDate: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500] },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.gray[100], paddingTop: SPACING.sm },
  paymentMethod: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500] },
  orderTotal: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.seaGreen },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], marginBottom: SPACING.lg },
  browseButton: { backgroundColor: COLORS.oceanBlue, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md },
  browseButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
