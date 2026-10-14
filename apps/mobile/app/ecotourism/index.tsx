import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, Image, TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

/* ------------------------------------------------------------------ */
/* 5-model taxonomy (mirrors the web MODEL_META)                       */
/* ------------------------------------------------------------------ */

type ModelKey = 'fisher_coastal' | 'nature_tours' | 'homestay_food' | 'ocean_learning' | 'festival_market';

const MODEL_META: Record<ModelKey, { label: string; short: string; icon: string; color: string }> = {
  fisher_coastal: { label: 'Fisher-led Coastal Experience', short: 'Fisher-led', icon: '🎣', color: COLORS.oceanBlue },
  nature_tours: { label: 'Mangrove, Lagoon & Marine Nature Tours', short: 'Nature Tours', icon: '🌿', color: COLORS.seaGreen },
  homestay_food: { label: 'Fisher Village Homestay & Local Food', short: 'Homestay & Food', icon: '🏠', color: '#F59E0B' },
  ocean_learning: { label: 'Ocean Learning & Blue Experiences', short: 'Ocean Learning', icon: '🎧', color: '#3B82F6' },
  festival_market: { label: 'Weekend Coastal Festival & Marketplace', short: 'Festival & Market', icon: '🎉', color: COLORS.coral },
};

const MODEL_ORDER: ModelKey[] = ['fisher_coastal', 'nature_tours', 'homestay_food', 'ocean_learning', 'festival_market'];

function formatINR(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function priceLabel(item: any): string {
  const unit =
    item?.price_unit === 'person' || item?.price_unit === 'student' ? '/person'
    : item?.price_unit === 'night' ? '/night'
    : item?.price_unit === 'boat' ? '/boat'
    : item?.price_unit === 'group' ? '/group' : '';
  if (item?.price_min != null && item?.price_max != null && String(item.price_min) !== String(item.price_max)) {
    return `${formatINR(item.price_min)} – ${formatINR(item.price_max)}`;
  }
  if (item?.price_min != null) return `${formatINR(item.price_min)}${unit}`;
  return item?.price_range || 'On request';
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function EcotourismScreen() {
  const params = useLocalSearchParams<{ type?: string }>();

  const [models, setModels] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [lean, setLean] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModel, setActiveModel] = useState<ModelKey | null>(null);
  const [query, setQuery] = useState('');
  const [showPackages, setShowPackages] = useState(params.type === 'packages');

  const fetchData = useCallback(async () => {
    try {
      const [m, e, p, ln] = await Promise.allSettled([
        api.get(ENDPOINTS.ECOTOURISM.MODELS),
        api.get(ENDPOINTS.ECOTOURISM.EXPERIENCES, { ordering: '-rating' }),
        api.get(ENDPOINTS.ECOTOURISM.PACKAGES),
        api.get(ENDPOINTS.ECOTOURISM.LEAN_SEASON),
      ]);
      if (m.status === 'fulfilled') setModels((m.value as any).results || m.value || []);
      if (e.status === 'fulfilled') setExperiences((e.value as any).results || e.value || []);
      if (p.status === 'fulfilled') setPackages((p.value as any).results || p.value || []);
      if (ln.status === 'fulfilled') setLean(ln.value);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchData().catch(() => {}); }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  const filtered = useMemo(() => {
    let list = experiences;
    if (activeModel) list = list.filter((x: any) => x.model_category === activeModel);
    if (lean?.active) list = list.filter((x: any) => !x.blocked_reason);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (x: any) =>
          x.name?.toLowerCase().includes(q) ||
          x.description?.toLowerCase().includes(q) ||
          x.village_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [experiences, activeModel, query, lean]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.oceanBlue} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>🌊 Tourism for the fishing community</Text>
        <Text style={styles.heroTitle}>Ecotourism that keeps the ocean&apos;s wealth in the village</Text>
        <Text style={styles.heroSub}>
          Book fisher-led boat trips, mangrove tours, homestays and village festivals —
          so one tourist feeds several households.
        </Text>
        <View style={styles.heroStats}>
          {[
            { v: experiences.length ? `${experiences.length}+` : '—', l: 'Experiences' },
            { v: '5', l: 'Income models' },
            { v: '80%', l: 'To families' },
          ].map((s) => (
            <View key={s.l} style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{s.v}</Text>
              <Text style={styles.heroStatLabel}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Lean season banner */}
      {lean?.active && (
        <TouchableOpacity
          style={styles.leanBanner}
          activeOpacity={0.8}
          onPress={() => setActiveModel('fisher_coastal')}
        >
          <Text style={styles.leanTitle}>🌱 Fishing-ban / lean season is ACTIVE</Text>
          <Text style={styles.leanText} numberOfLines={3}>{lean.message}</Text>
          <Text style={styles.leanCta}>Explore shore-based alternatives →</Text>
        </TouchableOpacity>
      )}

      {/* 5 models */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Five ways a fishing family earns</Text>
        <Text style={styles.sectionSub}>Tap a model to filter the marketplace</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelRow}>
          {MODEL_ORDER.map((key) => {
            const meta = MODEL_META[key];
            const live = models.find((mm) => mm.key === key);
            const active = activeModel === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.modelCard, active && { borderColor: meta.color, borderWidth: 2 }]}
                activeOpacity={0.85}
                onPress={() => setActiveModel(active ? null : key)}
              >
                <View style={[styles.modelIcon, { backgroundColor: meta.color + '20' }]}>
                  <Text style={styles.modelIconText}>{meta.icon}</Text>
                </View>
                <Text style={styles.modelLabel} numberOfLines={2}>{meta.short}</Text>
                <Text style={styles.modelCount}>
                  {live?.experience_count ?? 0} experiences
                  {live?.package_count ? ` · ${live.package_count} pkgs` : ''}
                </Text>
                <Text style={styles.modelPrice}>
                  {live?.min_price ? `from ${formatINR(live.min_price)}` : 'view'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {activeModel && (
          <TouchableOpacity onPress={() => setActiveModel(null)} style={styles.clearFilter}>
            <Text style={styles.clearFilterText}>✕ Clear filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search boats, food, sounds…"
          placeholderTextColor={COLORS.gray[400]}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* View toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, !showPackages && styles.toggleBtnActive]}
          onPress={() => setShowPackages(false)}
        >
          <Text style={[styles.toggleText, !showPackages && styles.toggleTextActive]}>
            Experiences ({filtered.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, showPackages && styles.toggleBtnActive]}
          onPress={() => setShowPackages(true)}
        >
          <Text style={[styles.toggleText, showPackages && styles.toggleTextActive]}>
            Packages ({packages.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: SPACING.xxl }} />
        ) : showPackages ? (
          <FlatList
            data={packages}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={<EmptyState icon="📦" text="No packages published yet" />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/ecotourism/packages/${item.id}`)}
              >
                <View style={styles.pkgBadge}>
                  <Text style={styles.pkgBadgeText}>📦 O3L Package · {MODEL_META[item.model_category as ModelKey]?.short || ''}</Text>
                </View>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                </View>
                {item.description && <HtmlText html={item.description} style={styles.cardText} paragraphSpacing={4} numberOfLines={2} />}
                <View style={styles.cardFooter}>
                  <Text style={styles.priceTag}>{formatINR(item.price)}/person</Text>
                  <Text style={styles.durationTag}>⏱ {item.duration_text}</Text>
                  {item.family_count ? <Text style={styles.familyTag}>👨‍👩‍👧 {item.family_count} families</Text> : null}
                  {item.rating > 0 && <Text style={styles.durationTag}>★ {Number(item.rating).toFixed(1)}</Text>}
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={<EmptyState icon="🌊" text="No experiences match your filters" />}
            renderItem={({ item }) => {
              const meta = MODEL_META[item.model_category as ModelKey] || MODEL_META.fisher_coastal;
              return (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/ecotourism/${item.id}`)}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, styles.cardImageFallback, { backgroundColor: meta.color + '15' }]}>
                      <Text style={styles.cardImageEmoji}>{meta.icon}</Text>
                    </View>
                  )}
                  <View style={styles.modelChipRow}>
                    <View style={[styles.modelChip, { backgroundColor: meta.color + '18' }]}>
                      <Text style={[styles.modelChipText, { color: meta.color }]}>
                        {meta.icon} {meta.short}
                      </Text>
                    </View>
                    {item.blocked_reason ? (
                      <View style={styles.banChip}>
                        <Text style={styles.banChipText}>⛔ Ban window</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                    {item.rating > 0 && (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>★ {Number(item.rating).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  {item.village_name && <Text style={styles.cardLocation}>📍 {item.village_name}{item.district_name ? `, ${item.district_name}` : ''}</Text>}
                  {item.description && <HtmlText html={item.description} style={styles.cardText} paragraphSpacing={4} numberOfLines={2} />}
                  <View style={styles.cardFooter}>
                    <Text style={styles.priceTag}>💰 {priceLabel(item)}</Text>
                    {item.duration && <Text style={styles.durationTag}>⏱ {item.duration}</Text>}
                    {item.max_participants ? <Text style={styles.durationTag}>👥 ≤{item.max_participants}</Text> : null}
                    {item.family_name ? <Text style={styles.familyTag}>⚓ {item.family_name}</Text> : null}
                    {item.is_sustainable && <Text style={styles.sustainableBadge}>♻️ Sustainable</Text>}
                    {item.lean_season_friendly !== false && !item.is_offshore && (
                      <Text style={styles.leanChip}>🌱 Lean-season ready</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* My bookings shortcut */}
      <TouchableOpacity style={styles.bookingsCta} onPress={() => router.push('/ecotourism/bookings')}>
        <Text style={styles.bookingsCtaText}>🎟 My bookings & transparent ledger →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },

  hero: { backgroundColor: COLORS.deepOcean, padding: SPACING.lg, paddingBottom: SPACING.xl },
  heroBadge: { alignSelf: 'flex-start', fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.white, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  heroTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.white, lineHeight: 32 },
  heroSub: { fontSize: FONT_SIZE.sm, color: COLORS.sand, marginTop: SPACING.sm, lineHeight: 20 },
  heroStats: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  heroStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  heroStatValue: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.white },
  heroStatLabel: { fontSize: 10, color: COLORS.sand, marginTop: 2, textAlign: 'center' },

  leanBanner: { backgroundColor: '#FEF3C7', margin: SPACING.md, marginBottom: 0, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  leanTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: '#92400E' },
  leanText: { fontSize: FONT_SIZE.xs, color: '#A16207', marginTop: 4, lineHeight: 17 },
  leanCta: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: '#92400E', marginTop: SPACING.xs },

  section: { paddingTop: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.deepNavy, paddingHorizontal: SPACING.md },
  sectionSub: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], paddingHorizontal: SPACING.md, marginTop: 2 },
  modelRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.sm },
  modelCard: { width: 150, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  modelIcon: { width: 40, height: 40, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  modelIconText: { fontSize: 20 },
  modelLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy, minHeight: 36 },
  modelCount: { fontSize: 10, color: COLORS.gray[500], marginTop: 4 },
  modelPrice: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.seaGreen, marginTop: 2 },
  clearFilter: { alignSelf: 'flex-start', marginLeft: SPACING.md, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  clearFilterText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.oceanBlue },

  searchBox: { paddingHorizontal: SPACING.md, marginTop: SPACING.xs },
  searchInput: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: 10, fontSize: FONT_SIZE.sm, color: COLORS.text },

  toggleRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: COLORS.deepOcean, borderColor: COLORS.deepOcean },
  toggleText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.gray[500] },
  toggleTextActive: { color: COLORS.white },

  content: { padding: SPACING.md },
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardImage: { width: '100%', height: 150, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, resizeMode: 'cover' },
  cardImageFallback: { alignItems: 'center', justifyContent: 'center' },
  cardImageEmoji: { fontSize: 52 },
  modelChipRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xs },
  modelChip: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  modelChipText: { fontSize: 10, fontWeight: '700' },
  banChip: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.warning },
  banChipText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs, gap: SPACING.sm },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, flex: 1 },
  cardLocation: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], marginBottom: SPACING.xs },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], marginBottom: SPACING.sm, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm, alignItems: 'center' },
  priceTag: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, fontWeight: '700' },
  durationTag: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  familyTag: { fontSize: FONT_SIZE.xs, color: COLORS.coral, fontWeight: '600' },
  sustainableBadge: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, backgroundColor: COLORS.lightGreen, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  leanChip: { fontSize: FONT_SIZE.xs, color: '#A16207', backgroundColor: '#FEF3C7', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  ratingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  ratingText: { fontSize: FONT_SIZE.xs, color: COLORS.deepNavy, fontWeight: '600' },

  pkgBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.lightGreen, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full, marginBottom: SPACING.xs },
  pkgBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.seaGreen },

  bookingsCta: { marginHorizontal: SPACING.md, marginBottom: SPACING.xl, backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOWS.md },
  bookingsCtaText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },

  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], textAlign: 'center', paddingHorizontal: SPACING.lg },
});
