import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS, API_URL } from '@/constants/api';

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

function mediaUri(src?: string | null): string | null {
  if (!src) return null;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(src)) {
    return src.replace(/^https?:\/\/[^/]+/i, API_ORIGIN);
  }
  if (/^https?:\/\//i.test(src)) return src;
  return `${API_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`;
}

interface Sighting {
  id: string;
  slug?: string;
  species_name?: string | null;
  ai_species_suggestion?: string;
  number_observed: number;
  behavior: string;
  sighting_date?: string | null;
  village_name?: string;
  status?: string;
  category_name?: string | null;
  photo?: string | null;
}

export default function SightingIndex() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSightings = async () => {
    try {
      const res = await api.get<{ results?: Sighting[] } | Sighting[]>(ENDPOINTS.SIGHTINGS.LIST);
      setSightings(Array.isArray(res) ? res : (res as any).results || []);
    } catch (e) {
      console.error('Failed to load sightings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSightings(); }, []);

  const getBehaviorEmoji = (b?: string) => {
    switch (b) {
      case 'feeding': return '🍽';
      case 'playing': return '🎭';
      case 'resting': return '😴';
      case 'traveling': return '🏊';
      case 'breeding': return '💕';
      default: return '🐬';
    }
  };

  const getTitle = (s: Sighting) => s.species_name || s.ai_species_suggestion || 'Unknown species';

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSightings(); }} />}>
      <View style={styles.content}>
        <Text style={styles.title}>Marine Sightings</Text>
        <Text style={styles.subtitle}>Report and view marine life sightings</Text>

        <TouchableOpacity style={styles.reportCard} onPress={() => router.push('/sighting/capture')}>
          <Text style={styles.reportIcon}>📸</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportTitle}>Report Sighting</Text>
            <Text style={styles.reportText}>Document a marine species sighting</Text>
          </View>
          <Text style={styles.reportChevron}>›</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : sightings.length === 0 ? (
          <Text style={styles.emptyText}>No sightings reported yet. Be the first!</Text>
        ) : (
          sightings.map((s, idx) => {
            const photo = mediaUri(s.photo);
            return (
              <TouchableOpacity
                key={s.id || idx}
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => router.push(`/sighting/${s.slug || s.id}`)}
              >
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.cardThumb} />
                ) : (
                  <View style={[styles.cardThumb, styles.cardThumbPlaceholder]}>
                    <Text style={styles.cardThumbEmoji}>{getBehaviorEmoji(s.behavior)}</Text>
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{getTitle(s)}</Text>
                    <Text style={styles.cardChevron}>›</Text>
                  </View>

                  {s.status ? (
                    <View style={[styles.statusPill, s.status === 'verified' ? styles.statusVerified : styles.statusPending]}>
                      <Text style={styles.statusPillText}>{s.status}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.cardText} numberOfLines={2}>
                    {getBehaviorEmoji(s.behavior)} {s.behavior}
                    {'  •  '}{s.number_observed} observed
                    {s.village_name ? `\n📍 ${s.village_name}` : ''}
                  </Text>

                  {s.sighting_date && (
                    <Text style={styles.cardDate}>{new Date(s.sighting_date).toLocaleDateString('en-IN')}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  title: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  reportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, ...SHADOWS.ocean },
  reportIcon: { fontSize: 28, color: COLORS.white, marginRight: SPACING.md },
  reportTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.white },
  reportText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)' },
  reportChevron: { fontSize: 28, color: 'rgba(255,255,255,0.85)', marginLeft: SPACING.sm },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardThumb: { width: 64, height: 64, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.lightBlue, marginRight: SPACING.md },
  cardThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardThumbEmoji: { fontSize: 30 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACING.sm },
  cardTitle: { flex: 1, fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  cardChevron: { fontSize: 24, color: COLORS.gray[400], lineHeight: 24 },
  statusPill: { alignSelf: 'flex-start', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  statusVerified: { backgroundColor: COLORS.lightGreen },
  statusPending: { backgroundColor: COLORS.lightSand },
  statusPillText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.success, textTransform: 'capitalize' },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  cardDate: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, marginTop: 4 },
});
