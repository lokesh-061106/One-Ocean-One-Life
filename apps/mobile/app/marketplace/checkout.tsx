import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useMarketplaceStore } from '@/stores/marketplaceStore';
import { useCreateOrder } from '@/hooks/useMarketplace';

const PAYMENT_METHODS = [
  { id: 'upi_gpay', label: 'Google Pay', icon: '💳' },
  { id: 'upi_phonepe', label: 'PhonePe', icon: '💳' },
  { id: 'upi_paytm', label: 'Paytm', icon: '💳' },
  { id: 'upi_bhim', label: 'BHIM', icon: '💳' },
  { id: 'upi_amazon', label: 'Amazon Pay', icon: '💳' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
];

export default function CheckoutScreen() {
  const { cart, getCartTotal, clearCart } = useMarketplaceStore();
  const { createOrder, loading } = useCreateOrder();
  const insets = useSafeAreaInsets();
  const [paymentMethod, setPaymentMethod] = useState('upi_gpay');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'details' | 'payment' | 'confirm'>('details');

  const total = getCartTotal();
  const shipping = total > 500 ? 0 : 49;
  const grandTotal = total + shipping;

  const handleSubmit = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your shipping address');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      const order = (await createOrder({
        payment_method: paymentMethod,
        shipping_address: address,
        shipping_phone: phone,
        notes,
        items: cart.map((item) => ({
          product: item.product_id,
          quantity: item.quantity,
        })),
      })) as any;
      Alert.alert('Order Placed!', `Order ${order.order_number} has been created.`, [
        { text: 'View Orders', onPress: () => router.push('/marketplace/orders') },
        { text: 'OK', onPress: () => router.push('/') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to place order');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.steps}>
          <View style={[styles.step, step === 'details' && styles.stepActive]}>
            <Text style={[styles.stepText, step === 'details' && styles.stepTextActive]}>1. Details</Text>
          </View>
          <View style={[styles.step, step === 'payment' && styles.stepActive]}>
            <Text style={[styles.stepText, step === 'payment' && styles.stepTextActive]}>2. Payment</Text>
          </View>
          <View style={[styles.step, step === 'confirm' && styles.stepActive]}>
            <Text style={[styles.stepText, step === 'confirm' && styles.stepTextActive]}>3. Confirm</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {step === 'details' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter your full address..."
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.sectionTitle}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number for delivery"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.sectionTitle}>Order Notes (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Any special instructions..."
              value={notes}
              onChangeText={setNotes}
            />
            <TouchableOpacity style={styles.nextButton} onPress={() => setStep('payment')}>
              <Text style={styles.nextButtonText}>Continue to Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'payment' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[styles.paymentOption, paymentMethod === method.id && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <Text style={[styles.paymentLabel, paymentMethod === method.id && styles.paymentLabelActive]}>
                  {method.label}
                </Text>
                {paymentMethod === method.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.nextButton} onPress={() => setStep('confirm')}>
              <Text style={styles.nextButtonText}>Review Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            {cart.map((item) => (
              <View key={item.product_id} style={styles.summaryItem}>
                <Text style={styles.summaryName} numberOfLines={1}>{item.name} × {item.quantity}</Text>
                <Text style={styles.summaryPrice}>₹{((item.discount_price || item.price) * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</Text>
            </View>
            {shipping > 0 && (
              <Text style={styles.freeShippingNote}>Free shipping on orders over ₹500</Text>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment</Text>
              <Text style={styles.summaryValue}>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery to</Text>
              <Text style={[styles.summaryValue, { flex: 1, marginLeft: SPACING.sm }]} numberOfLines={2}>{address}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitText}>Place Order • ₹{grandTotal.toFixed(2)}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  header: { backgroundColor: COLORS.deepOcean, padding: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.white, marginBottom: SPACING.md },
  steps: { flexDirection: 'row', gap: SPACING.sm },
  step: { flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  stepActive: { backgroundColor: COLORS.oceanBlue },
  stepText: { fontSize: FONT_SIZE.xs, color: COLORS.white, opacity: 0.7 },
  stepTextActive: { opacity: 1, fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, borderWidth: 1, borderColor: COLORS.gray[200], marginBottom: SPACING.sm },
  textArea: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, borderWidth: 1, borderColor: COLORS.gray[200], marginBottom: SPACING.sm, minHeight: 80, textAlignVertical: 'top' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 2, borderColor: COLORS.gray[200] },
  paymentOptionActive: { borderColor: COLORS.oceanBlue, backgroundColor: '#F0F9FF' },
  paymentIcon: { fontSize: 20, marginRight: SPACING.md },
  paymentLabel: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.deepNavy },
  paymentLabelActive: { fontWeight: '600' },
  checkmark: { fontSize: FONT_SIZE.lg, color: COLORS.oceanBlue, fontWeight: 'bold' },
  nextButton: { backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xxl },
  nextButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  summaryName: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.gray[700] },
  summaryPrice: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy },
  summaryDivider: { height: 1, backgroundColor: COLORS.gray[200], marginVertical: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: FONT_SIZE.md, color: COLORS.gray[600] },
  summaryValue: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy },
  freeShippingNote: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, marginBottom: SPACING.sm },
  totalLabel: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.deepNavy },
  totalValue: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.seaGreen },
  submitButton: { backgroundColor: COLORS.seaGreen, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xxl },
  submitText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '600' },
  disabledButton: { backgroundColor: COLORS.gray[300] },
});
