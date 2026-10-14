import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface CleanupItem {
  id: string;
  title: string;
  description: string;
  beach_name: string | null;
  cleanup_date: string;
  participants_count: number;
  waste_collected_kg: number;
  organizer_name: string | null;
}

type Paginated<T> = { results?: T[] } | T[];

export default function CleanupsIndex() {
  const [cleanups, setCleanups] = useState<CleanupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCleanups = async () => {
    try {
      const res = await api.get<Paginated<CleanupItem>>(ENDPOINTS.ECOTOURISM.CLEANUPS);
      setCleanups(Array.isArray(res) ? res : ((res as { results?: CleanupItem[] }).results || []));
    } catch (e) {
      console.error('Failed to load clean-ups:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCleanups();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalWaste = cleanups.reduce((sum, c) => sum + (c.waste_collected_kg || 0), 0);
  const totalPeople = cleanups.reduce((sum, c) => sum + (c.participants_count || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchCleanups();
          }}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Beach Clean-ups</Text>
        <Text style={styles.subtitle}>Community clean-up drives along the coast</Text>

        {!loading && cleanups.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{cleanups.length}</Text>
              <Text style={styles.statLabel}>Clean-ups</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalPeople}</Text>
              <Text style={styles.statLabel}>Volunteers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(totalWaste)} kg</Text>
              <Text style={styles.statLabel}>Waste</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : cleanups.length === 0 ? (
          <Text style={styles.emptyText}>No clean-ups recorded yet. Be the first to organise one!</Text>
        ) : (
          cleanups.map((item, idx) => (
            <View key={item.id || idx} style={styles.card}>
              <Text style={styles.cardIcon}>🏖</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardText}>{formatDate(item.cleanup_date)}</Text>
                {item.beach_name ? <Text style={styles.cardText}>📍 {item.beach_name}</Text> : null}
                <Text style={styles.cardText}>
                  {item.participants_count} people · {item.waste_collected_kg} kg waste
                </Text>
                {item.organizer_name ? <Text style={styles.cardMeta}>By {item.organizer_name}</Text> : null}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.createCard} onPress={() => router.push('/contribute?type=beach_cleanup')}>
          <Text style={styles.createIcon}>➕</Text>
          <View>
            <Text style={styles.createTitle}>Record a Clean-up</Text>
            <Text style={styles.createText}>Log participants and waste collected</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  card: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardIcon: { fontSize: 36, marginRight: SPACING.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 4 },
  createCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg },
  createIcon: { fontSize: 28, color: COLORS.white, marginRight: SPACING.md },
  createTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.white },
  createText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)' },
});
