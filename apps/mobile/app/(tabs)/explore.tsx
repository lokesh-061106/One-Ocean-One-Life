import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { t } from '@/i18n';

const EXPLORE_SECTIONS = [
  {
    title: t('learn'),
    icon: '📚',
    items: [
      { label: t('ocean_guides'), icon: '🐋', route: '/guide' },
      { label: 'Marine Mammals', icon: '🐬', route: '/guide?category=mammals' },
      { label: t('fish'), icon: '🐟', route: '/guide?category=fish' },
      { label: t('habitats'), icon: '🪸', route: '/guide?category=habitats' },
      { label: t('ocean_education'), icon: '🎓', route: '/education' },
    ],
  },
  {
    title: t('discover'),
    icon: '🔬',
    items: [
      { label: t('ocean_sounds'), icon: '🎙', route: '/sound' },
      { label: t('marine_sightings'), icon: '🐬', route: '/sighting' },
      { label: 'Fish Catch', icon: '🐟', route: '/catches' },
      { label: 'Observations', icon: '🔍', route: '/observations' },
      { label: t('ocean_map'), icon: '🗺', route: '/map' },
    ],
  },
  {
    title: t('community'),
    icon: '👥',
    items: [
      { label: t('members'), icon: '👤', route: '/community' },
      { label: t('stories'), icon: '📖', route: '/education?category=story' },
      { label: t('events'), icon: '📅', route: '/events' },
      { label: 'Clean-ups', icon: '🏖', route: '/cleanups' },
    ],
  },
  {
    title: t('livelihood'),
    icon: '🌱',
    items: [
      { label: t('circular_economy'), icon: '♻️', route: '/economy' },
      { label: t('business_ideas'), icon: '💡', route: '/economy?type=business' },
      { label: t('government_schemes'), icon: '🏛', route: '/economy?type=schemes' },
    ],
  },
  {
    title: t('ecotourism'),
    icon: '🏖',
    items: [
      { label: t('beaches'), icon: '🏖', route: '/ecotourism' },
      { label: t('experiences'), icon: '🌊', route: '/ecotourism?type=experiences' },
      { label: t('local_businesses'), icon: '🏪', route: '/ecotourism?type=businesses' },
    ],
  },
  {
    title: t('marketplace'),
    icon: '🛒',
    items: [
      { label: 'Browse', icon: '🛍', route: '/marketplace' },
      { label: 'Fishing Gear', icon: '🎣', route: '/marketplace?category=fishing_equipment' },
      { label: 'Research', icon: '🔬', route: '/marketplace?category=research_instruments' },
      { label: 'Recycled', icon: '♻️', route: '/marketplace?category=recycled_products' },
      { label: 'My Orders', icon: '📋', route: '/marketplace/orders' },
    ],
  },
  {
    title: t('impact'),
    icon: '🏆',
    items: [
      { label: t('my_contribution'), icon: '📊', route: '/recognition/score' },
      { label: t('village'), icon: '🏘', route: '/recognition/village' },
      { label: t('ocean_hotspots'), icon: '🔥', route: '/map?layer=hotspots' },
    ],
  },
];

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🧭 Explore</Text>

        {EXPLORE_SECTIONS.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.icon} {section.title}
            </Text>
            <View style={styles.itemsGrid}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.itemCard}
                  onPress={() => router.push(item.route as any)}
                >
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: SPACING.md,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  itemCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  itemLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: COLORS.deepNavy,
    textAlign: 'center',
  },
});
