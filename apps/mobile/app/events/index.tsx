import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface EventItem {
  id: string;
  slug?: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  participant_count: number;
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  cleanup: '🏖',
  workshop: '🎓',
  awareness: '📢',
  fishing_knowledge: '🎣',
  education: '📚',
  community: '👥',
};

export default function EventsIndex() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await api.get<{ results?: EventItem[] } | EventItem[]>(ENDPOINTS.COMMUNITY.EVENTS);
      setEvents(Array.isArray(res) ? res : (res as any).results || []);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} />}>
      <View style={styles.content}>
        <Text style={styles.title}>Community Events</Text>
        <Text style={styles.subtitle}>Join ocean conservation events</Text>

        <TouchableOpacity style={styles.createCard} onPress={() => router.push('/events/create')}>
          <Text style={styles.createIcon}>➕</Text>
          <View>
            <Text style={styles.createTitle}>Create Event</Text>
            <Text style={styles.createText}>Organize a new community event</Text>
          </View>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <Text style={styles.emptyText}>No events yet. Be the first to create one!</Text>
        ) : (
          events.map((event, idx) => (
            <TouchableOpacity key={event.id || idx} style={styles.card} onPress={() => router.push(`/events/${event.slug || event.id}`)}>
              <Text style={styles.cardIcon}>{EVENT_TYPE_ICONS[event.event_type] || '📅'}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <Text style={styles.cardText}>{formatDate(event.start_date)}</Text>
                <Text style={styles.cardText}>
                  {event.participant_count || 0}/{event.max_participants} participants
                </Text>
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
  createCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  createIcon: { fontSize: 28, color: COLORS.white, marginRight: SPACING.md },
  createTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.white },
  createText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardIcon: { fontSize: 36, marginRight: SPACING.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: FONT_SIZE.lg, color: COLORS.gray[400] },
});
