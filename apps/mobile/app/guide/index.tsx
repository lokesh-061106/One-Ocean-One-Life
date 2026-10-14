import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

interface GuideCategory {
  id: string;
  name: string;
  name_tamil?: string;
  icon: string;
  slug: string;
  description: string;
  species_count?: number;
}

export default function GuideIndex() {
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get<{ results?: GuideCategory[] } | GuideCategory[]>(ENDPOINTS.GUIDES.CATEGORIES);
      setCategories(Array.isArray(res) ? res : (res as any).results || []);
    } catch (e) {
      console.error('Failed to load guide categories:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCategories(); }} />}>
      <View style={styles.content}>
        <Text style={styles.title}>Ocean Guides</Text>
        <Text style={styles.subtitle}>Explore marine species and habitats</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : categories.length === 0 ? (
          <Text style={styles.emptyText}>No guide categories available.</Text>
        ) : (
          categories.map((cat, idx) => (
            <TouchableOpacity key={cat.id || idx} style={styles.card} onPress={() => router.push({ pathname: '/guide/[slug]', params: { slug: cat.slug || cat.id, name: cat.name } })}>
              <Text style={styles.cardIcon}>{cat.icon || '🐋'}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{cat.name}</Text>
                {cat.name_tamil && <Text style={styles.cardTamil}>{cat.name_tamil}</Text>}
                <HtmlText html={cat.description} style={styles.cardText} paragraphSpacing={4} numberOfLines={3} />
              </View>
              <Text style={styles.arrow}>→</Text>
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
  title: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardIcon: { fontSize: 40, marginRight: SPACING.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  cardTamil: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, marginTop: 2 },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  arrow: { fontSize: FONT_SIZE.lg, color: COLORS.gray[400] },
});
