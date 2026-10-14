import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS, API_URL } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

function mediaUri(src?: string | null): string | null {
  if (!src) return null;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(src)) {
    return src.replace(/^https?:\/\/[^/]+/i, API_ORIGIN);
  }
  if (/^https?:\/\//i.test(src)) return src;
  return `${API_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`;
}

interface SightingImage {
  id: string;
  image: string;
  caption?: string | null;
}

interface SightingDoc {
  id: string;
  document: string;
  name: string;
  file_type: string;
  file_size: number;
}

interface SightingDetail {
  id: string;
  slug?: string;
  species_name?: string | null;
  species?: { common_name?: string; scientific_name?: string } | string | null;
  category_name?: string | null;
  status?: string;
  contributor?: string;
  village_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ai_species_suggestion?: string;
  ai_confidence?: number | null;
  number_observed?: number;
  behavior?: string;
  sea_condition?: string;
  weather?: string;
  notes?: string;
  sighting_date?: string | null;
  sighting_time?: string | null;
  photo?: string | null;
  video?: string | null;
  images?: SightingImage[];
  documents?: SightingDoc[];
}

const BEHAVIOR_EMOJI: Record<string, string> = {
  feeding: '🍽',
  playing: '🎭',
  resting: '😴',
  traveling: '🏊',
  breeding: '💕',
};

const STATUS_COLOR: Record<string, string> = {
  verified: COLORS.success,
  pending: COLORS.warning,
  approved: COLORS.success,
  rejected: COLORS.error,
};

function speciesName(s: SightingDetail): string {
  if (s.species_name) return s.species_name;
  if (typeof s.species === 'object' && s.species) {
    return s.species.common_name || s.species.scientific_name || 'Unknown species';
  }
  if (s.ai_species_suggestion) return s.ai_species_suggestion;
  return 'Unknown species';
}

function observerName(email?: string): string {
  if (!email) return '';
  return email.split('@')[0].replace(/[._-]+/g, ' ');
}

function formatDate(d?: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(t?: string | null): string {
  return t ? String(t).slice(0, 5) : '';
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SightingDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [sighting, setSighting] = useState<SightingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useEffect(() => {
    if (sighting) navigation.setOptions({ title: speciesName(sighting) || 'Sighting Details' });
  }, [sighting, navigation]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await api.get<SightingDetail>(`${ENDPOINTS.SIGHTINGS.LIST}${slug}/`);
        setSighting(res as any);
      } catch (e) {
        console.error('Failed to load sighting:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
        <Text style={styles.centerText}>Loading sighting…</Text>
      </View>
    );
  }

  if (!sighting) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🐬</Text>
        <Text style={styles.emptyText}>Sighting not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = speciesName(sighting);
  const gallery: { uri: string; caption?: string | null }[] = [];
  const mainPhoto = mediaUri(sighting.photo);
  if (mainPhoto) gallery.push({ uri: mainPhoto, caption: name });
  (sighting.images ?? []).forEach((img) => {
    const uri = mediaUri(img.image);
    if (uri) gallery.push({ uri, caption: img.caption });
  });
  const observer = observerName(sighting.contributor);
  const hasCoords =
    sighting.latitude != null && sighting.longitude != null && sighting.latitude !== 0 && sighting.longitude !== 0;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${name} — Marine Sighting`,
        message: [
          name,
          sighting.sighting_date ? formatDate(sighting.sighting_date) : '',
          `${API_ORIGIN.replace('/api/v1', '')}/sightings/${sighting.slug || sighting.id}`,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {gallery.length ? (
            <Image source={{ uri: gallery[Math.min(activePhoto, gallery.length - 1)].uri }} style={styles.heroImage} />
          ) : (
            <LinearGradient colors={['#063B4C', '#087EA4', '#16A085'] as const} style={styles.heroImage}>
              <Text style={styles.heroEmoji}>🌊</Text>
            </LinearGradient>
          )}
          <LinearGradient
            colors={['rgba(6,59,76,0.75)', 'rgba(6,59,76,0.1)', 'rgba(6,59,76,0)']}
            style={styles.heroShade}
            pointerEvents="none"
          />

          <View style={[styles.heroBar, { paddingTop: insets.top + SPACING.sm }]}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()} accessibilityLabel="Go back">
              <Text style={styles.roundBtnText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn} onPress={handleShare} accessibilityLabel="Share sighting">
              <Text style={styles.roundBtnText}>↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroCaption}>
            <View style={styles.chipRow}>
              {sighting.category_name && (
                <View style={[styles.chip, styles.chipDark]}>
                  <Text style={styles.chipDarkText}>{sighting.category_name}</Text>
                </View>
              )}
              {sighting.status && (
                <View style={[styles.chip, { backgroundColor: STATUS_COLOR[sighting.status] || COLORS.oceanBlue }]}>
                  <Text style={styles.chipText}>{sighting.status}</Text>
                </View>
              )}
              {(sighting.number_observed ?? 1) > 1 && (
                <View style={[styles.chip, styles.chipDark]}>
                  <Text style={styles.chipDarkText}>×{sighting.number_observed} seen</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroTitle} numberOfLines={3}>
              {name}
            </Text>
            <View style={styles.metaRow}>
              {!!sighting.sighting_date && (
                <Text style={styles.metaText}>
                  📅 {formatDate(sighting.sighting_date)}
                  {formatTime(sighting.sighting_time) ? ` · ${formatTime(sighting.sighting_time)}` : ''}
                </Text>
              )}
              {!!observer && <Text style={styles.metaText}>👤 {observer}</Text>}
              {!!sighting.village_name && <Text style={styles.metaText}>📍 {sighting.village_name}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Quick stats */}
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{sighting.number_observed ?? 1}</Text>
              <Text style={styles.statLabel}>Observed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {sighting.ai_confidence ? `${Math.round(sighting.ai_confidence * 100)}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>AI confidence</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { textTransform: 'capitalize', fontSize: FONT_SIZE.md }]}>
                {sighting.status || '—'}
              </Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Observation details</Text>
            {!!sighting.behavior && (
              <DetailRow label="Behavior" value={`${BEHAVIOR_EMOJI[sighting.behavior] ?? '•'} ${sighting.behavior}`} />
            )}
            {!!sighting.sea_condition && <DetailRow label="Sea condition" value={`🌊 ${sighting.sea_condition}`} />}
            {!!sighting.weather && <DetailRow label="Weather" value={`☁️ ${sighting.weather}`} />}
            {!!sighting.sighting_date && (
              <DetailRow
                label="Sighted on"
                value={`${formatDate(sighting.sighting_date)}${
                  formatTime(sighting.sighting_time) ? ` at ${formatTime(sighting.sighting_time)}` : ''
                }`}
              />
            )}
            {!!sighting.ai_species_suggestion && (
              <DetailRow
                label="AI suggestion"
                value={`${sighting.ai_species_suggestion}${
                  sighting.ai_confidence ? ` · ${(sighting.ai_confidence * 100).toFixed(0)}%` : ''
                }`}
              />
            )}
            {!!observer && <DetailRow label="Observer" value={observer} />}
            {!!sighting.village_name && <DetailRow label="Location" value={sighting.village_name} />}
          </View>

          {/* Photos */}
          {gallery.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Photos <Text style={styles.cardTitleMuted}>({gallery.length})</Text>
              </Text>
              <Image
                source={{ uri: gallery[Math.min(activePhoto, gallery.length - 1)].uri }}
                style={styles.mainPhoto}
                resizeMode="cover"
              />
              {gallery[Math.min(activePhoto, gallery.length - 1)].caption ? (
                <Text style={styles.caption}>{gallery[Math.min(activePhoto, gallery.length - 1)].caption}</Text>
              ) : null}
              {gallery.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                  {gallery.map((g, i) => (
                    <TouchableOpacity key={`${g.uri}-${i}`} onPress={() => setActivePhoto(i)} activeOpacity={0.8}>
                      <Image
                        source={{ uri: g.uri }}
                        style={[styles.thumb, i === activePhoto && styles.thumbActive]}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About this sighting</Text>
            {sighting.notes ? (
              <HtmlText html={sighting.notes} style={styles.body} paragraphSpacing={8} />
            ) : (
              <Text style={styles.muted}>No description was provided for this sighting.</Text>
            )}
          </View>

          {/* Documents */}
          {(sighting.documents?.length ?? 0) > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Documents</Text>
              {sighting.documents!.map((doc) => {
                const uri = mediaUri(doc.document);
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.docRow}
                    onPress={() => uri && Linking.openURL(uri)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.docIcon}>
                      <Text style={styles.docIconText}>📄</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.docMeta}>
                        {String(doc.file_type || '').toUpperCase()} · {formatFileSize(doc.file_size)}
                      </Text>
                    </View>
                    <Text style={styles.docOpen}>Open ↗</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Location */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            {hasCoords ? (
              <>
                <Text style={styles.coords}>
                  {sighting.latitude!.toFixed(4)}, {sighting.longitude!.toFixed(4)}
                </Text>
                {!!sighting.village_name && <Text style={styles.muted}>{sighting.village_name}</Text>}
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.openstreetmap.org/?mlat=${sighting.latitude}&mlon=${sighting.longitude}#map=14/${sighting.latitude}/${sighting.longitude}`,
                    )
                  }
                >
                  <Text style={styles.linkBtnText}>Open in Maps ↗</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.muted}>{sighting.village_name || 'No location recorded.'}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share this sighting</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.lg },
  centerText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  emptyIcon: { fontSize: 44, marginBottom: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  backLink: { fontSize: FONT_SIZE.md, color: COLORS.oceanBlue, fontWeight: '600' },

  hero: { position: 'relative', width: '100%', height: 280, backgroundColor: COLORS.deepOcean },
  heroImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 64 },
  heroShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnText: { color: COLORS.white, fontSize: 24, lineHeight: 26, fontWeight: '600' },
  heroCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: SPACING.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  chip: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  chipDark: { backgroundColor: 'rgba(255,255,255,0.22)' },
  chipText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'capitalize' },
  chipDarkText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  heroTitle: { color: COLORS.white, fontSize: FONT_SIZE.xxxl, fontWeight: '800', lineHeight: 34 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  metaText: { color: 'rgba(255,255,255,0.9)', fontSize: FONT_SIZE.xs },

  content: { padding: SPACING.md, marginTop: -SPACING.lg },
  statRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.oceanBlue },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.sm },
  cardTitleMuted: { fontWeight: '400', letterSpacing: 0, textTransform: 'none' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flexShrink: 0 },
  detailValue: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '600', textTransform: 'capitalize', textAlign: 'right', flex: 1 },

  mainPhoto: { width: '100%', height: 220, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.lightBlue },
  caption: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 6, textAlign: 'center' },
  thumbRow: { marginTop: SPACING.sm, flexDirection: 'row' },
  thumb: { width: 68, height: 52, borderRadius: BORDER_RADIUS.sm, marginRight: 8, opacity: 0.6, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { opacity: 1, borderColor: COLORS.oceanBlue },

  body: { fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 23 },
  muted: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontStyle: 'italic' },

  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  docIcon: { width: 38, height: 38, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.lightBlue, alignItems: 'center', justifyContent: 'center' },
  docIconText: { fontSize: 18 },
  docName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  docMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  docOpen: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, fontWeight: '700' },

  coords: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  linkBtn: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.oceanBlue,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  linkBtnText: { color: COLORS.oceanBlue, fontSize: FONT_SIZE.sm, fontWeight: '700' },

  shareBtn: {
    backgroundColor: COLORS.oceanBlue,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.ocean,
  },
  shareBtnText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
});
