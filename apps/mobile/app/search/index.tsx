import { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface SearchResult {
  title: string;
  type: string;
  detail: string;
  url?: string;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCategories = [
    { label: 'Guides', icon: '🐋', type: 'guides' },
    { label: 'Members', icon: '👤', type: 'members' },
    { label: 'Events', icon: '📅', type: 'events' },
    { label: 'Sounds', icon: '🎙', type: 'sounds' },
    { label: 'Sightings', icon: '📷', type: 'sightings' },
  ];

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await api.get<{ results?: SearchResult[] } | SearchResult[]>(ENDPOINTS.SEARCH, { q: q.trim() });
      setResults(Array.isArray(res) ? res : (res as any).results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search the ocean..."
          placeholderTextColor={COLORS.gray[400]}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => doSearch(query)}
          returnKeyType="search"
          autoFocus
        />

        <View style={styles.categoriesGrid}>
          {searchCategories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryChip}
              onPress={() => { setQuery(cat.label.toLowerCase()); doSearch(cat.label.toLowerCase()); }}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 20 }} />}

        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Results ({results.length})</Text>
            {results.map((result, index) => (
              <TouchableOpacity key={index} style={styles.resultCard}>
                <Text style={styles.resultTitle}>{result.title}</Text>
                <Text style={styles.resultType}>{result.type}</Text>
                <Text style={styles.resultSubtitle}>{result.detail}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && query.length > 0 && results.length === 0 && (
          <Text style={styles.emptyText}>No results found for "{query}"</Text>
        )}

        {query.length === 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>Popular Searches</Text>
            {['Dolphin', 'Beach cleanup', 'Ocean sound', 'Sea turtle', 'Whale shark'].map((term) => (
              <TouchableOpacity key={term} style={styles.suggestionChip} onPress={() => { setQuery(term); doSearch(term); }}>
                <Text style={styles.suggestionText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  content: { padding: SPACING.md },
  searchInput: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZE.lg, color: COLORS.gray[900], marginBottom: SPACING.lg },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  categoryIcon: { fontSize: 16, marginRight: SPACING.xs },
  categoryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.deepNavy },
  resultsSection: { marginBottom: SPACING.xl },
  resultsTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.md },
  resultCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  resultTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy },
  resultType: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, marginTop: 2 },
  resultSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], marginTop: SPACING.xs },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  suggestionsSection: { marginBottom: SPACING.xl },
  suggestionsTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.md },
  suggestionChip: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.sm, alignSelf: 'flex-start' },
  suggestionText: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue },
});
