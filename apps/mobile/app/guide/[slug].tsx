import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const STATUS_COLORS: Record<string, string> = {
  LC: '#16A085', NT: '#D97706', VU: '#EA580C', EN: '#DC2626', CR: '#991B1B',
};

export default function GuideDetail() {
  const { slug, name } = useLocalSearchParams<{ slug: string; name: string }>();
  const [species, setSpecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    fetch(`${API_URL}/guides/species/?category=${slug}`)
      .then((res) => { if (!res.ok) throw new Error('Failed'); return res.json(); })
      .then((data) => { if (!cancelled) setSpecies(data.results || data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load species'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Category not found.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
        <Text style={styles.loadingText}>Loading species...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.categoryTitle}>{name || 'Species'}</Text>
        <Text style={styles.categorySubtitle}>{species.length} species found</Text>

        {species.length === 0 ? (
          <Text style={styles.emptyText}>No species in this category yet.</Text>
        ) : (
          species.map((sp: any, idx: number) => (
            <TouchableOpacity
              key={sp.id || idx}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/guide/species/[slug]',
                  params: { slug: sp.slug || sp.id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.commonName}>{sp.common_name}</Text>
                {sp.conservation_status && (
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[sp.conservation_status] || '#888' }]}>
                    <Text style={styles.statusText}>{sp.conservation_status}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.scientificName}>{sp.scientific_name}</Text>
              {sp.tamil_name && <Text style={styles.tamilName}>{sp.tamil_name}</Text>}
              <Text style={styles.viewHint}>View full details ›</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  errorText: { color: COLORS.coral, fontSize: FONT_SIZE.md },
  categoryTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  categorySubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commonName: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text, flex: 1 },
  statusDot: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  scientificName: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 4 },
  tamilName: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, marginTop: 2 },
  viewHint: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, fontWeight: '600', marginTop: 8 },
});
