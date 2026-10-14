import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface SitemapItem {
  title: string;
  path: string;
  pathname?: string;
  params?: Record<string, string>;
}

interface SitemapSection {
  label: string;
  items: SitemapItem[];
}

const LIMIT = 8;

const SECTIONS: {
  label: string;
  endpoint: string;
  toItem: (row: Record<string, any>) => SitemapItem | null;
}[] = [
  {
    label: 'Marine Sightings',
    endpoint: ENDPOINTS.SIGHTINGS.LIST,
    toItem: (row) =>
      row.slug
        ? { title: row.species_name || row.ai_species_suggestion || 'Marine sighting', path: `/sighting/${row.slug}` }
        : null,
  },
  {
    label: 'Guide Categories',
    endpoint: ENDPOINTS.GUIDES.CATEGORIES,
    toItem: (row) =>
      row.slug
        ? {
            title: row.name || 'Guide category',
            path: `/guide/${row.slug}`,
            pathname: '/guide/[slug]',
            params: { slug: row.slug, name: row.name || 'Species' },
          }
        : null,
  },
  {
    label: 'Guide Species',
    endpoint: ENDPOINTS.GUIDES.SPECIES,
    toItem: (row) =>
      row.slug
        ? { title: row.common_name || row.scientific_name || 'Species', path: `/guide/species/${row.slug}` }
        : null,
  },
  {
    label: 'Education',
    endpoint: ENDPOINTS.EDUCATION.POSTS,
    toItem: (row) => (row.slug ? { title: row.title || 'Article', path: `/education/${row.slug}` } : null),
  },
  {
    label: 'Events',
    endpoint: ENDPOINTS.COMMUNITY.EVENTS,
    toItem: (row) => (row.slug ? { title: row.title || 'Event', path: `/events/${row.slug}` } : null),
  },
  {
    label: 'Sound Library Categories',
    endpoint: ENDPOINTS.SOUNDS.LIBRARY_CATEGORIES,
    toItem: (row) => (row.slug ? { title: row.name || 'Sound category', path: `/sound/library/${row.slug}` } : null),
  },
  {
    label: 'Sound Library Items',
    endpoint: ENDPOINTS.SOUNDS.LIBRARY_ITEMS,
    toItem: (row) => (row.slug ? { title: row.title || row.name || 'Sound', path: `/sound/item/${row.slug}` } : null),
  },
  {
    label: 'Marketplace Products',
    endpoint: ENDPOINTS.MARKETPLACE.PRODUCTS,
    toItem: (row) => (row.slug ? { title: row.name || 'Product', path: `/marketplace/${row.slug}` } : null),
  },
  {
    label: 'Vendors',
    endpoint: ENDPOINTS.MARKETPLACE.VENDORS,
    toItem: (row) => (row.slug ? { title: row.shop_name || 'Vendor', path: `/marketplace/vendor/${row.slug}` } : null),
  },
];

export default function SitemapScreen() {
  const [sections, setSections] = useState<SitemapSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await Promise.all(
        SECTIONS.map(async (def): Promise<SitemapSection> => {
          try {
            const res = await api.get<any>(def.endpoint);
            const rows: Record<string, any>[] = res?.results || res || [];
            const items = rows.slice(0, LIMIT).map(def.toItem).filter((item): item is SitemapItem => !!item);
            return { label: def.label, items };
          } catch {
            return { label: def.label, items: [] };
          }
        }),
      );
      if (cancelled) return;
      setSections(loaded.filter((section) => section.items.length > 0));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const open = (item: SitemapItem) => {
    if (item.pathname && item.params) {
      router.push({ pathname: item.pathname as any, params: item.params });
      return;
    }
    router.push(item.path as any);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
        <Text style={styles.centerText}>Loading links…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Live content links — every row shows the real URL used by the app.</Text>

      {sections.length === 0 && <Text style={styles.empty}>No links available right now.</Text>}

      {sections.map((section) => (
        <View key={section.label} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.label}</Text>
          <View style={styles.card}>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.path}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => open(item)}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowPath} numberOfLines={1}>
                    {item.path.replace(/^\//, '')}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.lg },
  centerText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  intro: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  empty: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg },
  section: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  rowPath: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, marginTop: 2 },
  chevron: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary },
});
