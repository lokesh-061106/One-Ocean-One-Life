import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS, GRADIENTS } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { useOfflineStore } from '@/stores/offlineStore';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const { user } = useAuthStore();
  const { pendingCounts } = useOfflineStore();

  const fetchData = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [statsRes, eventsRes, leadersRes] = await Promise.allSettled([
        api.get(ENDPOINTS.CONTRIBUTIONS.MY_STATS),
        api.get(ENDPOINTS.COMMUNITY.EVENTS),
        api.get(ENDPOINTS.RECOGNITION.LEADERBOARD),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (eventsRes.status === 'fulfilled') {
        const events = (eventsRes.value as any).results || (eventsRes.value as any) || [];
        setRecentEvents(events.slice(0, 3));
      }
      if (leadersRes.status === 'fulfilled') {
        const leaders = (leadersRes.value as any).results || (leadersRes.value as any) || [];
        setLeaderboard(leaders.slice(0, 5));
      }
    } catch {} finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.oceanBlue} />}
    >
      <LinearGradient colors={GRADIENTS.ocean as unknown as [string, string, ...string[]]} style={styles.headerGradient}>
        <View style={styles.logoRow}>
          <Image source={require('@/assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.greetingSection}>
            <Text style={styles.greeting} numberOfLines={2}>{getGreeting()}, {user?.first_name || 'Friend'} 👋</Text>
            <Text style={styles.subtitle} numberOfLines={1}>Your contribution matters to the ocean</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity style={styles.scoreCard} onPress={() => router.push('/recognition/score')}>
          <Text style={styles.scoreTitle}>🌊 OCEAN IMPACT</Text>
          {loadingStats ? (
            <ActivityIndicator color={COLORS.white} style={{ marginVertical: SPACING.md }} />
          ) : (
            <>
              <Text style={styles.scoreValue}>{stats?.total_score || 0}</Text>
              <Text style={styles.scoreChange}>
                {stats?.verified_contributions || 0} verified • {stats?.total_contributions || 0} total
              </Text>
            </>
          )}
        </TouchableOpacity>

        {pendingCounts.total > 0 && (
          <View style={styles.offlineBar}>
            <Text style={styles.offlineText}>📤 {pendingCounts.total} item{pendingCounts.total !== 1 ? 's' : ''} pending sync</Text>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>What would you like to do?</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/search')}>
            <Text style={styles.actionIcon}>🔎</Text>
            <Text style={styles.actionText}>Search the Ocean</Text>
          </TouchableOpacity>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/guide')}>
              <Text style={styles.actionCardIcon}>🐋</Text>
              <Text style={styles.actionCardText}>Learn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/education')}>
              <Text style={styles.actionCardIcon}>🎓</Text>
              <Text style={styles.actionCardText}>Education</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/sound/record')}>
              <Text style={styles.actionCardIcon}>🎙</Text>
              <Text style={styles.actionCardText}>Record</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/sighting/capture')}>
              <Text style={styles.actionCardIcon}>📷</Text>
              <Text style={styles.actionCardText}>Sighting</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/map')}>
              <Text style={styles.actionCardIcon}>🗺</Text>
              <Text style={styles.actionCardText}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/marketplace')}>
              <Text style={styles.actionCardIcon}>🛒</Text>
              <Text style={styles.actionCardText}>Shop</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionCard} onPress={() => router.push('/economy')}>
            <Text style={styles.sectionCardIcon}>🌱</Text>
            <View style={styles.sectionCardContent}>
              <Text style={styles.sectionCardTitle}>Circular Economy</Text>
              <Text style={styles.sectionCardSubtitle}>Turn waste into income</Text>
            </View>
            <Text style={styles.sectionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionCard} onPress={() => router.push('/ecotourism')}>
            <Text style={styles.sectionCardIcon}>🏖</Text>
            <View style={styles.sectionCardContent}>
              <Text style={styles.sectionCardTitle}>Coastal Tourism</Text>
              <Text style={styles.sectionCardSubtitle}>Discover local experiences</Text>
            </View>
            <Text style={styles.sectionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {leaderboard.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏆 Top Contributors</Text>
              <TouchableOpacity onPress={() => router.push('/recognition/leaderboard')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {leaderboard.map((item: any, index: number) => (
              <TouchableOpacity
                key={item.user || item.id || index}
                style={styles.leaderRow}
                onPress={() => router.push('/recognition/leaderboard')}
              >
                <Text style={styles.leaderRank}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</Text>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{item.user_name}</Text>
                  <Text style={styles.leaderVillage}>{item.village_name || 'Coastal Tamil Nadu'}</Text>
                </View>
                <Text style={styles.leaderScore}>{item.total_score}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {recentEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
              <TouchableOpacity onPress={() => router.push('/events')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentEvents.map((event: any, idx: number) => (
              <TouchableOpacity key={event.id || idx} style={styles.eventCard} onPress={() => router.push(`/events/${event.slug || event.id}`)}>
                <Text style={styles.eventIcon}>{event.event_type === 'cleanup' ? '🧹' : event.event_type === 'workshop' ? '🎓' : '📅'}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>{new Date(event.start_date).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.emergencyButton} onPress={() => router.push('/emergency')}>
          <Text style={styles.emergencyText}>🚨 Emergency Contacts</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  headerGradient: { paddingTop: SPACING.lg, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoImage: { width: 56, height: 40, borderRadius: 6 },
  greetingSection: { flex: 1, flexShrink: 1 },
  greeting: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: FONT_SIZE.md, color: 'rgba(255,255,255,0.8)', marginTop: SPACING.xs },
  content: { padding: SPACING.md },
  scoreCard: { backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, alignItems: 'center', ...SHADOWS.ocean },
  scoreTitle: { fontSize: FONT_SIZE.sm, color: COLORS.foam, fontWeight: '600', letterSpacing: 1 },
  scoreValue: { fontSize: 48, fontWeight: 'bold', color: COLORS.white, marginVertical: SPACING.sm },
  scoreChange: { fontSize: FONT_SIZE.sm, color: COLORS.seaGreen, fontWeight: '600' },
  offlineBar: { backgroundColor: '#FEF3C7', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md },
  offlineText: { fontSize: FONT_SIZE.sm, color: '#92400E', textAlign: 'center' },
  quickActions: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.md },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  actionIcon: { fontSize: 24, marginRight: SPACING.md },
  actionText: { fontSize: FONT_SIZE.md, color: COLORS.gray[700] },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionCard: { width: '31%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', minHeight: 76, ...SHADOWS.sm },
  actionCardIcon: { fontSize: 28, marginBottom: SPACING.xs },
  actionCardText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.deepNavy, textAlign: 'center' },
  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  seeAll: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '600' },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', ...SHADOWS.sm },
  sectionCardIcon: { fontSize: 28, marginRight: SPACING.md },
  sectionCardContent: { flex: 1 },
  sectionCardTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy },
  sectionCardSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500] },
  sectionArrow: { fontSize: FONT_SIZE.xl, color: COLORS.gray[400] },
  leaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  leaderRank: { fontSize: 20, width: 36, textAlign: 'center' },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy },
  leaderVillage: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  leaderScore: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.oceanBlue },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  eventIcon: { fontSize: 24, marginRight: SPACING.md },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy },
  eventTime: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500] },
  emergencyButton: { backgroundColor: COLORS.coral, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.xxl, ...SHADOWS.md },
  emergencyText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '600' },
});
