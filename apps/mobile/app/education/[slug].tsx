import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

interface GalleryImage {
  id: string;
  image: string;
  caption?: string;
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  post_type: string;
  category_name?: string;
  author_name?: string;
  reactions_count: number;
  views_count: number;
  is_verified: boolean;
  created_at: string;
  image?: string | null;
  images?: GalleryImage[];
}

export default function EducationDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await api.get<PostDetail>(`${ENDPOINTS.EDUCATION.POSTS}${slug}/`);
        setPost(res as any);
      } catch (e) {
        console.error('Failed to load post:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.oceanBlue} /></View>;
  }

  if (!post) {
    return <View style={styles.center}><Text style={styles.emptyText}>Article not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.meta}>
          {post.category_name || post.post_type} • by {post.author_name || 'Anonymous'}
          {post.is_verified && ' • ✅ Verified'}
        </Text>
        <Text style={styles.stats}>❤️ {post.reactions_count} reactions • 👁 {post.views_count} views</Text>

        {!!post.image && (
          <Image source={{ uri: post.image }} style={styles.coverImage} resizeMode="cover" />
        )}

        <View style={styles.card}>
          <HtmlText html={post.content} style={styles.body} />
        </View>

        {!!post.images?.length && (
          <View style={styles.gallery}>
            <Text style={styles.galleryTitle}>📷 Photos</Text>
            {post.images.map((item) => (
              <View key={item.id} style={styles.galleryItem}>
                <Image source={{ uri: item.image }} style={styles.galleryImage} resizeMode="cover" />
                {!!item.caption && <Text style={styles.caption}>{item.caption}</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  meta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  stats: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  body: { fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 24 },
  coverImage: { width: '100%', height: 210, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, backgroundColor: COLORS.lightBlue },
  gallery: { marginTop: SPACING.md },
  galleryTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.sm },
  galleryItem: { marginBottom: SPACING.md },
  galleryImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.lightBlue },
  caption: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 6, textAlign: 'center' },
});
