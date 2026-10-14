import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useDeviceState } from '@/hooks/useDeviceState';
import { useOfflineStore } from '@/stores/offlineStore';
import { getCachedEmergencyData, findNearestContacts } from '@/database/emergencyDb';
import HtmlText from '@/components/HtmlText';

interface Contact {
  id: string;
  name: string;
  contact_type: string;
  phone: string;
  phone_secondary: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  village_name: string;
  district_name: string;
  distance_km?: number;
}

interface Instruction {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const CONTACT_ICONS: Record<string, string> = {
  coast_guard: '🛟',
  police: '👮',
  hospital: '🏥',
  fire: '🚒',
  disaster: '⚠️',
  village: '👥',
  ngo: '🤝',
};

const CONTACT_COLORS: Record<string, string> = {
  coast_guard: '#1E40AF',
  police: '#1D4ED8',
  hospital: '#DC2626',
  fire: '#EA580C',
  disaster: '#D97706',
  village: '#059669',
  ngo: '#7C3AED',
};

export default function EmergencyScreen() {
  const deviceState = useDeviceState();
  const { cacheEmergency, getEmergencyData, syncAll, pendingCounts } = useOfflineStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [emergencyNumbers, setEmergencyNumbers] = useState<Record<string, string>>({});
  const [nearestContacts, setNearestContacts] = useState<Contact[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadEmergencyData = useCallback(async () => {
    try {
      if (deviceState.isOnline) {
        await cacheEmergency();
      }
      const cached = await getEmergencyData();
      setContacts(cached.contacts || []);
      setInstructions(cached.instructions || []);
      setEmergencyNumbers(cached.emergencyNumbers || {});
      setDataLoaded(true);

      if (deviceState.latitude && deviceState.longitude) {
        const nearest = await findNearestContacts(deviceState.latitude, deviceState.longitude, 5);
        setNearestContacts(nearest as Contact[]);
      }
    } catch (err) {
      console.error('Failed to load emergency data:', err);
      const cached = await getEmergencyData();
      setContacts(cached.contacts || []);
      setInstructions(cached.instructions || []);
      setEmergencyNumbers(cached.emergencyNumbers || {});
      setDataLoaded(true);
    }
  }, [deviceState.isOnline, deviceState.latitude, deviceState.longitude]);

  useEffect(() => {
    loadEmergencyData();
  }, [loadEmergencyData]);

  useEffect(() => {
    if (deviceState.isOnline) {
      syncAll();
    }
  }, [deviceState.isOnline]);

  const onRefresh = async () => {
    setRefreshing(true);
    await deviceState.refresh();
    await loadEmergencyData();
    setRefreshing(false);
  };

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const formatCoords = () => {
    if (!deviceState.latitude || !deviceState.longitude) return 'Acquiring GPS...';
    const lat = deviceState.latitude.toFixed(4);
    const lng = deviceState.longitude.toFixed(4);
    const latDir = deviceState.latitude >= 0 ? 'N' : 'S';
    const lngDir = deviceState.longitude >= 0 ? 'E' : 'W';
    return `${lat}° ${latDir}, ${lng}° ${lngDir}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🚨 EMERGENCY</Text>
          {pendingCounts.total > 0 && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>{pendingCounts.total} pending sync</Text>
            </View>
          )}
        </View>

        {/* Device Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>{deviceState.isOnline ? '🟢' : '🔴'}</Text>
              <Text style={styles.statusLabel}>Network</Text>
              <Text style={styles.statusValue}>
                {deviceState.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>{deviceState.isGpsEnabled ? '🟢' : '🔴'}</Text>
              <Text style={styles.statusLabel}>GPS</Text>
              <Text style={styles.statusValue}>
                {deviceState.isGpsEnabled ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>📡</Text>
              <Text style={styles.statusLabel}>Type</Text>
              <Text style={styles.statusValue}>{deviceState.networkType || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Current Location */}
        <View style={styles.locationCard}>
          <Text style={styles.cardTitle}>📍 Your Current Location</Text>
          <Text style={styles.coordinates}>{formatCoords()}</Text>
          {deviceState.locationError && (
            <Text style={styles.locationError}>{deviceState.locationError}</Text>
          )}
        </View>

        {/* Quick Emergency Numbers */}
        <View style={styles.quickNumbersCard}>
          <Text style={styles.cardTitle}>Emergency Numbers</Text>
          <View style={styles.quickNumbersGrid}>
            {Object.entries(emergencyNumbers).map(([key, number]) => (
              <TouchableOpacity
                key={key}
                style={styles.quickNumberItem}
                onPress={() => callNumber(number)}
              >
                <Text style={styles.quickNumberIcon}>{CONTACT_ICONS[key] || '📞'}</Text>
                <Text style={styles.quickNumberLabel}>{key.replace(/_/g, ' ')}</Text>
                <Text style={styles.quickNumberValue}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearest Contacts */}
        {nearestContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearest to You</Text>
            {nearestContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[styles.contactCard, { borderLeftColor: CONTACT_COLORS[contact.contact_type] || COLORS.gray[400] }]}
                onPress={() => callNumber(contact.phone)}
              >
                <Text style={styles.contactIcon}>{CONTACT_ICONS[contact.contact_type] || '📞'}</Text>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>📞 {contact.phone}</Text>
                  {contact.village_name && (
                    <Text style={styles.contactLocation}>📍 {contact.village_name}</Text>
                  )}
                </View>
                <View style={[styles.callButton, { backgroundColor: CONTACT_COLORS[contact.contact_type] || COLORS.seaGreen }]}>
                  <Text style={styles.callText}>Call</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* All Contacts by Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Emergency Contacts</Text>
          {contacts.length === 0 && dataLoaded && (
            <Text style={styles.noData}>No contacts cached. Pull to refresh.</Text>
          )}
          {contacts.map((contact: Contact) => (
            <TouchableOpacity
              key={contact.id}
              style={[styles.contactCard, { borderLeftColor: CONTACT_COLORS[contact.contact_type] || COLORS.gray[400] }]}
              onPress={() => callNumber(contact.phone)}
            >
              <Text style={styles.contactIcon}>{CONTACT_ICONS[contact.contact_type] || '📞'}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>📞 {contact.phone}</Text>
                {contact.address && (
                  <Text style={styles.contactLocation}>📍 {contact.address}</Text>
                )}
              </View>
              <View style={[styles.callButton, { backgroundColor: CONTACT_COLORS[contact.contact_type] || COLORS.seaGreen }]}>
                <Text style={styles.callText}>Call</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Instructions */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>⚠️ Safety Instructions</Text>
          {instructions.map((instruction) => (
            <View key={instruction.id} style={styles.instructionItem}>
              <Text style={styles.instructionTitle}>{instruction.title}</Text>
              <HtmlText html={instruction.description} style={styles.instructionDesc} paragraphSpacing={6} />
            </View>
          ))}
        </View>
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
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.coral,
  },
  syncBadge: {
    backgroundColor: COLORS.sand,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  syncBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  statusLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  statusValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.deepNavy,
  },
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: SPACING.sm,
  },
  coordinates: {
    fontSize: FONT_SIZE.md,
    color: COLORS.oceanBlue,
    fontWeight: '500',
  },
  locationError: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.coral,
    marginTop: SPACING.xs,
  },
  quickNumbersCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickNumbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickNumberItem: {
    width: '31%',
    backgroundColor: COLORS.foam,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  quickNumberIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  quickNumberLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[600],
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  quickNumberValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.deepNavy,
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
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  contactIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.deepNavy,
  },
  contactPhone: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  contactLocation: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  callButton: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  callText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  noData: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[400],
    textAlign: 'center',
    padding: SPACING.lg,
  },
  safetyCard: {
    backgroundColor: COLORS.sand,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  safetyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: SPACING.md,
  },
  instructionItem: {
    marginBottom: SPACING.md,
  },
  instructionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.deepNavy,
    marginBottom: 2,
  },
  instructionDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[700],
    lineHeight: 20,
  },
});
