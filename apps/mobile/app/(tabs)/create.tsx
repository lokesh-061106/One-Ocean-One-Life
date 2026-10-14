import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { t } from '@/i18n';

export default function CreateScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>➕ {t('contribute')}</Text>
      <Text style={styles.subtitle}>Choose what you'd like to contribute</Text>

      <TouchableOpacity
        style={styles.bigCard}
        onPress={() => router.push('/sound/record')}
      >
        <Text style={styles.bigCardIcon}>🎙</Text>
        <Text style={styles.bigCardTitle}>{t('record_sound')}</Text>
        <Text style={styles.bigCardSubtitle}>Record ocean sounds with your device</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bigCard}
        onPress={() => router.push('/sighting/capture')}
      >
        <Text style={styles.bigCardIcon}>📷</Text>
        <Text style={styles.bigCardTitle}>{t('capture_sighting')}</Text>
        <Text style={styles.bigCardSubtitle}>Capture marine mammal sightings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.smallCard}
        onPress={() => router.push('/contribute?type=fish_catch')}
      >
        <Text style={styles.smallCardIcon}>🐟</Text>
        <Text style={styles.smallCardTitle}>Log a Fish Catch</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.smallCard}
        onPress={() => router.push('/contribute?type=observation')}
      >
        <Text style={styles.smallCardIcon}>🔍</Text>
        <Text style={styles.smallCardTitle}>Add an Observation</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.smallCard}
        onPress={() => router.push('/contribute?type=beach_cleanup')}
      >
        <Text style={styles.smallCardIcon}>🏖</Text>
        <Text style={styles.smallCardTitle}>Record a Clean-up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.smallCard}
        onPress={() => router.push('/contribute?type=event')}
      >
        <Text style={styles.smallCardIcon}>📅</Text>
        <Text style={styles.smallCardTitle}>Create Event</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.smallCard}
        onPress={() => router.push('/contribute?type=education_post')}
      >
        <Text style={styles.smallCardIcon}>📝</Text>
        <Text style={styles.smallCardTitle}>Share Knowledge</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.smallCard}
        onPress={() => router.push('/contribute?type=local_knowledge')}
      >
        <Text style={styles.smallCardIcon}>📚</Text>
        <Text style={styles.smallCardTitle}>Local Knowledge</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.smallCard}
        onPress={() => router.push('/contribute')}
      >
        <Text style={styles.smallCardIcon}>➕</Text>
        <Text style={styles.smallCardTitle}>Other contribution types</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.emergencyButton]}
        onPress={() => router.push('/emergency')}
      >
        <Text style={styles.emergencyText}>🚨 {t('emergency')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.foam,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.gray[500],
    marginBottom: SPACING.xl,
  },
  bigCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  bigCardIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  bigCardTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: SPACING.sm,
  },
  bigCardSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  smallCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallCardIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  smallCardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.deepNavy,
  },
  emergencyButton: {
    backgroundColor: COLORS.coral,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  emergencyText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
