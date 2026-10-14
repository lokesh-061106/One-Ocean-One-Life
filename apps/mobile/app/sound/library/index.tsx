import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { fetchLibraryCategories } from '@/services/sound-library';
import type { SoundLibraryCategory } from '@/types/sound-library';

export default function SoundLibraryIndex() {
  const [categories, setCategories] = useState<SoundLibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchLibraryCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load sound library:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchLibraryCategories()
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch((e) => { if (!cancelled) console.error('Failed to load sound library:', e); })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Ocean Sound Library</Text>
        <Text style={styles.subtitle}>Browse sounds by category and group</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : categories.length === 0 ? (
          <Text style={styles.emptyText}>No library content yet.</Text>
        ) : (
          categories.map((category) => (
            <TouchableOpacity
              key={category.slug}
              style={styles.card}
              onPress={() => router.push({ pathname: '/sound/library/[slug]', params: { slug: category.slug } })}
            >
              <Text style={styles.cardIcon}>{category.icon || '🌊'}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{category.name}</Text>
                <Text style={styles.cardText}>
                  {category.item_count} sounds{category.children.length ? ` • ${category.children.length} groups` : ''}
                </Text>
                {category.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{category.description}</Text>
                ) : null}
                {category.document_url ? <Text style={styles.cardDoc}>📄 {category.document_name || 'Reference document'}</Text> : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  back: { marginBottom: SPACING.sm },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.oceanBlue, fontWeight: '600' },
  title: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardIcon: { fontSize: 30, marginRight: SPACING.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, marginTop: 2 },
  cardDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 4 },
  cardDoc: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, marginTop: 6 },
});
