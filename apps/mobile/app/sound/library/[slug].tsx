import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Linking } from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { collectItems, fetchLibraryCategories, findCategory } from '@/services/sound-library';
import type { SoundLibraryCategory } from '@/types/sound-library';
import { resolveMediaUrl } from '@/components/HtmlText';

export default function SoundLibraryCategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [categories, setCategories] = useState<SoundLibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    let cancelled = false;
    fetchLibraryCategories()
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch(() => { if (!cancelled) setError('Failed to load sound library'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const category = useMemo(() => findCategory(categories, slug), [categories, slug]);
  const group = useMemo(() => findCategory(categories, groupSlug), [categories, groupSlug]);

  const items = useMemo(() => {
    if (!category) return [];
    const base = group ? collectItems(group) : collectItems(category);
    const needle = query.trim().toLowerCase();
    return needle ? base.filter((item) => item.name.toLowerCase().includes(needle)) : base;
  }, [category, group, query]);

  useEffect(() => {
    if (category?.name) navigation.setOptions({ title: category.name });
  }, [category, navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
        <Text style={styles.loadingText}>Loading sounds…</Text>
      </View>
    );
  }

  if (error || !category) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Category not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const reference = group && group !== category ? group : category;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.headerIcon}>{category.icon || '🌊'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{category.name}</Text>
            <Text style={styles.subtitle}>{category.item_count} sounds</Text>
          </View>
        </View>

        {category.description ? <Text style={styles.description}>{category.description}</Text> : null}

        <TextInput
          style={styles.search}
          placeholder="Search sounds…"
          placeholderTextColor={COLORS.gray[400]}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />

        {category.children.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !groupSlug && styles.chipActive]}
                onPress={() => setGroupSlug(null)}
              >
                <Text style={[styles.chipText, !groupSlug && styles.chipTextActive]}>All ({category.item_count})</Text>
              </TouchableOpacity>
              {category.children.map((child) => (
                <TouchableOpacity
                  key={child.slug}
                  style={[styles.chip, groupSlug === child.slug && styles.chipActive]}
                  onPress={() => setGroupSlug(child.slug)}
                >
                  <Text style={[styles.chipText, groupSlug === child.slug && styles.chipTextActive]}>
                    {child.name.replace(/\s*\(.*\)$/, '')} ({child.item_count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {reference.document_url ? (
          <TouchableOpacity
            style={styles.docButton}
            onPress={() => Linking.openURL(resolveMediaUrl(reference.document_url) || reference.document_url || '')}
          >
            <Text style={styles.docButtonText}>📄 {reference.document_name || 'Reference document'}</Text>
          </TouchableOpacity>
        ) : null}

        {items.length === 0 ? (
          <Text style={styles.emptyText}>No sounds match your search.</Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.slug}
              style={styles.itemCard}
              onPress={() => router.push({ pathname: '/sound/item/[slug]', params: { slug: item.slug } })}
            >
              <Text style={styles.itemIcon}>🎵</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemText}>{item.category_name}</Text>
                {item.document_url ? <Text style={styles.itemDoc}>📄 Has document</Text> : null}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, padding: SPACING.lg },
  loadingText: { marginTop: SPACING.sm, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  errorText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, textAlign: 'center' },
  backButton: { marginTop: SPACING.md, backgroundColor: COLORS.oceanBlue, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  backButtonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.sm },
  back: { marginBottom: SPACING.sm },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.oceanBlue, fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  headerIcon: { fontSize: 32, marginRight: SPACING.sm },
  title: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  description: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.md },
  search: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  chipActive: { backgroundColor: COLORS.oceanBlue, borderColor: COLORS.oceanBlue },
  chipText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  docButton: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  docButtonText: { color: COLORS.oceanBlue, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemIcon: { fontSize: 26, marginRight: SPACING.md },
  itemTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  itemText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  itemDoc: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, marginTop: 4 },
});
