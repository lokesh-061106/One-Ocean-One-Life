import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { fetchLibraryItem } from '@/services/sound-library';
import type { SoundLibraryItem } from '@/types/sound-library';
import { resolveMediaUrl } from '@/components/HtmlText';
import AudioPlayer from '@/components/sounds/AudioPlayer';

function formatSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SoundItemScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [item, setItem] = useState<SoundLibraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (item?.name) navigation.setOptions({ title: item.name });
  }, [item, navigation]);

  useEffect(() => {
    let cancelled = false;
    fetchLibraryItem(String(slug || ''))
      .then((data) => { if (!cancelled) setItem(data); })
      .catch(() => { if (!cancelled) setError('Failed to load this sound'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const openDocument = (url: string | null, name: string) => {
    const resolved = resolveMediaUrl(url);
    if (!resolved) return;
    Linking.openURL(resolved).catch(() => Alert.alert('Cannot open', `Unable to open ${name}.`));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
        <Text style={styles.loadingText}>Loading sound…</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Sound not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photo = resolveMediaUrl(item.photo_url);
  const spectrogram = resolveMediaUrl(item.spectrogram_url);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.category}>{item.category_name}</Text>

        {item.audio_url ? (
          <View style={styles.playerBlock}>
            <Text style={styles.mediaLabel}>Audio</Text>
            <AudioPlayer uri={resolveMediaUrl(item.audio_url) || item.audio_url} />
          </View>
        ) : null}

        <View style={styles.mediaRow}>
          <View style={styles.mediaBox}>
            <Text style={styles.mediaLabel}>Photo</Text>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.mediaImage} resizeMode="cover" />
            ) : (
              <View style={[styles.mediaImage, styles.mediaPlaceholder]}>
                <Text style={styles.mediaPlaceholderText}>No photo</Text>
              </View>
            )}
          </View>
          <View style={styles.mediaBox}>
            <Text style={styles.mediaLabel}>Spectrogram</Text>
            {spectrogram ? (
              <Image source={{ uri: spectrogram }} style={styles.mediaImage} resizeMode="contain" />
            ) : (
              <View style={[styles.mediaImage, styles.mediaPlaceholder]}>
                <Text style={styles.mediaPlaceholderText}>No spectrogram</Text>
              </View>
            )}
          </View>
        </View>

        {item.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Source</Text>
          <Text style={styles.source}>{item.source}</Text>
        </View>

        {item.document_url ? (
          <TouchableOpacity
            style={styles.docButton}
            onPress={() => openDocument(item.document_url, item.document_name || 'Document')}
          >
            <Text style={styles.docButtonText}>
              📄 {item.document_name || 'Open document'}
              {item.document_size ? ` · ${formatSize(item.document_size)}` : ''}
            </Text>
          </TouchableOpacity>
        ) : null}
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
  retryButton: { marginTop: SPACING.md, backgroundColor: COLORS.oceanBlue, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  retryText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.sm },
  back: { marginBottom: SPACING.sm },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.oceanBlue, fontWeight: '600' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.primary },
  category: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.md },
  playerBlock: { marginBottom: SPACING.md },
  player: {
    height: 48,
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mediaRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  mediaBox: { flex: 1 },
  mediaLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  mediaImage: { width: '100%', height: 140, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.gray[100], borderWidth: 1, borderColor: COLORS.border },
  mediaPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mediaPlaceholderText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  section: { marginBottom: SPACING.md },
  sectionLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  description: { fontSize: FONT_SIZE.sm, color: COLORS.text, lineHeight: 21 },
  source: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  docButton: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  docButtonText: { color: COLORS.oceanBlue, fontSize: FONT_SIZE.sm, fontWeight: '600', textAlign: 'center' },
});
