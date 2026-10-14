import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS, GRADIENTS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/stores/authStore';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));

interface Bar {
  key: string;
  label: string;
  sub: string;
  points: number;
  members?: number;
  earnings?: number;
  highlight?: boolean;
}

export default function RecognitionVillage() {
  const { user } = useAuthStore();
  const [villages, setVillages] = useState<Bar[]>([]);
  const [regions, setRegions] = useState<Bar[]>([]);
  const [nearby, setNearby] = useState<any[]>([]);
  const [nearbyNote, setNearbyNote] = useState<string>('Finding contributors near you…');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [villageBoard, regionBoard] = await Promise.all([
        api.get(`${ENDPOINTS.RECOGNITION.LEADERBOARD}?level=village&limit=10`).catch(() => []),
        api.get(`${ENDPOINTS.RECOGNITION.LEADERBOARD}?level=region&limit=8`).catch(() => []),
      ]);

      const vList: any[] = Array.isArray(villageBoard) ? villageBoard : (villageBoard as any)?.results || [];
      const rList: any[] = Array.isArray(regionBoard) ? regionBoard : (regionBoard as any)?.results || [];

      setVillages(
        vList.map((v) => ({
          key: v.scope_key || v.label,
          label: v.label,
          sub: `${v.members} members · ${fmt(v.verified_contributions)} verified`,
          points: v.total_score,
          members: v.members,
          earnings: v.earnings_inr,
          highlight: !!user?.village && v.label === user.village,
        }))
      );
      setRegions(
        rList.map((r) => ({
          key: r.scope_key || r.label,
          label: r.label,
          sub: `${r.members} contributors · ${fmt(r.verified_contributions)} verified`,
          points: r.total_score,
          members: r.members,
          earnings: r.earnings_inr,
        }))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.village]);

  const loadNearby = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNearbyNote('Location off — enable it to see contributors around your village.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const data = (await api.get(
        `${ENDPOINTS.RECOGNITION.NEARBY}?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius_km=50`
      )) as any;
      const results = data?.results || [];
      setNearby(results);
      setNearbyNote(
        results.length
          ? `Within 50 km of your position · ${results.length} shown`
          : 'No opted-in contributors within 50 km yet.'
      );
    } catch {
      setNearbyNote('Could not read your location — try again later.');
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
      await loadNearby();
    })();
  }, [load, loadNearby]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
    loadNearby();
  };

  const maxVillage = villages.length ? Math.max(...villages.map((v) => v.points)) : 1;
  const maxRegion = regions.length ? Math.max(...regions.map((r) => r.points)) : 1;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.oceanBlue} />
      }
    >
      <LinearGradient colors={GRADIENTS.oceanSoft} style={styles.header}>
        <Animated.View entering={FadeIn.duration(350)}>
          <Text style={styles.headerKicker}>MY COAST</Text>
          <Text style={styles.headerTitle}>Village &amp; coastal rankings</Text>
          <Text style={styles.headerSub}>
            Who is contributing, earning and getting verified around you
          </Text>
        </Animated.View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.content}>
          {/* villages */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>Top villages</Text>
            <Text style={styles.cardSub}>Score points from verified B × Q × V × I contributions</Text>
            {villages.map((v, idx) => (
              <Animated.View
                key={v.key}
                entering={FadeInDown.delay(80 + idx * 60).duration(350)}
                style={[styles.rankCard, v.highlight && styles.rankCardHighlight]}
              >
                <View style={styles.rankHeader}>
                  <Text style={styles.rank}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </Text>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankTitle} numberOfLines={1}>
                      {v.label}
                      {v.highlight ? '  · you' : ''}
                    </Text>
                    <Text style={styles.rankText}>{v.sub}</Text>
                  </View>
                  <View style={styles.rankRight}>
                    <Text style={styles.rankPoints}>{fmt(v.points)}</Text>
                    <Text style={styles.rankUnit}>pts</Text>
                    <Text style={styles.rankEarn}>₹{fmt(v.earnings || 0)}</Text>
                  </View>
                </View>
                <View style={styles.rankBar}>
                  <View
                    style={[
                      styles.rankBarFill,
                      {
                        width: `${Math.max((v.points / maxVillage) * 100, 4)}%`,
                        backgroundColor: v.highlight ? COLORS.seaGreen : COLORS.oceanBlue,
                      },
                    ]}
                  />
                </View>
              </Animated.View>
            ))}
            {villages.length === 0 && <Text style={styles.emptyText}>No village data yet.</Text>}
          </Animated.View>

          {/* coastal regions */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>Coastal regions</Text>
            <Text style={styles.cardSub}>The 22 named coasts across Tamil Nadu, AP, Kerala &amp; Karnataka</Text>
            {regions.map((r, idx) => (
              <Animated.View
                key={r.key}
                entering={FadeInDown.delay(160 + idx * 55).duration(350)}
                style={styles.rankCard}
              >
                <View style={styles.rankHeader}>
                  <Text style={styles.rank}>{idx + 1}</Text>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankTitle} numberOfLines={1}>
                      {r.label}
                    </Text>
                    <Text style={styles.rankText}>{r.sub}</Text>
                  </View>
                  <View style={styles.rankRight}>
                    <Text style={styles.rankPoints}>{fmt(r.points)}</Text>
                    <Text style={styles.rankUnit}>pts</Text>
                  </View>
                </View>
                <View style={styles.rankBar}>
                  <View
                    style={[
                      styles.rankBarFill,
                      {
                        width: `${Math.max((r.points / maxRegion) * 100, 4)}%`,
                        backgroundColor: COLORS.seaGreen,
                      },
                    ]}
                  />
                </View>
              </Animated.View>
            ))}
            {regions.length === 0 && <Text style={styles.emptyText}>No coastal region data yet.</Text>}
          </Animated.View>

          {/* nearby contributors */}
          <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>Nearest contributors</Text>
            <Text style={styles.cardSub}>{nearbyNote}</Text>
            {nearby.map((p, idx) => (
              <Animated.View
                key={p.user}
                entering={FadeInDown.delay(260 + idx * 60).duration(350)}
                style={styles.nearRow}
              >
                <View style={styles.nearAvatar}>
                  <Text style={styles.nearAvatarText}>{(p.name || '?').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nearName}>{p.name}</Text>
                  <Text style={styles.nearMeta} numberOfLines={1}>
                    {p.occupation ? `${p.occupation} · ` : ''}
                    {p.village} · {p.distance_km} km
                  </Text>
                </View>
                <View style={styles.nearRight}>
                  <Text style={styles.nearVerified}>{p.verified_contributions} ✔</Text>
                  <Text style={styles.nearEarn}>
                    {p.earnings_hidden ? 'hidden' : `₹${fmt(p.earnings_inr || 0)}`}
                  </Text>
                </View>
              </Animated.View>
            ))}
            {nearby.length === 0 && (
              <Text style={styles.emptyText}>
                Contributors who tick “Appear on the local contributor map” show up here.
              </Text>
            )}
          </Animated.View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  headerKicker: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.oceanBlue,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.deepNavy,
    marginTop: SPACING.xs,
  },
  headerSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },

  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.deepNavy },
  cardSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },

  rankCard: {
    backgroundColor: COLORS.foam,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  rankCardHighlight: { borderColor: COLORS.seaGreen, backgroundColor: COLORS.lightGreen },
  rankHeader: { flexDirection: 'row', alignItems: 'center' },
  rank: { fontSize: 20, marginRight: SPACING.sm, width: 32, textAlign: 'center' },
  rankInfo: { flex: 1 },
  rankTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  rankText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 2 },
  rankRight: { alignItems: 'flex-end' },
  rankPoints: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.oceanBlue },
  rankUnit: { fontSize: 10, color: COLORS.gray[500] },
  rankEarn: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, fontWeight: '700' },
  rankBar: {
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  rankBarFill: { height: '100%', borderRadius: 3 },

  nearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  nearAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearAvatarText: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.oceanBlue },
  nearName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  nearMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  nearRight: { alignItems: 'flex-end' },
  nearVerified: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.oceanBlue },
  nearEarn: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, fontWeight: '700' },

  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 19 },
});
