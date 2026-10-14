import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS, GRADIENTS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/stores/authStore';

type Level = 'individual' | 'village' | 'district' | 'state' | 'region' | 'zone';

const LEVELS: { key: Level; label: string; icon: string }[] = [
  { key: 'individual', label: 'People', icon: '👤' },
  { key: 'village', label: 'Villages', icon: '🏘' },
  { key: 'district', label: 'Districts', icon: '🏛' },
  { key: 'state', label: 'States', icon: '🗺' },
  { key: 'region', label: 'Coast', icon: '🌊' },
  { key: 'zone', label: 'Zones', icon: '📡' },
];

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));
const isGroup = (row: any) => typeof row?.members === 'number';

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const [level, setLevel] = useState<Level>('individual');
  const [cache, setCache] = useState<Partial<Record<Level, any[]>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const cacheRef = useRef<Partial<Record<Level, any[]>>>({});

  const rows = cache[level] || [];
  const loading = cache[level] === undefined;

  const fetchBoard = useCallback(async (target: Level) => {
    try {
      const data = (await api.get(`${ENDPOINTS.RECOGNITION.LEADERBOARD}?level=${target}&limit=50`)) as any;
      return (Array.isArray(data) ? data : data?.results || []) as any[];
    } catch {
      return [] as any[];
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (cacheRef.current[level] !== undefined) return;
      const list = await fetchBoard(level);
      if (!alive) return;
      cacheRef.current[level] = list;
      setCache((prev) => ({ ...prev, [level]: list }));
    })();
    return () => {
      alive = false;
    };
  }, [level, fetchBoard]);

  const onRefresh = async () => {
    setRefreshing(true);
    const list = await fetchBoard(level);
    cacheRef.current[level] = list;
    setCache((prev) => ({ ...prev, [level]: list }));
    setRefreshing(false);
  };

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const renderPodium = () => (
    <View style={styles.podiumRow}>
      {podium.map((item, i) => {
        const order = i === 0 ? 1 : i === 1 ? 0 : 2;
        const label = isGroup(item) ? item.label : item.display_name || item.user_name;
        const sub = isGroup(item)
          ? `${item.members} members · ${fmt(item.verified_contributions)} verified`
          : `${item.village_name || item.state || ''} · ${fmt(item.verified_contributions || 0)} verified`;
        const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉';
        return (
          <Animated.View
            key={`${item.rank}-${label}`}
            entering={FadeInDown.delay(i * 90).duration(450)}
            style={[styles.podiumCard, { order } as any, item.rank === 1 && styles.podiumFirst]}
          >
            <Text style={styles.podiumMedal}>{medal}</Text>
            <Text style={styles.podiumName} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.podiumSub} numberOfLines={1}>
              {sub}
            </Text>
            <Text style={styles.podiumScore}>{fmt(item.total_score)}</Text>
            <Text style={styles.podiumUnit}>points</Text>
            {!isGroup(item) && item.tier ? (
              <View style={styles.tierChip}>
                <Text style={styles.tierChipText}>{item.tier_display || item.tier}</Text>
              </View>
            ) : null}
            {isGroup(item) ? (
              <Text style={styles.podiumEarn}>₹{fmt(item.earnings_inr || 0)} earned</Text>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const group = isGroup(item);
    const isMe = !group && item.user === user?.id;
    const label = group ? item.label : item.display_name || item.user_name;
    const sub = group
      ? `${item.members} members · ${fmt(item.verified_contributions)} verified · avg ${item.avg_score} pts`
      : `${item.occupation ? item.occupation + ' · ' : ''}${item.village_name || item.state || ''} · ${fmt(
          item.verified_contributions || 0
        )} verified`;
    const movement = item.rank_movement || 0;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 12) * 45).duration(350)}>
        <View style={[styles.rankCard, isMe && styles.rankCardMe]}>
          <View style={[styles.rankBadge, item.rank <= 3 && styles.rankBadgeTop]}>
            <Text style={[styles.rankNumber, item.rank <= 3 && styles.rankNumberTop]}>
              {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
            </Text>
          </View>

          <View style={styles.rankInfo}>
            <Text style={[styles.rankName, isMe && styles.rankNameMe]} numberOfLines={1}>
              {label}
              {isMe ? ' (You)' : ''}
            </Text>
            <Text style={styles.rankVillage} numberOfLines={1}>
              {sub}
            </Text>
            {movement !== 0 && (
              <Text style={[styles.rankMove, { color: movement > 0 ? COLORS.seaGreen : COLORS.coral }]}>
                {movement > 0 ? `▲ ${movement}` : `▼ ${Math.abs(movement)}`}
              </Text>
            )}
          </View>

          <View style={styles.rankRight}>
            <Text style={styles.rankScore}>{fmt(item.total_score)}</Text>
            <Text style={styles.rankScoreLabel}>pts</Text>
            <Text style={styles.rankEarn}>₹{fmt(item.earnings_inr || 0)}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.deep} style={styles.header}>
        <Text style={styles.title}>🏆 Scoreboard</Text>
        <Text style={styles.subtitle}>B × Q × V × I — verified, ranked, rewarded</Text>
      </LinearGradient>

      <View style={styles.levelsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelsRow}>
          {LEVELS.map((l) => {
            const active = l.key === level;
            return (
              <TouchableOpacity
                key={l.key}
                onPress={() => setLevel(l.key)}
                activeOpacity={0.8}
                style={[styles.levelChip, active && styles.levelChipActive]}
              >
                <Text style={[styles.levelText, active && styles.levelTextActive]}>
                  {l.icon} {l.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={rest}
        keyExtractor={(item, i) => item.scope_key || item.user || `row-${i}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.oceanBlue} />
        }
        ListHeaderComponent={
          <View>
            {loading ? (
              <ActivityIndicator style={{ padding: SPACING.xl }} color={COLORS.oceanBlue} />
            ) : (
              <>
                {podium.length > 0 && renderPodium()}
                <Text style={styles.listLabel}>FULL STANDINGS</Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>No scoreboard data for this level yet</Text>
            </View>
          ) : null
        }
        renderItem={renderItem}
      />
    </View>
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
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.85)', marginTop: SPACING.xs },

  levelsWrap: { backgroundColor: COLORS.white, ...SHADOWS.sm },
  levelsRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  levelChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.foam,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  levelChipActive: { backgroundColor: COLORS.oceanBlue, borderColor: COLORS.oceanBlue },
  levelText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.gray[600] },
  levelTextActive: { color: COLORS.white },

  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  podiumRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, alignItems: 'flex-end' },
  podiumCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    ...SHADOWS.md,
  },
  podiumFirst: { paddingVertical: SPACING.md, borderColor: COLORS.sand, borderWidth: 2 },
  podiumMedal: { fontSize: 26, marginBottom: 2 },
  podiumName: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.deepNavy, textAlign: 'center' },
  podiumSub: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  podiumScore: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.oceanBlue, marginTop: 4 },
  podiumUnit: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase' },
  podiumEarn: { fontSize: 10, color: COLORS.seaGreen, fontWeight: '700', marginTop: 4 },

  tierChip: {
    marginTop: 6,
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierChipText: { fontSize: 10, fontWeight: '700', color: COLORS.oceanBlue },

  listLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },

  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  rankCardMe: { borderWidth: 2, borderColor: COLORS.oceanBlue, backgroundColor: '#F0F9FF' },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rankBadgeTop: { backgroundColor: COLORS.lightSand },
  rankNumber: { fontSize: FONT_SIZE.sm, fontWeight: 'bold', color: COLORS.gray[600] },
  rankNumberTop: { fontSize: 20 },
  rankInfo: { flex: 1 },
  rankName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.deepNavy },
  rankNameMe: { color: COLORS.oceanBlue },
  rankVillage: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 2 },
  rankMove: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  rankRight: { alignItems: 'flex-end' },
  rankScore: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.oceanBlue },
  rankScoreLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  rankEarn: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, fontWeight: '700', marginTop: 2 },

  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], textAlign: 'center' },
});
