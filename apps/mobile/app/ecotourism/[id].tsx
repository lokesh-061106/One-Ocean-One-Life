import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

const MODEL_META: Record<string, { short: string; icon: string; color: string }> = {
  fisher_coastal: { short: 'Fisher-led', icon: '🎣', color: COLORS.oceanBlue },
  nature_tours: { short: 'Nature Tours', icon: '🌿', color: COLORS.seaGreen },
  homestay_food: { short: 'Homestay & Food', icon: '🏠', color: '#F59E0B' },
  ocean_learning: { short: 'Ocean Learning', icon: '🎧', color: '#3B82F6' },
  festival_market: { short: 'Festival & Market', icon: '🎉', color: COLORS.coral },
};

function formatINR(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function ExperienceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<any>(`${ENDPOINTS.ECOTOURISM.EXPERIENCES}${id}/`);
      setItem(data);
      try {
        const rv = await api.get<any>(ENDPOINTS.ECOTOURISM.REVIEWS, { experience: id as string });
        setReviews(rv.results || rv || []);
      } catch {}
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => { load().catch(() => {}); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const unitPrice = item?.booking_price ?? item?.price_min;
  const perUnit = item?.price_unit === 'person' || item?.price_unit === 'student' || !item?.price_unit;
  const total = unitPrice != null ? (perUnit ? Number(unitPrice) * participants : Number(unitPrice)) : null;

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const book = async () => {
    if (item?.blocked_reason) return;
    if (!date) return Alert.alert('Pick a date', 'Choose an experience date.');
    if (!name.trim()) return Alert.alert('Contact', 'Enter your name.');
    if (!phone.trim()) return Alert.alert('Contact', 'Enter your phone number.');;

    setSubmitting(true);
    try {
      const booking = await api.post<any>(ENDPOINTS.ECOTOURISM.BOOKINGS, {
        experience: item.id,
        experience_date: date,
        participants,
        contact_name: name.trim(),
        contact_phone: phone.trim(),
      });
      router.push({
        pathname: '/ecotourism/checkout',
        params: { id: booking.id, ref: booking.booking_ref, amount: String(booking.total_amount) },
      });
    } catch (e: any) {
      Alert.alert('Booking failed', e?.message || 'Could not create the booking. Please try again.');
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

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🌊</Text>
        <Text style={styles.emptyText}>Experience not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = MODEL_META[item.model_category] || MODEL_META.fisher_coastal;
  const splitLines: any[] = item.split_preview || [];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroFallback, { backgroundColor: meta.color + '20' }]}>
            <Text style={styles.heroEmoji}>{meta.icon}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: meta.color + '18' }]}>
              <Text style={[styles.chipText, { color: meta.color }]}>{meta.icon} {meta.short}</Text>
            </View>
            {item.is_offshore ? (
              <View style={[styles.chip, { backgroundColor: COLORS.lightCoral }]}>
                <Text style={[styles.chipText, { color: COLORS.coral }]}>🚤 Offshore</Text>
              </View>
            ) : (
              <View style={[styles.chip, { backgroundColor: COLORS.lightGreen }]}>
                <Text style={[styles.chipText, { color: COLORS.seaGreen }]}>🌱 Shore-based</Text>
              </View>
            )}
            {item.blocked_reason ? (
              <View style={[styles.chip, { backgroundColor: COLORS.warning }]}>
                <Text style={[styles.chipText, { color: COLORS.white }]}>⛔ Ban window</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{item.name}</Text>

          <View style={styles.metaRow}>
            {item.rating > 0 && (
              <Text style={styles.metaStrong}>★ {Number(item.rating).toFixed(1)} ({item.total_reviews || 0})</Text>
            )}
            {item.village_name ? (
              <Text style={styles.meta}>📍 {[item.village_name, item.district_name].filter(Boolean).join(', ')}</Text>
            ) : null}
            {item.duration ? <Text style={styles.meta}>⏱ {item.duration}</Text> : null}
            {item.max_participants ? <Text style={styles.meta}>👥 ≤ {item.max_participants}</Text> : null}
          </View>

          {item.blocked_reason ? (
            <View style={styles.blockedBox}>
              <Text style={styles.blockedTitle}>Temporarily unavailable</Text>
              <Text style={styles.blockedText}>{item.blocked_reason}</Text>
            </View>
          ) : null}

          {item.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this experience</Text>
              <HtmlText html={item.description} style={styles.body} paragraphSpacing={8} />
            </View>
          ) : null}

          {!!item.highlights?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              {item.highlights.map((h: string) => (
                <View key={h} style={styles.listRow}>
                  <Text style={styles.listCheck}>✓</Text>
                  <Text style={styles.listText}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {!!item.inclusions?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What&apos;s included</Text>
              {item.inclusions.map((h: string) => (
                <View key={h} style={styles.listRow}>
                  <Text style={styles.listCheck}>✓</Text>
                  <Text style={styles.listText}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {item.meeting_point ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meeting point</Text>
              <Text style={styles.body}>{item.meeting_point}</Text>
            </View>
          ) : null}

          {/* Transparent split */}
          {!!splitLines.length && (
            <View style={styles.splitBox}>
              <Text style={styles.splitTitle}>🛡 Where your money goes</Text>
              <Text style={styles.splitSub}>On the {formatINR(unitPrice)} price:</Text>
              {splitLines.map((line) => (
                <View key={line.recipient_type} style={styles.splitRow}>
                  <View style={styles.splitRowHead}>
                    <Text style={styles.splitLabel}>{line.label}</Text>
                    <Text style={styles.splitAmount}>
                      {formatINR(Number(line.amount))} ({Number(line.percentage)}%)
                    </Text>
                  </View>
                  <View style={styles.splitBarBg}>
                    <View style={[styles.splitBarFill, { width: `${Math.min(100, Number(line.percentage))}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.length ? (
              reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <Text style={styles.reviewName}>{r.user_name || 'Traveller'}</Text>
                    <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}<Text style={{ color: COLORS.gray[300] }}>{'★'.repeat(5 - r.rating)}</Text></Text>
                  </View>
                  {r.title ? <Text style={styles.reviewTitle}>{r.title}</Text> : null}
                  {r.comment ? <Text style={styles.reviewBody}>{r.comment}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.body}>No reviews yet — be the first to book and share your story.</Text>
            )}
          </View>

          {/* Booking form */}
          {!item.blocked_reason && unitPrice != null && (
            <View style={styles.bookBox}>
              <View style={styles.bookPriceRow}>
                <View>
                  <Text style={styles.bookPriceLabel}>Price</Text>
                  <Text style={styles.bookPrice}>
                    {formatINR(unitPrice)}
                    <Text style={styles.bookPriceUnit}>/{item.price_unit === 'student' ? 'student' : item.price_unit === 'night' ? 'night' : item.price_unit === 'boat' ? 'boat' : 'person'}</Text>
                  </Text>
                </View>
                {total != null && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bookPriceLabel}>Estimate</Text>
                    <Text style={styles.bookTotal}>{formatINR(total)}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.fieldLabel}>Date *</Text>
              <TextInput
                style={styles.input}
                placeholder={`YYYY-MM-DD (e.g. ${minDate})`}
                placeholderTextColor={COLORS.gray[400]}
                value={date}
                onChangeText={setDate}
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>{perUnit ? 'Participants' : 'Group size'}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setParticipants((p) => Math.max(1, p - 1))}>
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{participants}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setParticipants((p) => Math.min(item.max_participants || 100, p + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Contact name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor={COLORS.gray[400]}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.fieldLabel}>Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor={COLORS.gray[400]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.bookBtn, submitting && { opacity: 0.6 }]}
                onPress={book}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.bookBtnText}>
                    Reserve & pay — {total != null ? formatINR(total) : ''}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={styles.bookNote}>
                {"You'll review the transparent money split before paying."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.foam },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], marginBottom: SPACING.sm },
  backLink: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '600' },

  heroImage: { width: '100%', height: 220, resizeMode: 'cover' },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 72 },

  content: { padding: SPACING.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  chip: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  chipText: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.deepNavy, lineHeight: 32 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  meta: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  metaStrong: { fontSize: FONT_SIZE.xs, color: COLORS.deepNavy, fontWeight: '700' },

  blockedBox: { backgroundColor: '#FFFBEB', borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: '#FDE68A', padding: SPACING.md, marginTop: SPACING.md },
  blockedTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: '#92400E' },
  blockedText: { fontSize: FONT_SIZE.xs, color: '#A16207', marginTop: 4, lineHeight: 17 },

  section: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.deepNavy, marginBottom: SPACING.sm },
  body: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], lineHeight: 21 },
  listRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm, alignItems: 'flex-start' },
  listCheck: { color: COLORS.seaGreen, fontWeight: '800', fontSize: FONT_SIZE.sm },
  listText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.gray[600], lineHeight: 20 },

  splitBox: { backgroundColor: COLORS.lightGreen, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg },
  splitTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.deepNavy },
  splitSub: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 2, marginBottom: SPACING.sm },
  splitRow: { marginBottom: SPACING.sm },
  splitRowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  splitLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.deepNavy },
  splitAmount: { fontSize: FONT_SIZE.xs, fontWeight: '800', color: COLORS.deepNavy },
  splitBarBg: { height: 7, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 4, overflow: 'hidden' },
  splitBarFill: { height: '100%', backgroundColor: COLORS.seaGreen, borderRadius: 4 },

  reviewCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  reviewStars: { fontSize: FONT_SIZE.sm, color: '#F59E0B' },
  reviewTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.deepNavy },
  reviewBody: { fontSize: FONT_SIZE.xs, color: COLORS.gray[600], marginTop: 2, lineHeight: 18 },

  bookBox: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg, ...SHADOWS.md },
  bookPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.sm, marginBottom: SPACING.md },
  bookPriceLabel: { fontSize: 10, fontWeight: '800', color: COLORS.gray[400], textTransform: 'uppercase', letterSpacing: 1 },
  bookPrice: { fontSize: 26, fontWeight: '800', color: COLORS.deepNavy },
  bookPriceUnit: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], fontWeight: '600' },
  bookTotal: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.seaGreen },

  fieldLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.gray[600], marginBottom: 4, marginTop: SPACING.sm },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10, fontSize: FONT_SIZE.sm, color: COLORS.text, backgroundColor: COLORS.white },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', alignSelf: 'flex-start' },
  stepBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, backgroundColor: COLORS.foam },
  stepBtnText: { fontSize: FONT_SIZE.lg, color: COLORS.oceanBlue, fontWeight: '700' },
  stepValue: { paddingHorizontal: SPACING.lg, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },

  bookBtn: { backgroundColor: COLORS.seaGreen, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.md },
  bookBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '800' },
  bookNote: { fontSize: 10, color: COLORS.gray[400], textAlign: 'center', marginTop: SPACING.sm },
});
