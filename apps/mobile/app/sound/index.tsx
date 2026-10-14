import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText, { resolveMediaUrl } from '@/components/HtmlText';
import AudioPlayer from '@/components/sounds/AudioPlayer';

interface SoundRecord {
  id: string;
  instrument?: string;
  duration_seconds?: number;
  frequency_range?: string;
  recording_date?: string;
  written_description?: string;
  village_name?: string;
  audio_url?: string | null;
}

export default function SoundIndex() {
  const [sounds, setSounds] = useState<SoundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSounds = async () => {
    try {
      const res = await api.get<{ results?: SoundRecord[] } | SoundRecord[]>(ENDPOINTS.SOUNDS.LIST);
      setSounds(Array.isArray(res) ? res : (res as any).results || []);
    } catch (e) {
      console.error('Failed to load sounds:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ results?: SoundRecord[] } | SoundRecord[]>(ENDPOINTS.SOUNDS.LIST)
      .then((res) => {
        if (cancelled) return;
        setSounds(Array.isArray(res) ? res : (res as any).results || []);
      })
      .catch((e) => { if (!cancelled) console.error('Failed to load sounds:', e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSounds(); }} />}>
      <View style={styles.content}>
        <Text style={styles.title}>Ocean Sounds</Text>
        <Text style={styles.subtitle}>Listen to and record marine sounds</Text>

        <TouchableOpacity style={styles.recordCard} onPress={() => router.push('/sound/record')}>
          <Text style={styles.recordIcon}>🎙</Text>
          <View>
            <Text style={styles.recordTitle}>Record Sound</Text>
            <Text style={styles.recordText}>Capture ocean sounds from your surroundings</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.libraryCard} onPress={() => router.push('/sound/library')}>
          <Text style={styles.libraryIcon}>📚</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.libraryTitle}>Ocean Sound Library</Text>
            <Text style={styles.libraryText}>Browse curated sounds by category and group</Text>
          </View>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : sounds.length === 0 ? (
          <Text style={styles.emptyText}>No sounds recorded yet. Start recording!</Text>
        ) : (
          sounds.map((sound, idx) => (
            <View key={sound.id || idx} style={styles.card}>
              <Text style={styles.cardIcon}>🔊</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{sound.instrument || 'Ocean Recording'}</Text>
                <Text style={styles.cardText}>
                  {sound.duration_seconds ? `${sound.duration_seconds}s` : 'Unknown duration'}
                  {sound.frequency_range ? ` • ${sound.frequency_range}` : ''}
                  {sound.village_name ? ` • ${sound.village_name}` : ''}
                </Text>
                {sound.written_description && (
                  <HtmlText html={sound.written_description} style={styles.cardDesc} paragraphSpacing={4} numberOfLines={2} />
                )}
                {sound.recording_date && (
                  <Text style={styles.cardDate}>{new Date(sound.recording_date).toLocaleDateString('en-IN')}</Text>
                )}
                {sound.audio_url && (
                  <AudioPlayer uri={resolveMediaUrl(sound.audio_url) || sound.audio_url} style={styles.cardPlayer} />
                )}
              </View>
            </View>
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
  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  recordIcon: { fontSize: 28, color: COLORS.white, marginRight: SPACING.md },
  recordTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.white },
  recordText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)' },
  libraryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.oceanBlue },
  libraryIcon: { fontSize: 26, marginRight: SPACING.md },
  libraryTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.oceanBlue },
  libraryText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardIcon: { fontSize: 36, marginRight: SPACING.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  cardDesc: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 4, fontStyle: 'italic' },
  cardDate: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, marginTop: 4 },
  cardPlayer: { marginTop: SPACING.sm },
});
