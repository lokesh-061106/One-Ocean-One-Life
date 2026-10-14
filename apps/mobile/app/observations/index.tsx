import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface ObservationItem {
  id: string;
  slug: string;
  observation_display?: string;
  observation_category: string;
  category_display?: string;
  organism_name: string;
  notes: string | null;
  contributor?: string;
  village_name?: string | null;
  created_at: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  animal: '🐬',
  plant: '🌿',
  pollution: '⚠️',
  debris: '🗑',
  habitat: '🪸',
  other: '🔍',
};

const CATEGORY_FILTERS = ['animal', 'plant', 'pollution', 'debris', 'habitat', 'other'];

type Paginated<T> = { results?: T[] } | T[];

export default function ObservationsIndex() {
  const [items, setItems] = useState<ObservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  const fetchItems = useCallback(async (category: string) => {
    try {
      const res = await api.get<Paginated<ObservationItem>>(
        ENDPOINTS.OBSERVATIONS.LIST,
        category ? { observation_category: category } : undefined
      );
      setItems(Array.isArray(res) ? res : ((res as { results?: ObservationItem[] }).results || []));
    } catch (e) {
      console.error('Failed to load observations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(activeCategory);
  }, [activeCategory, fetchItems]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchItems(activeCategory);
          }}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Observations</Text>
        <Text style={styles.subtitle}>Wildlife, habitats and pollution spotted on the coast</Text>

        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, activeCategory === '' && styles.chipActive]}
            onPress={() => {
              if (activeCategory === '') return;
              setLoading(true);
              setActiveCategory('');
            }}
          >
            <Text style={[styles.chipText, activeCategory === '' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORY_FILTERS.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.chip, activeCategory === category && styles.chipActive]}
              onPress={() => {
                setLoading(true);
                setActiveCategory(activeCategory === category ? '' : category);
              }}
            >
              <Text style={[styles.chipText, activeCategory === category && styles.chipTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>
            {activeCategory
              ? 'No observations in this category yet.'
              : 'No observations shared yet. Be the first!'}
          </Text>
        ) : (
          items.map((item, idx) => (
            <View key={item.id || idx} style={styles.card}>
              <Text style={styles.cardIcon}>{CATEGORY_ICONS[item.observation_category] || '🔍'}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  {item.observation_display || item.organism_name || 'Observation'}
                </Text>
                {item.organism_name && item.observation_display !== item.organism_name ? (
                  <Text style={styles.cardText}>{item.organism_name}</Text>
                ) : null}
                {item.category_display || item.observation_category ? (
                  <Text style={styles.cardText}>
                    {item.category_display || item.observation_category}
                  </Text>
                ) : null}
                {item.notes ? (
                  <Text style={styles.cardText} numberOfLines={2}>
                    {item.notes}
                  </Text>
                ) : null}
                {item.contributor ? <Text style={styles.cardMeta}>By {item.contributor}</Text> : null}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.createCard} onPress={() => router.push('/contribute?type=observation')}>
          <Text style={styles.createIcon}>➕</Text>
          <View>
            <Text style={styles.createTitle}>Add an Observation</Text>
            <Text style={styles.createText}>Share what you spotted on the coast</Text>
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100] },
  chipActive: { backgroundColor: COLORS.oceanBlue },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], textTransform: 'capitalize' },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
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
