import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

function formatINR(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function EcotourismPackageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pkg, setPkg] = useState<any>(null);
  const [families, setFamilies] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState(2);
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<any>(`${ENDPOINTS.ECOTOURISM.PACKAGES}${id}/`);
      setPkg(data);
      try {
        const fam = await api.get<any>(ENDPOINTS.ECOTOURISM.FAMILIES, { package: id as string });
        setFamilies(fam.results || fam || []);
      } catch {}
      try {
        const rv = await api.get<any>(ENDPOINTS.ECOTOURISM.REVIEWS, { package: id as string });
        setReviews(rv.results || rv || []);
      } catch {}
    } catch {
      setPkg(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => { load().catch(() => {}); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const total = pkg?.price != null ? Number(pkg.price) * participants : null;

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const book = async () => {
    if (!date) return Alert.alert('Pick a date', `Enter a date (YYYY-MM-DD), e.g. ${minDate}.`);
    setSubmitting(true);
    try {
      const booking = await api.post<any>(ENDPOINTS.ECOTOURISM.BOOKINGS, {
        package: pkg.id,
        experience_date: date,
        participants,
        contact_name: pkg.provider_name || 'Traveller',
        contact_phone: '',
      });
      router.push({
        pathname: '/ecotourism/checkout',
        params: { id: booking.id, ref: booking.booking_ref, amount: String(booking.total_amount) },
      });
    } catch (e: any) {
      Alert.alert('Booking failed', e?.message || 'Could not create the booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
      </View>
    );
  }

  if (!pkg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyText}>Package not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const itinerary: any[] = pkg.itinerary || [];
  const splitLines: any[] = pkg.split_preview || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pkgChip}>
          <Text style={styles.pkgChipText}>📦 O3L Package · {pkg.duration_text}</Text>
        </View>
        <Text style={styles.title}>{pkg.title}</Text>
        <View style={styles.metaRow}>
          {pkg.rating > 0 && <Text style={styles.metaStrong}>★ {Number(pkg.rating).toFixed(1)} ({pkg.total_reviews || 0})</Text>}
          {pkg.family_count ? <Text style={styles.meta}>👨‍👩‍👧 {pkg.family_count} fishing families</Text> : null}
          {pkg.rating > 0 ? null : <Text style={styles.meta}>New package</Text>}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(pkg.price)}</Text>
          <Text style={styles.priceUnit}>/person</Text>
        </View>
      </View>

      <View style={styles.content}>
        {pkg.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What&apos;s inside</Text>
            <HtmlText html={pkg.description} style={styles.body} paragraphSpacing={8} />
          </View>
        ) : null}

        {!!itinerary.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Day-by-day</Text>
            {itinerary.map((step, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineDot}>
                  <Text style={styles.timelineDay}>{step.day ?? i + 1}</Text>
                </View>
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineTitle}>{step.title}</Text>
                  {step.detail ? <Text style={styles.timelineDetail}>{step.detail}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {!!splitLines.length && (
          <View style={styles.splitBox}>
            <Text style={styles.splitTitle}>🛡 Where your money goes</Text>
            {splitLines.map((line) => (
              <View key={line.recipient_type} style={styles.splitRow}>
                <View style={styles.splitRowHead}>
                  <Text style={styles.splitLabel}>{line.label}</Text>
                  <Text style={styles.splitAmount}>{formatINR(Number(line.amount))} ({Number(line.percentage)}%)</Text>
                </View>
                <View style={styles.splitBarBg}>
                  <View style={[styles.splitBarFill, { width: `${Math.min(100, Number(line.percentage))}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {!!families.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Families you&apos;ll support</Text>
            {families.map((f) => (
              <View key={f.id} style={styles.familyCard}>
                <Text style={styles.familyName}>⚓ {f.name}</Text>
                {f.village ? <Text style={styles.familyVillage}>📍 {f.village}</Text> : null}
                {f.story ? <Text style={styles.familyStory} numberOfLines={3}>{f.story}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {!!reviews.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewName}>{r.user_name || 'Traveller'}</Text>
                  <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}</Text>
                </View>
                {r.comment ? <Text style={styles.reviewBody}>{r.comment}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Booking */}
        <View style={styles.bookBox}>
          <View style={styles.bookPriceRow}>
            <Text style={styles.bookPriceLabel}>Price per person</Text>
            <Text style={styles.bookPrice}>{formatINR(pkg.price)}</Text>
          </View>

          <Text style={styles.fieldLabel}>Start date (YYYY-MM-DD) *</Text>
          <View style={styles.fakeInput}>
            <Text style={date ? styles.fakeInputText : styles.fakeInputPlaceholder}>{date || `e.g. ${minDate}`}</Text>
          </View>
          <View style={styles.dateChips}>
            {[0, 1, 2].map((offset) => {
              const d = new Date();
              d.setDate(d.getDate() + 1 + offset);
              const iso = d.toISOString().slice(0, 10);
              return (
                <TouchableOpacity
                  key={iso}
                  style={[styles.dateChip, date === iso && styles.dateChipActive]}
                  onPress={() => setDate(iso)}
                >
                  <Text style={[styles.dateChipText, date === iso && styles.dateChipTextActive]}>
                    {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Travellers</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setParticipants((p) => Math.max(1, p - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepValue}>{participants}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setParticipants((p) => Math.min(30, p + 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.estimate}>
            Estimate: <Text style={styles.estimateValue}>{formatINR(total)}</Text>
          </Text>

          <TouchableOpacity style={[styles.bookBtn, submitting && { opacity: 0.6 }]} onPress={book} disabled={submitting} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.bookBtnText}>Reserve package</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.foam },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], marginBottom: SPACING.sm },
  backLink: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '600' },

  header: { backgroundColor: COLORS.deepOcean, padding: SPACING.md, paddingBottom: SPACING.lg },
  pkgChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, marginBottom: SPACING.sm },
  pkgChipText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.white, lineHeight: 32 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  meta: { fontSize: FONT_SIZE.xs, color: COLORS.sand },
  metaStrong: { fontSize: FONT_SIZE.xs, color: COLORS.white, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: SPACING.sm },
  price: { fontSize: 30, fontWeight: '800', color: COLORS.white },
  priceUnit: { fontSize: FONT_SIZE.sm, color: COLORS.sand, marginBottom: 5 },

  content: { padding: SPACING.md },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.deepNavy, marginBottom: SPACING.sm },
  body: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], lineHeight: 21 },

  timelineRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  timelineDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.lightGreen, alignItems: 'center', justifyContent: 'center' },
  timelineDay: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.seaGreen },
  timelineBody: { flex: 1 },
  timelineTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  timelineDetail: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 2, lineHeight: 17 },

  splitBox: { backgroundColor: COLORS.lightGreen, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  splitTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.deepNavy, marginBottom: SPACING.sm },
  splitRow: { marginBottom: SPACING.sm },
  splitRowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  splitLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.deepNavy },
  splitAmount: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.deepNavy },
  splitBarBg: { height: 7, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 4, overflow: 'hidden' },
  splitBarFill: { height: '100%', backgroundColor: COLORS.seaGreen, borderRadius: 4 },

  familyCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  familyName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  familyVillage: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 2 },
  familyStory: { fontSize: FONT_SIZE.xs, color: COLORS.gray[600], marginTop: 4, lineHeight: 17 },

  reviewCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  reviewName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  reviewStars: { fontSize: FONT_SIZE.sm, color: '#F59E0B' },
  reviewBody: { fontSize: FONT_SIZE.xs, color: COLORS.gray[600], lineHeight: 18 },

  bookBox: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.md },
  bookPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.sm, marginBottom: SPACING.sm },
  bookPriceLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], fontWeight: '700' },
  bookPrice: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.deepNavy },

  fieldLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.gray[600], marginTop: SPACING.sm, marginBottom: 4 },
  fakeInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, backgroundColor: COLORS.foam },
  fakeInputText: { fontSize: FONT_SIZE.sm, color: COLORS.deepNavy, fontWeight: '600' },
  fakeInputPlaceholder: { fontSize: FONT_SIZE.sm, color: COLORS.gray[400] },
  dateChips: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm },
  dateChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  dateChipActive: { backgroundColor: COLORS.oceanBlue, borderColor: COLORS.oceanBlue },
  dateChipText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[600], fontWeight: '600' },
  dateChipTextActive: { color: COLORS.white },

  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', alignSelf: 'flex-start' },
  stepBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, backgroundColor: COLORS.foam },
  stepBtnText: { fontSize: FONT_SIZE.lg, color: COLORS.oceanBlue, fontWeight: '700' },
  stepValue: { paddingHorizontal: SPACING.lg, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },

  estimate: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: SPACING.sm },
  estimateValue: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.seaGreen },
  bookBtn: { backgroundColor: COLORS.seaGreen, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.md },
  bookBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '800' },
});
