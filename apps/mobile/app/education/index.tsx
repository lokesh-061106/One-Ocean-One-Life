import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface EducationPost {
  id: string;
  slug?: string;
  title: string;
  content: string;
  post_type: string;
  category_name?: string;
  author_name?: string;
  reactions_count: number;
  views_count: number;
  created_at: string;
}

const POST_TYPE_ICONS: Record<string, string> = {
  story: '📖',
  tutorial: '🔧',
  blog: '📝',
  knowledge: '🧠',
  experience: '🌊',
  news: '📰',
};

export default function EducationIndex() {
  const [posts, setPosts] = useState<EducationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await api.get<{ results?: EducationPost[] } | EducationPost[]>(ENDPOINTS.EDUCATION.POSTS);
      setPosts(Array.isArray(res) ? res : (res as any).results || []);
    } catch (e) {
      console.error('Failed to load education posts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} />}>
      <View style={styles.content}>
        <Text style={styles.title}>Ocean Education</Text>
        <Text style={styles.subtitle}>Learn about marine conservation</Text>

        <TouchableOpacity style={styles.createCard} onPress={() => router.push('/education/create')}>
          <Text style={styles.createIcon}>📝</Text>
          <View>
            <Text style={styles.createTitle}>Create Lesson</Text>
            <Text style={styles.createText}>Share your knowledge with the community</Text>
          </View>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: 40 }} />
        ) : posts.length === 0 ? (
          <Text style={styles.emptyText}>No posts yet. Share the first lesson!</Text>
        ) : (
          posts.map((post, idx) => (
            <TouchableOpacity key={post.id || idx} style={styles.card} onPress={() => router.push(`/education/${post.slug || post.id}`)}>
              <Text style={styles.cardIcon}>{POST_TYPE_ICONS[post.post_type] || '📄'}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{post.title}</Text>
                <Text style={styles.cardMeta}>{post.category_name || post.post_type} • by {post.author_name || 'Anonymous'}</Text>
                <Text style={styles.cardStats}>❤️ {post.reactions_count} • 👁 {post.views_count}</Text>
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
  cardMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  cardStats: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, marginTop: 4 },
});
