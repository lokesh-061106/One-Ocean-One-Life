import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  participant_count: number;
  is_published: boolean;
  organizer_name?: string;
}

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await api.get<EventDetail>(`${ENDPOINTS.COMMUNITY.EVENTS}${slug}/`);
        setEvent(res as any);
      } catch (e) {
        console.error('Failed to load event:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.oceanBlue} /></View>;
  }

  if (!event) {
    return <View style={styles.center}><Text style={styles.emptyText}>Event not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>{event.event_type.replace(/_/g, ' ')} • by {event.organizer_name || 'Unknown'}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Date & Time</Text>
          <Text style={styles.cardValue}>{formatDate(event.start_date)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Participants</Text>
          <Text style={styles.cardValue}>{event.participant_count || 0} / {event.max_participants}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Description</Text>
          <HtmlText html={event.description} style={styles.cardDescription} paragraphSpacing={6} />
        </View>

        <TouchableOpacity style={styles.joinButton} onPress={() => Alert.alert('Registered', 'You have joined this event!')}>
          <Text style={styles.joinButtonText}>Join Event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  meta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg, textTransform: 'capitalize' },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  cardValue: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  cardDescription: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
  joinButton: { backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  joinButtonText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '600' },
});
