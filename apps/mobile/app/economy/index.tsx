import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import HtmlText from '@/components/HtmlText';

type Tab = 'ideas' | 'schemes' | 'workshops';

const INVESTMENT_COLORS: Record<string, string> = {
  low: COLORS.seaGreen,
  medium: '#F59E0B',
  high: COLORS.coral,
};

export default function EconomyScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('ideas');
  const [ideas, setIdeas] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [i, s, w] = await Promise.allSettled([
        api.get(ENDPOINTS.LIVELIHOOD.BUSINESS_IDEAS),
        api.get(ENDPOINTS.LIVELIHOOD.SCHEMES),
        api.get(ENDPOINTS.LIVELIHOOD.WORKSHOPS),
      ]);
      if (i.status === 'fulfilled') setIdeas((i.value as any).results || (i.value as any) || []);
      if (s.status === 'fulfilled') setSchemes((s.value as any).results || (s.value as any) || []);
      if (w.status === 'fulfilled') setWorkshops((w.value as any).results || (w.value as any) || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.oceanBlue} />}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={styles.title}>Circular Economy</Text>
        <Text style={styles.subtitle}>Sustainable livelihoods from the ocean</Text>
      </View>

      <View style={styles.tabRow}>
        {(['ideas', 'schemes', 'workshops'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'ideas' ? '💡 Ideas' : tab === 'schemes' ? '🏛 Schemes' : '🎓 Workshops'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.oceanBlue} style={{ marginTop: SPACING.xxl }} />
        ) : (
          <>
            {activeTab === 'ideas' && (
              ideas.length === 0 ? (
                <EmptyState icon="💡" text="No business ideas yet" />
              ) : ideas.map((item: any, idx: number) => (
                <TouchableOpacity key={item.id || idx} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.investment_level && (
                      <View style={[styles.investmentBadge, { backgroundColor: (INVESTMENT_COLORS[item.investment_level] || COLORS.gray[400]) + '20' }]}>
                        <Text style={[styles.investmentText, { color: INVESTMENT_COLORS[item.investment_level] || COLORS.gray[600] }]}>
                          {item.investment_level.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  {item.description && <HtmlText html={item.description} style={styles.cardText} paragraphSpacing={4} numberOfLines={3} />}
                  {item.problem && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Problem:</Text>
                      <Text style={styles.infoValue} numberOfLines={2}>{item.problem}</Text>
                    </View>
                  )}
                  {item.environmental_benefit && (
                    <View style={styles.benefitRow}>
                      <Text style={styles.benefitIcon}>🌱</Text>
                      <Text style={styles.benefitText} numberOfLines={2}>{item.environmental_benefit}</Text>
                    </View>
                  )}
                  {(item.investment_min || item.investment_max) && (
                    <Text style={styles.investmentRange}>
                      💰 ₹{item.investment_min?.toLocaleString() || '?'} – ₹{item.investment_max?.toLocaleString() || '?'}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}

            {activeTab === 'schemes' && (
              schemes.length === 0 ? (
                <EmptyState icon="🏛" text="No schemes available" />
              ) : schemes.map((item: any, idx: number) => (
                <TouchableOpacity key={item.id || idx} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.scheme_name}</Text>
                    {item.is_active && <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>}
                  </View>
                  {item.authority && <Text style={styles.cardLocation}>🏛 {item.authority}</Text>}
                  {item.eligibility_occupation && <Text style={styles.cardType}>👥 {item.eligibility_occupation}</Text>}
                  {item.description && <HtmlText html={item.description} style={styles.cardText} paragraphSpacing={4} numberOfLines={3} />}
                  <View style={styles.cardFooter}>
                    {item.benefit_type && <Text style={styles.priceTag}>📋 {item.benefit_type}</Text>}
                    {item.benefit_amount && <Text style={styles.priceTag}>💰 ₹{Number(item.benefit_amount).toLocaleString()}</Text>}
                  </View>
                  {item.deadline && (
                    <Text style={styles.deadline}>⏰ Deadline: {new Date(item.deadline).toLocaleDateString()}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}

            {activeTab === 'workshops' && (
              workshops.length === 0 ? (
                <EmptyState icon="🎓" text="No workshops scheduled" />
              ) : workshops.map((item: any, idx: number) => (
                <TouchableOpacity key={item.id || idx} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.is_free && <View style={styles.freeBadge}><Text style={styles.freeText}>FREE</Text></View>}
                  </View>
                  {item.business_title && <Text style={styles.cardType}>💡 {item.business_title}</Text>}
                  {item.description && <HtmlText html={item.description} style={styles.cardText} paragraphSpacing={4} numberOfLines={2} />}
                  <View style={styles.cardFooter}>
                    <Text style={styles.durationTag}>📅 {new Date(item.date).toLocaleDateString()}</Text>
                    <Text style={styles.durationTag}>⏱ {item.duration_hours}h</Text>
                    {item.fee > 0 && <Text style={styles.priceTag}>💰 ₹{item.fee}</Text>}
                  </View>
                  {item.skills_taught && (
                    <View style={styles.skillsRow}>
                      <Text style={styles.skillsLabel}>Skills:</Text>
                      <Text style={styles.skillsText}>{item.skills_taught}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  header: { backgroundColor: COLORS.deepOcean, padding: SPACING.lg },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.white, opacity: 0.8, marginTop: SPACING.xs },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray[200], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, zIndex: 1 },
  tab: { flex: 1, paddingVertical: SPACING.md + 2, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.seaGreen, backgroundColor: COLORS.foam },
  tabLabel: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], fontWeight: '500' },
  tabLabelActive: { color: COLORS.seaGreen, fontWeight: '700' },
  content: { padding: SPACING.md, paddingTop: SPACING.lg },
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, flex: 1, marginRight: SPACING.sm },
  cardType: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '500', marginBottom: SPACING.xs },
  cardLocation: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], marginBottom: SPACING.xs },
  cardText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], marginBottom: SPACING.sm, lineHeight: 20 },
  investmentBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  investmentText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  investmentRange: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], marginTop: SPACING.xs },
  infoRow: { marginBottom: SPACING.xs },
  infoLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], fontWeight: '600' },
  infoValue: { fontSize: FONT_SIZE.sm, color: COLORS.gray[700] },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FDF4', borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm },
  benefitIcon: { fontSize: 14, marginRight: SPACING.xs, marginTop: 2 },
  benefitText: { fontSize: FONT_SIZE.sm, color: COLORS.seaGreen, flex: 1, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  priceTag: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, fontWeight: '500' },
  durationTag: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  deadline: { fontSize: FONT_SIZE.xs, color: COLORS.coral, marginTop: SPACING.sm },
  activeBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  activeText: { fontSize: FONT_SIZE.xs, color: COLORS.seaGreen, fontWeight: '600' },
  freeBadge: { backgroundColor: COLORS.oceanBlue + '20', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  freeText: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, fontWeight: '700' },
  skillsRow: { flexDirection: 'row', marginTop: SPACING.sm },
  skillsLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], fontWeight: '600', marginRight: SPACING.xs },
  skillsText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[700], flex: 1 },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.gray[500] },
});
