import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

const STATUS_COLOR: Record<string, string> = {
  paid: COLORS.seaGreen,
  confirmed: COLORS.oceanBlue,
  pending: '#F59E0B',
  completed: COLORS.gray[500],
  cancelled: COLORS.coral,
  no_show: COLORS.coral,
};

function formatINR(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function EcotourismBookingsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ledger, setLedger] = useState<Record<string, any[]>>({});

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>(ENDPOINTS.ECOTOURISM.MY_BOOKINGS);
      setBookings(res.results || res || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { load().catch(() => {}); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const toggleLedger = async (b: any) => {
    const key = String(b.id);
    if (expanded === key) {
      setExpanded(null);
      return;
    }
    setExpanded(key);
    if (!ledger[key]) {
      try {
        const res = await api.get<any>(`${ENDPOINTS.ECOTOURISM.BOOKINGS}${b.id}/ledger/`);
        setLedger((prev) => ({ ...prev, [key]: res.lines || res || [] }));
      } catch {}
    }
  };

  const cancel = (b: any) => {
    Alert.alert('Cancel booking?', `Booking ${b.booking_ref} will be cancelled.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`${ENDPOINTS.ECOTOURISM.BOOKINGS}${b.id}/cancel/`, {});
            load();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not cancel.');
          }
        },
      },
    ]);
  };

  const openCheckout = (b: any) => {
    router.push({
      pathname: '/ecotourism/checkout',
      params: { id: b.id, ref: b.booking_ref, amount: String(b.total_amount ?? '') },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.oceanBlue} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My ecotourism bookings</Text>
        <Text style={styles.headerSub}>
          Every rupee is shown line-by-line — 80% to the fishing family, 10% marketplace operator,
          5% conservation, 5% O3L platform.
        </Text>
      </View>

      {!bookings.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎟</Text>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyText}>Book a fisher-led trip or a homestay and it will appear here.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/ecotourism')}>
            <Text style={styles.primaryBtnText}>Browse experiences</Text>
          </TouchableOpacity>
        </View>
      ) : (
        bookings.map((b) => {
          const key = String(b.id);
          const isExpanded = expanded === key;
          const lines = ledger[key] || [];
          const status = b.status || 'pending';
          return (
            <View key={key} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.ref}>{b.booking_ref}</Text>
                <View style={[styles.statusChip, { backgroundColor: (STATUS_COLOR[status] || COLORS.gray[400]) }]}>
                  <Text style={styles.statusText}>{status}</Text>
                </View>
              </View>
              <Text style={styles.expTitle} numberOfLines={2}>{b.experience_name || b.package_title || 'Ecotourism booking'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>📅 {b.experience_date || '—'}</Text>
                <Text style={styles.meta}>👥 {b.participants || '—'}</Text>
                <Text style={styles.metaStrong}>{formatINR(b.total_amount)}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.linkBtn} onPress={() => toggleLedger(b)}>
                  <Text style={styles.linkBtnText}>{isExpanded ? 'Hide split ▲' : 'Show money split ▼'}</Text>
                </TouchableOpacity>
                {!b.paid && b.payment_status !== 'paid' && status !== 'cancelled' && status !== 'completed' && (
                  <TouchableOpacity style={styles.payBtn} onPress={() => openCheckout(b)}>
                    <Text style={styles.payBtnText}>Pay</Text>
                  </TouchableOpacity>
                )}
                {status !== 'cancelled' && status !== 'completed' && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => cancel(b)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isExpanded && (
                <View style={styles.ledgerBox}>
                  {lines.length ? (
                    lines.map((line, i) => (
                      <View key={line.recipient_type || i} style={styles.ledgerRow}>
                        <Text style={styles.ledgerLabel} numberOfLines={1}>{line.label}</Text>
                        <View style={styles.ledgerBarBg}>
                          <View style={[styles.ledgerBarFill, { width: `${Math.min(100, Number(line.percentage) || 0)}%` }]} />
                        </View>
                        <Text style={styles.ledgerAmount}>{formatINR(Number(line.amount))} · {Number(line.percentage)}%</Text>
                      </View>
                    ))
                  ) : (
                    <ActivityIndicator color={COLORS.oceanBlue} />
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.foam },

  header: { padding: SPACING.md, backgroundColor: COLORS.deepOcean },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: FONT_SIZE.xs, color: COLORS.sand, marginTop: 4, lineHeight: 17 },

  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, margin: SPACING.md, marginBottom: 0, ...SHADOWS.sm },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  ref: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.gray[400], letterSpacing: 0.5 },
  statusChip: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  statusText: { color: COLORS.white, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  expTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.deepNavy },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs, alignItems: 'center' },
  meta: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  metaStrong: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.seaGreen },

  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm, flexWrap: 'wrap' },
  linkBtn: { paddingVertical: 6 },
  linkBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.oceanBlue },
  payBtn: { backgroundColor: COLORS.seaGreen, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: BORDER_RADIUS.md },
  payBtnText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '800' },
  cancelBtn: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.lightCoral },
  cancelBtnText: { color: COLORS.coral, fontSize: FONT_SIZE.xs, fontWeight: '700' },

  ledgerBox: { backgroundColor: COLORS.lightGreen, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm, minHeight: 44 },
  ledgerRow: { marginBottom: SPACING.xs },
  ledgerLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.deepNavy },
  ledgerBarBg: { height: 7, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 4, overflow: 'hidden', marginVertical: 3 },
  ledgerBarFill: { height: '100%', backgroundColor: COLORS.seaGreen, borderRadius: 4 },
  ledgerAmount: { fontSize: 10, color: COLORS.gray[500] },

  empty: { alignItems: 'center', padding: SPACING.xxl },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.deepNavy },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], textAlign: 'center', marginVertical: SPACING.sm, lineHeight: 20 },
  primaryBtn: { backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.xl, marginTop: SPACING.sm },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
});
