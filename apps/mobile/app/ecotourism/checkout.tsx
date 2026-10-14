import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

function formatINR(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

type PayOrder = {
  mode: string;
  order_id: string;
  amount: number;
  currency?: string;
  key_id?: string;
  booking_ref?: string;
};

export default function EcotourismCheckoutScreen() {
  const { id, ref, amount } = useLocalSearchParams<{ id: string; ref: string; amount?: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [webOrder, setWebOrder] = useState<PayOrder | null>(null);

  const load = useCallback(async () => {
    try {
      const mine = await api.get<any>(ENDPOINTS.ECOTOURISM.MY_BOOKINGS);
      const list: any[] = mine.results || mine || [];
      const found = list.find((b) => String(b.id) === String(id) || b.booking_ref === ref);
      if (found) setBooking(found);
      try {
        const led = await api.get<any>(`${ENDPOINTS.ECOTOURISM.BOOKINGS}${id}/ledger/`);
        setLedger(led.payouts || led.lines || []);
      } catch {}
    } catch {
      Alert.alert('Error', 'Could not load your booking.');
    } finally {
      setLoading(false);
    }
  }, [id, ref]);

  useEffect(() => {
    const t = setTimeout(() => { load().catch(() => {}); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const total = Number(booking?.total_amount ?? amount ?? 0);

  const verify = async (paymentId: string, orderId: string, signature: string) => {
    try {
      const v = await api.post<any>(`${ENDPOINTS.ECOTOURISM.BOOKINGS}${id}/verify/`, {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      });
      if (v?.status === 'success' || v?.booking?.payment_status === 'paid') {
        setDone(true);
        load();
        return true;
      }
      Alert.alert('Payment', 'Payment could not be confirmed. Please retry.');
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message || 'Could not verify the payment.');
    }
    return false;
  };

  const pay = async () => {
    setPaying(true);
    try {
      const order = await api.post<PayOrder>(`${ENDPOINTS.ECOTOURISM.BOOKINGS}${id}/pay/`, {});
      if (order.mode === 'demo') {
        await verify(`pay_demo_${Date.now()}`, order.order_id, 'demo_signature');
      } else {
        setWebOrder(order);
      }
    } catch (e: any) {
      Alert.alert('Payment failed', e?.message || 'Could not start payment.');
    } finally {
      setPaying(false);
    }
  };

  const cancel = () => {
    Alert.alert('Cancel booking?', 'Your booking will be cancelled.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`${ENDPOINTS.ECOTOURISM.BOOKINGS}${id}/cancel/`, {});
            router.replace('/ecotourism/bookings');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not cancel.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Booking confirmed!</Text>
        <Text style={styles.successText}>
          Your payment of {formatINR(total)} was received. 80% goes directly to the fishing family —
          your split is logged in the public ledger.
        </Text>
        <Text style={styles.successRef}>Ref: {booking?.booking_ref || ref}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/ecotourism/bookings')}>
          <Text style={styles.primaryBtnText}>View my bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => router.replace('/ecotourism')}>
          <Text style={styles.ghostBtnText}>Back to ecotourism</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successIcon}>🔍</Text>
        <Text style={styles.emptyText}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.replace('/ecotourism/bookings')}>
          <Text style={styles.link}>Go to my bookings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = booking.status || 'pending';
  const isPaid = booking.payment_status === 'paid' || status === 'paid';

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking summary</Text>
          <Row label="Reference" value={booking.booking_ref || ref} />
          <Row label="Experience" value={booking.experience_name || booking.package_title || '—'} />
          <Row label="Date" value={booking.experience_date || '—'} />
          <Row label="Travellers" value={String(booking.participants || '—')} />
          <Row label="Status" value={`${status} · ${booking.payment_status || 'unpaid'}`} highlight={isPaid} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatINR(booking.total_amount ?? total)}</Text>
          </View>
        </View>

        {/* Transparent split preview */}
        {!!ledger.length && (
          <View style={styles.ledgerCard}>
            <Text style={styles.ledgerTitle}>🛡 Where your {formatINR(booking.total_amount ?? total)} goes</Text>
            {ledger.map((line, i) => (
              <View key={line.recipient_type || i} style={styles.ledgerRow}>
                <View style={styles.ledgerBarWrap}>
                  <Text style={styles.ledgerLabel}>{line.label}</Text>
                  <View style={styles.ledgerBarBg}>
                    <View style={[styles.ledgerBarFill, { width: `${Math.min(100, Number(line.percentage) || 0)}%` }]} />
                  </View>
                </View>
                <View style={styles.ledgerAmounts}>
                  <Text style={styles.ledgerAmount}>{formatINR(Number(line.amount))}</Text>
                  <Text style={styles.ledgerPct}>{Number(line.percentage)}%</Text>
                </View>
              </View>
            ))}
            <Text style={styles.ledgerNote}>
              Conservation share absorbs rounding so the four lines always add up exactly.
            </Text>
          </View>
        )}

        {!isPaid ? (
          <View style={styles.payBox}>
            <TouchableOpacity style={styles.payBtn} onPress={pay} disabled={paying} activeOpacity={0.85}>
              {paying ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.payBtnText}>Pay {formatINR(booking.total_amount ?? total)}</Text>}
            </TouchableOpacity>
            <Text style={styles.payNote}>Razorpay · UPI, cards & netbanking · 256-bit encrypted</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancel} disabled={paying}>
              <Text style={styles.cancelBtnText}>Cancel booking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.paidBox}>
            <Text style={styles.paidText}>✅ Paid — {formatINR(booking.total_amount ?? total)}</Text>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => router.replace('/ecotourism/bookings')}>
              <Text style={styles.ghostBtnText}>View my bookings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Live Razorpay checkout inside a WebView */}
      <Modal visible={!!webOrder} animationType="slide" onRequestClose={() => setWebOrder(null)}>
        <View style={styles.webHeader}>
          <Text style={styles.webHeaderTitle}>Secure payment</Text>
          <TouchableOpacity onPress={() => setWebOrder(null)} style={styles.webClose}>
            <Text style={styles.webCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        {webOrder && (
          <WebView
            originWhitelist={['*']}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webLoading}>
                <ActivityIndicator size="large" color={COLORS.oceanBlue} />
              </View>
            )}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                setWebOrder(null);
                if (data.dismissed || !data.razorpay_payment_id) return;
                verify(
                  data.razorpay_payment_id,
                  data.razorpay_order_id || webOrder.order_id,
                  data.razorpay_signature || ''
                );
              } catch {}
            }}
            source={{ html: buildRazorpayHtml(webOrder, booking) }}
          />
        )}
      </Modal>
    </>
  );
}

function buildRazorpayHtml(order: PayOrder, booking: any): string {
  const amountPaise = Math.round(Number(order.amount) * 100);
  const prefillName = booking?.contact_name || '';
  const prefillContact = booking?.contact_phone || '';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="background:#0B1B2B;margin:0;display:flex;align-items:center;justify-content:center;height:100vh;">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
(function () {
  function open() {
    if (!window.Razorpay) { setTimeout(open, 200); return; }
    var rzp = new Razorpay({
      key: ${JSON.stringify(order.key_id || '')},
      amount: ${amountPaise},
      currency: 'INR',
      order_id: ${JSON.stringify(order.order_id)},
      name: 'One Ocean • One Life',
      description: ${JSON.stringify(booking?.experience_name || booking?.package_title || 'Ecotourism booking')},
      prefill: { name: ${JSON.stringify(prefillName)}, contact: ${JSON.stringify(prefillContact)} },
      theme: { color: '#0E7C7B' },
      handler: function (res) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          razorpay_payment_id: res.razorpay_payment_id,
          razorpay_order_id: res.razorpay_order_id,
          razorpay_signature: res.razorpay_signature
        }));
      },
      modal: { ondismiss: function () { window.ReactNativeWebView.postMessage(JSON.stringify({ dismissed: true })); } }
    });
    rzp.open();
  }
  open();
})();
</script>
</body>
</html>`;
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && { color: COLORS.seaGreen, fontWeight: '800' }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam, padding: SPACING.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.foam, padding: SPACING.xl },

  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.deepNavy, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm },
  rowLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  rowValue: { fontSize: FONT_SIZE.xs, color: COLORS.deepNavy, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, marginTop: SPACING.xs },
  totalLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  totalValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.deepNavy },

  ledgerCard: { backgroundColor: COLORS.lightGreen, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md },
  ledgerTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.deepNavy, marginBottom: SPACING.sm },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  ledgerBarWrap: { flex: 1 },
  ledgerLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.deepNavy, marginBottom: 4 },
  ledgerBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 4, overflow: 'hidden' },
  ledgerBarFill: { height: '100%', backgroundColor: COLORS.seaGreen, borderRadius: 4 },
  ledgerAmounts: { width: 84, alignItems: 'flex-end' },
  ledgerAmount: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.deepNavy },
  ledgerPct: { fontSize: 10, color: COLORS.gray[500] },
  ledgerNote: { fontSize: 10, color: COLORS.gray[500], marginTop: 4, lineHeight: 15 },

  payBox: { marginTop: SPACING.md, gap: SPACING.sm },
  payBtn: { backgroundColor: COLORS.seaGreen, borderRadius: BORDER_RADIUS.md, paddingVertical: 15, alignItems: 'center', ...SHADOWS.md },
  payBtnText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '800' },
  payNote: { fontSize: 10, color: COLORS.gray[400], textAlign: 'center' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: COLORS.coral, fontSize: FONT_SIZE.sm, fontWeight: '600' },

  paidBox: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md, alignItems: 'center', ...SHADOWS.sm },
  paidText: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.seaGreen, marginBottom: SPACING.sm },

  successIcon: { fontSize: 64, marginBottom: SPACING.md },
  successTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.deepNavy },
  successText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], textAlign: 'center', marginTop: SPACING.sm, lineHeight: 21 },
  successRef: { fontSize: FONT_SIZE.xs, color: COLORS.gray[400], marginTop: SPACING.sm, fontWeight: '600' },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], marginBottom: SPACING.md },
  link: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '700' },

  primaryBtn: { backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.md, paddingVertical: 13, paddingHorizontal: SPACING.xl, marginTop: SPACING.lg, alignItems: 'center' },
  primaryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZE.sm },
  ghostBtn: { paddingVertical: SPACING.sm, alignItems: 'center' },
  ghostBtnText: { color: COLORS.oceanBlue, fontSize: FONT_SIZE.sm, fontWeight: '600' },

  webHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.deepOcean, paddingHorizontal: SPACING.md, paddingTop: 50, paddingBottom: SPACING.sm },
  webHeaderTitle: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  webClose: { padding: SPACING.sm },
  webCloseText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
  webLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.foam },
});
