import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface CatchItem {
  id: string;
  slug: string;
  species_display?: string;
  species_name: string;
  species_group: string;
  number: number;
  weight: number | null;
  weight_unit: string;
  length: number | null;
  length_unit: string;
  gear: string;
  gear_other: string;
  fishing_location_name: string;
  contributor?: string;
  village_name?: string | null;
  created_at: string;
}

const GROUP_ICONS: Record<string, string> = {
  fish: '🐟',
  shark_ray: '🦈',
  turtle: '🐢',
  mammal: '🐬',
  crustacean: '🦐',
  mollusc: '🐚',
  other: '🎣',
};

const GROUP_FILTERS = ['fish', 'shark_ray', 'turtle', 'crustacean', 'mollusc', 'other'];

type Paginated<T> = { results?: T[] } | T[];

export default function CatchesIndex() {
  const [catches, setCatches] = useState<CatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGroup, setActiveGroup] = useState('');

  const fetchCatches = useCallback(async (group: string) => {
    try {
      const res = await api.get<Paginated<CatchItem>>(
        ENDPOINTS.CATCHES.LIST,
        group ? { species_group: group } : undefined
      );
      setCatches(Array.isArray(res) ? res : ((res as { results?: CatchItem[] }).results || []));
    } catch (e) {
      console.error('Failed to load catches:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCatches(activeGroup);
  }, [activeGroup, fetchCatches]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchCatches(activeGroup);
          }}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Fish Catch</Text>
        <Text style={styles.subtitle}>Verified catch records shared by fishers</Text>

        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, activeGroup === '' && styles.chipActive]}
            onPress={() => {
              if (activeGroup === '') return;
              setLoading(true);
              setActiveGroup('');
            }}
          >
            <Text style={[styles.chipText, activeGroup === '' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {GROUP_FILTERS.map((group) => (
            <TouchableOpacity
              key={group}
              style={[styles.chip, activeGroup === group && styles.chipActive]}
              onPress={() => {
                setLoading(true);
                setActiveGroup(activeGroup === group ? '' : group);
              }}
            >
              <Text style={[styles.chipText, activeGroup === group && styles.chipTextActive]}>
                {group.replace('_', ' & ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : catches.length === 0 ? (
          <Text style={styles.emptyText}>
            {activeGroup ? 'No catches in this group yet.' : 'No catches shared yet. Be the first!'}
          </Text>
        ) : (
          catches.map((item, idx) => (
            <View key={item.id || idx} style={styles.card}>
              <Text style={styles.cardIcon}>{GROUP_ICONS[item.species_group] || '🎣'}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.species_name || item.species_display || 'Fish catch'}</Text>
                <Text style={styles.cardText}>
                  {item.number > 1 ? `${item.number} caught` : '1 caught'}
                  {item.weight != null ? ` · ${item.weight} ${item.weight_unit}` : ''}
                  {item.gear ? ` · ${item.gear === 'other' && item.gear_other ? item.gear_other : item.gear}` : ''}
                </Text>
                {item.fishing_location_name ? (
                  <Text style={styles.cardText}>📍 {item.fishing_location_name}</Text>
                ) : null}
                {item.contributor ? <Text style={styles.cardMeta}>By {item.contributor}</Text> : null}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.createCard} onPress={() => router.push('/contribute?type=fish_catch')}>
          <Text style={styles.createIcon}>➕</Text>
          <View>
            <Text style={styles.createTitle}>Log a Catch</Text>
            <Text style={styles.createText}>Share photos, size, weight and gear</Text>
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
