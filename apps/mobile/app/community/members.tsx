import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface Member {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  village_name?: string;
}

export default function CommunityMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await api.get<{ results?: Member[] } | Member[]>(ENDPOINTS.COMMUNITY.MEMBERS);
      setMembers(Array.isArray(res) ? res : (res as any).results || []);
    } catch (e) {
      console.error('Failed to load members:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchMembers(); };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'FISHERMAN': return '🎣';
      case 'SCIENTIST': return '🔬';
      case 'EDUCATOR': return '📚';
      case 'TOURISM_PROVIDER': return '🏖';
      case 'NGO': return '🌿';
      case 'RESEARCHER': return '🔬';
      case 'COMMUNITY_MEMBER': return '👤';
      default: return '👤';
    }
  };

  const formatRole = (role: string) => (role || 'Member').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.content}>
        <Text style={styles.title}>Community Members</Text>
        <Text style={styles.subtitle}>Connect with fellow ocean guardians</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : members.length === 0 ? (
          <Text style={styles.emptyText}>No members found yet.</Text>
        ) : (
          members.map((member, idx) => (
            <View key={member.id || idx} style={styles.card}>
              <Text style={styles.cardIcon}>{getRoleEmoji(member.role)}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{member.first_name || ''} {member.last_name || ''}</Text>
                <Text style={styles.cardText}>{formatRole(member.role)}{member.village_name ? ` • ${member.village_name}` : ''}</Text>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardIcon: { fontSize: 36, marginRight: SPACING.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
});
