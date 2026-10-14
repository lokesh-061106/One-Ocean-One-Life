import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { t } from '@/i18n';

export default function CommunityScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>👥 {t('community')}</Text>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push('/community/members')}
        >
          <Text style={styles.sectionIcon}>👤</Text>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{t('members')}</Text>
            <Text style={styles.sectionSubtitle}>Meet community members</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push('/events')}
        >
          <Text style={styles.sectionIcon}>📅</Text>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{t('events')}</Text>
            <Text style={styles.sectionSubtitle}>Upcoming events near you</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push('/education')}
        >
          <Text style={styles.sectionIcon}>📖</Text>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{t('stories')}</Text>
            <Text style={styles.sectionSubtitle}>Community knowledge</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push('/recognition/leaderboard')}
        >
          <Text style={styles.sectionIcon}>🏆</Text>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{t('annual_recognition')}</Text>
            <Text style={styles.sectionSubtitle}>Leaderboards & awards</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.emergencyButton]}
          onPress={() => router.push('/emergency')}
        >
          <Text style={styles.emergencyText}>🚨 {t('emergency')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.foam,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: SPACING.lg,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 32,
    marginRight: SPACING.lg,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.deepNavy,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  emergencyButton: {
    backgroundColor: COLORS.coral,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  emergencyText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
