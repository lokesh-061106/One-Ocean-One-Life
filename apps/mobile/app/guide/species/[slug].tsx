import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

const STATUS_COLORS: Record<string, string> = {
  LC: '#16A085', NT: '#D97706', VU: '#EA580C', EN: '#DC2626', CR: '#991B1B',
};

interface SpeciesCategory {
  id: string;
  name: string;
  name_tamil?: string;
  icon?: string;
}

interface SpeciesDetail {
  id: string;
  slug: string;
  common_name: string;
  tamil_name?: string;
  scientific_name: string;
  description?: string;
  habitat?: string;
  diet?: string;
  behavior?: string;
  identification?: string;
  interesting_facts?: string;
  conservation_status?: string;
  typical_size?: string;
  image?: string | null;
  is_verified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  category?: SpeciesCategory;
}

const absoluteUrl = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const origin = API_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
};

export default function SpeciesDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [species, setSpecies] = useState<SpeciesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (species?.common_name) navigation.setOptions({ title: species.common_name });
  }, [species, navigation]);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    fetch(`${API_URL}/guides/species/${slug}/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load species');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSpecies(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this species. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Species not found.</Text>
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

  if (error || !species) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Species not found.'}</Text>
      </View>
    );
  }

  const imageUrl = absoluteUrl(species.image);
  const statusColor = species.conservation_status ? STATUS_COLORS[species.conservation_status] || '#888' : null;
  const hasLocation = typeof species.latitude === 'number' && typeof species.longitude === 'number';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroIcon}>{species.category?.icon || '🐟'}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.commonName}>{species.common_name}</Text>
            <Text style={styles.scientificName}>{species.scientific_name}</Text>
            {!!species.tamil_name && <Text style={styles.tamilName}>{species.tamil_name}</Text>}
          </View>
          {statusColor && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{species.conservation_status}</Text>
            </View>
          )}
        </View>

        {species.is_verified && <Text style={styles.verified}>✅ Verified entry</Text>}

        <View style={styles.metaRow}>
          {!!species.category && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{species.category.icon} {species.category.name}</Text>
            </View>
          )}
          {!!species.typical_size && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>📏 {species.typical_size}</Text>
            </View>
          )}
          {hasLocation && (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${species.latitude},${species.longitude}`)}
            >
              <Text style={[styles.chipText, styles.chipLink]}>📍 View on map</Text>
            </TouchableOpacity>
          )}
        </View>

        <Section title="About" html={species.description} />
        <Section title="Identification" html={species.identification} />
        <Section title="Habitat" html={species.habitat} />
        <Section title="Diet" html={species.diet} />
        <Section title="Behavior" html={species.behavior} />
        <Section title="Interesting Facts" html={species.interesting_facts} />
      </View>
    </ScrollView>
  );
}

function Section({ title, html }: { title: string; html?: string }) {
  if (!html || !html.trim()) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <HtmlText html={html} style={styles.cardBody} paragraphSpacing={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.lg },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  errorText: { color: COLORS.coral, fontSize: FONT_SIZE.md, textAlign: 'center' },
  hero: { backgroundColor: COLORS.deepOcean },
  heroImage: { width: '100%', height: 220 },
  heroPlaceholder: { width: '100%', height: 140, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 64 },
  content: { padding: SPACING.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleBlock: { flex: 1, paddingRight: SPACING.sm },
  commonName: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.primary },
  scientificName: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 2 },
  tamilName: { fontSize: FONT_SIZE.md, color: COLORS.oceanBlue, marginTop: 4 },
  statusBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  statusText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  verified: { fontSize: FONT_SIZE.xs, color: COLORS.success, marginTop: SPACING.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.sm },
  chip: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
  },
  chipText: { fontSize: FONT_SIZE.xs, color: COLORS.deepOcean, fontWeight: '600' },
  chipLink: { color: COLORS.oceanBlue, textDecorationLine: 'underline' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  cardBody: { fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 24 },
});
