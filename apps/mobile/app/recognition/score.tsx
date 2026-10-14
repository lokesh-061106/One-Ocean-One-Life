import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS, GRADIENTS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + (target - from) * eased;
      fromRef.current = next;
      setValue(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return Math.round(value);
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));

/* ------------------------------------------------------------------ */
/* screen                                                              */
/* ------------------------------------------------------------------ */
export default function ScoreScreen() {
  const [score, setScore] = useState<any>(null);
  const [rank, setRank] = useState<any>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [me, myRank, awardList, cat] = await Promise.all([
        api.get(ENDPOINTS.RECOGNITION.SCORES_ME).catch(() => null),
        api.get(ENDPOINTS.RECOGNITION.RANK_ME).catch(() => null),
        api.get(ENDPOINTS.RECOGNITION.AWARDS_ME).catch(() => []),
        api.get(ENDPOINTS.RECOGNITION.CATALOGUE).catch(() => []),
      ]);
      setScore(me);
      setRank(myRank);
      setAwards(Array.isArray(awardList) ? awardList : (awardList as any)?.results || []);
      setCatalogue(Array.isArray(cat) ? cat : (cat as any)?.results || []);
      setError(me ? null : 'Sign in to see your live scoreboard card.');
    } catch {
      setError('Could not load your score right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const total = useCountUp(score?.total_score || 0);
  const earnings = useCountUp(score?.earnings_inr || 0, 700);

  const verified = score?.verified_contributions || 0;
  const tierInfo = score?.tier_info || { name: 'New Explorer', icon: '🌊', color: COLORS.oceanBlue };
  const nextTier = score?.next_tier;
  const tierProgress = score?.next_tier_progress ?? 0;
  const gateProgress = score?.marketplace_progress ?? 0;
  const gateEligible = !!score?.marketplace_eligible;
  const badges: string[] = score?.badges || [];

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
        <Text style={styles.loadingText}>Crunching your B × Q × V × I…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.oceanBlue} />
      }
    >
      {/* ---------------- hero score ---------------- */}
      <Animated.View entering={FadeIn.duration(400)}>
        <LinearGradient colors={GRADIENTS.ocean} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroLabel}>YOUR CONTRIBUTION SCORE</Text>
          <Text style={styles.heroValue}>{fmt(total)}</Text>
          <View style={styles.tierChip}>
            <Text style={styles.tierChipText}>
              {tierInfo.icon} {tierInfo.name} tier
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{verified}</Text>
              <Text style={styles.heroStatLabel}>verified</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>₹{fmt(earnings)}</Text>
              <Text style={styles.heroStatLabel}>earned</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {rank?.state_rank ? `#${rank.state_rank}` : '—'}
              </Text>
              <Text style={styles.heroStatLabel}>{rank?.state || 'state'} rank</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {error && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      <View style={styles.content}>
        {/* ---------------- formula ---------------- */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Final Score = B × Q × V × I</Text>
          <Text style={styles.cardSubtitle}>
            Base points from the catalogue, multiplied by quality, verification and impact.
          </Text>
          <View style={styles.formulaRow}>
            {[
              { k: 'B', v: 'base', hint: 'per type' },
              { k: 'Q', v: (score?.quality_average || 0).toFixed(2), hint: 'quality' },
              { k: 'V', v: 'verify', hint: '0.5–2.0' },
              { k: 'I', v: 'impact', hint: '1.0–2.0' },
            ].map((f, i) => (
              <Animated.View key={f.k} entering={FadeInDown.delay(140 + i * 60).duration(350)} style={styles.formulaBox}>
                <Text style={styles.formulaLetter}>{f.k}</Text>
                <Text style={styles.formulaValue}>{f.v}</Text>
                <Text style={styles.formulaHint}>{f.hint}</Text>
              </Animated.View>
            ))}
          </View>
          <View style={styles.qualityRow}>
            <Text style={styles.qualityLabel}>Quality average (Q)</Text>
            <Text style={styles.qualityValue}>{(score?.quality_average || 0).toFixed(2)} / 1.50</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(((score?.quality_average || 0) / 1.5) * 100, 100)}%`,
                  backgroundColor: COLORS.oceanBlue,
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* ---------------- tier + marketplace gate ---------------- */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.card}>
          <View style={styles.splitHeader}>
            <Text style={styles.cardTitle}>Next milestone</Text>
            <Text style={styles.splitValue}>
              {nextTier ? `${nextTier.icon} ${nextTier.name}` : 'Top tier'}
            </Text>
          </View>
          <View style={styles.splitHeader}>
            <Text style={styles.progressCaption}>{verified} verified</Text>
            <Text style={styles.progressPercent}>{Math.round(tierProgress)}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${tierProgress}%`, backgroundColor: nextTier?.color || COLORS.seaGreen },
              ]}
            />
          </View>
          <Text style={styles.progressNote}>
            {nextTier ? `${nextTier.unlocks}` : 'Every tier unlocked — keep contributing.'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.splitHeader}>
            <Text style={styles.cardTitle}>Marketplace gate</Text>
            <Text style={[styles.splitValue, gateEligible && styles.good]}>
              {gateEligible ? 'ELIGIBLE' : `${score?.marketplace_threshold ?? 25} needed`}
            </Text>
          </View>
          <View style={styles.splitHeader}>
            <Text style={styles.progressCaption}>{verified} verified contributions</Text>
            <Text style={styles.progressPercent}>{Math.round(gateProgress)}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${gateProgress}%`,
                  backgroundColor: gateEligible ? COLORS.seaGreen : COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.progressNote}>
            Verified data can be licensed at fixed catalogue prices. Surveillance items stay unpriced
            and route to an agency referral.
          </Text>
        </Animated.View>

        {/* ---------------- earnings ---------------- */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Data earnings</Text>
          <View style={styles.earnRow}>
            <View>
              <Text style={styles.earnValue}>₹{fmt(score?.earnings_inr || 0)}</Text>
              <Text style={styles.earnLabel}>contributor earnings</Text>
            </View>
            <View style={styles.earnRight}>
              <Text style={styles.earnSmall}>{score?.data_items_sold || 0}</Text>
              <Text style={styles.earnLabel}>items sold</Text>
            </View>
          </View>
          <View style={styles.earnMetaRow}>
            <Text style={styles.earnMeta}>Gross sales ₹{fmt(score?.gross_sales_inr || 0)}</Text>
            <Text style={styles.earnMeta}>Agency referrals {score?.agency_referrals || 0}</Text>
          </View>
        </Animated.View>

        {/* ---------------- badges ---------------- */}
        {badges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>Badges</Text>
            <View style={styles.badgeWrap}>
              {badges.map((b, i) => (
                <Animated.View key={b} entering={FadeInDown.delay(340 + i * 60).duration(300)} style={styles.badge}>
                  <Text style={styles.badgeText}>{b.replace(/_/g, ' ')}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ---------------- awards ---------------- */}
        <Animated.View entering={FadeInDown.delay(360).duration(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Awards</Text>
          {awards.length === 0 ? (
            <Text style={styles.emptyText}>
              Finish in your state top 3 or clear the 25-item marketplace gate to earn one.
            </Text>
          ) : (
            awards.map((a, i) => (
              <Animated.View
                key={a.id}
                entering={FadeInDown.delay(400 + i * 70).duration(350)}
                style={styles.awardRow}
              >
                <Text style={styles.awardIcon}>{a.rank === 1 ? '🏆' : '🎖️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.awardTitle}>{a.title}</Text>
                  <Text style={styles.awardDesc} numberOfLines={2}>
                    {a.description}
                  </Text>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* ---------------- catalogue ---------------- */}
        {catalogue.length > 0 && (
          <Animated.View entering={FadeInDown.delay(420).duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>What earns what</Text>
            <Text style={styles.cardSubtitle}>Fixed prices from the contribution catalogue</Text>
            {catalogue.slice(0, 6).map((c, i) => (
              <Animated.View
                key={`${c.catalogue_id || c.slug}-${i}`}
                entering={FadeInDown.delay(460 + i * 50).duration(300)}
                style={styles.catRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={styles.catMeta}>
                    {c.catalogue_id ? `${c.catalogue_id} · ` : ''}
                    {c.base_points_b} pts
                  </Text>
                </View>
                <Text style={styles.catPrice}>
                  {c.fixed_price_inr ? `₹${fmt(c.fixed_price_inr)}` : c.price_display === 'Not for sale' ? 'Referral' : '—'}
                </Text>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* ---------------- nav ---------------- */}
        <Animated.View entering={FadeInDown.delay(520).duration(400)} style={styles.navGroup}>
          <TouchableOpacity
            style={styles.navPrimary}
            onPress={() => router.push('/recognition/leaderboard')}
            activeOpacity={0.85}
          >
            <Text style={styles.navPrimaryText}>🏆 View Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navSecondary}
            onPress={() => router.push('/recognition/village')}
            activeOpacity={0.85}
          >
            <Text style={styles.navSecondaryText}>🏘 Village &amp; Coast Rankings</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.foam },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },

  hero: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.ocean,
  },
  heroLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  heroValue: {
    fontSize: 68,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginVertical: SPACING.xs,
  },
  tierChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  tierChipText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatValue: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '800' },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },

  errorCard: {
    margin: SPACING.md,
    marginBottom: 0,
    backgroundColor: COLORS.lightSand,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sand,
  },
  errorText: { color: COLORS.deepNavy, fontSize: FONT_SIZE.sm },

  content: { padding: SPACING.md },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.deepNavy },
  cardSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },

  formulaRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  formulaBox: {
    flex: 1,
    backgroundColor: COLORS.foam,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
  },
  formulaLetter: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.oceanBlue },
  formulaValue: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.deepNavy },
  formulaHint: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },

  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  qualityLabel: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600] },
  qualityValue: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.oceanBlue },

  splitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  splitValue: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.oceanBlue },
  good: { color: COLORS.seaGreen },
  progressCaption: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: SPACING.sm },
  progressPercent: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.deepNavy, marginTop: SPACING.sm },
  progressNote: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: SPACING.xs, lineHeight: 17 },
  divider: { height: 1, backgroundColor: COLORS.gray[100], marginVertical: SPACING.md },

  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gray[100],
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  barFill: { height: '100%', borderRadius: 5 },

  earnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
  },
  earnValue: { fontSize: FONT_SIZE.hero, fontWeight: '800', color: COLORS.seaGreen },
  earnLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earnRight: { alignItems: 'flex-end' },
  earnSmall: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.deepNavy },
  earnMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  earnMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },

  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  badge: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.oceanBlue },

  awardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  awardIcon: { fontSize: 22 },
  awardTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  awardDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  catName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.deepNavy },
  catMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  catPrice: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.seaGreen },

  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, lineHeight: 19 },

  navGroup: { marginTop: SPACING.xs, marginBottom: SPACING.xxl },
  navPrimary: {
    backgroundColor: COLORS.oceanBlue,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.ocean,
  },
  navPrimaryText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
  navSecondary: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
  },
  navSecondaryText: { color: COLORS.oceanBlue, fontSize: FONT_SIZE.md, fontWeight: '700' },
});
