import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { saveOfflineSighting } from '@/database/offlineDb';
import { useOfflineStore } from '@/stores/offlineStore';
import { api } from '@/services/api';
import { ENDPOINTS, API_URL } from '@/constants/api';
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = (Date.now() + Math.random() * 16) % 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

const BEHAVIORS = [
  { key: 'feeding', label: '🐟 Feeding' },
  { key: 'breaching', label: '🌊 Breaching' },
  { key: 'traveling', label: '🏊 Traveling' },
  { key: 'resting', label: '😴 Resting' },
  { key: 'socializing', label: '👥 Socializing' },
  { key: 'unknown', label: '❓ Unknown' },
];

const SEA_CONDITIONS = ['Calm', 'Slight', 'Moderate', 'Rough'];
const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Rainy', 'Windy', 'Foggy'];

export default function SightingCapture() {
  const { token } = useAuthStore();
  const { isOnline } = useOfflineStore();
  const [species, setSpecies] = useState('');
  const [notes, setNotes] = useState('');
  const [behavior, setBehavior] = useState('unknown');
  const [seaCondition, setSeaCondition] = useState('Calm');
  const [weather, setWeather] = useState('Clear');
  const [numberObserved, setNumberObserved] = useState('1');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [identifying, setIdentifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll access');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      if (isOnline) identifySpecies(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      if (isOnline) identifySpecies(result.assets[0].uri);
    }
  };

  const identifySpecies = async (uri: string) => {
    setIdentifying(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri, type: 'image/jpeg', name: 'sighting.jpg' } as any);
      const result = await api.post(ENDPOINTS.AI.SPECIES_IDENTIFY, formData) as any;
      setAiResult(result);
      if (result.predicted_species) setSpecies(result.predicted_species);
    } catch {} finally {
      setIdentifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!species.trim()) {
      Alert.alert('Error', 'Please enter a species name');
      return;
    }
    setSubmitting(true);
    const sightingId = uuid();
    const contributionId = uuid();
    const now = new Date();
    const data = {
      id: sightingId,
      contribution_id: contributionId,
      species_name: species,
      ai_suggestion: aiResult?.predicted_species || '',
      ai_confidence: aiResult?.confidence || 0,
      number_observed: parseInt(numberObserved) || 1,
      behavior,
      sea_condition: seaCondition,
      weather,
      notes,
      photo_uri: photo,
      sighting_date: now.toISOString().split('T')[0],
      sighting_time: now.toTimeString().split(' ')[0],
      latitude: location?.coords.latitude,
      longitude: location?.coords.longitude,
    };

    try {
      if (isOnline) {
        const API = API_URL;
        const res = await fetch(`${API}/sightings/create/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...data, photo_uri: undefined }),
        });
        if (res.ok) {
          Alert.alert('Success', 'Sighting reported!', [{ text: 'OK', onPress: () => router.back() }]);
        } else {
          throw new Error('Server error');
        }
      } else {
        await saveOfflineSighting(data as any);
        Alert.alert('Saved Offline', 'Will sync when online', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch {
      await saveOfflineSighting(data as any);
      Alert.alert('Saved Offline', 'Will sync when online', [{ text: 'OK', onPress: () => router.back() }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Report Sighting</Text>
        <Text style={styles.subtitle}>Document what you saw in the ocean</Text>

        {photo && <Image source={{ uri: photo }} style={styles.photoPreview} />}

        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Text style={styles.photoButtonText}>🖼 Gallery</Text>
          </TouchableOpacity>
        </View>

        {identifying && <Text style={styles.aiText}>🔬 Identifying species...</Text>}
        {aiResult && aiResult.predicted_species && (
          <View style={styles.aiResult}>
            <Text style={styles.aiTitle}>AI Suggestion</Text>
            <Text style={styles.aiSpecies}>{aiResult.predicted_species}</Text>
            <Text style={styles.aiConfidence}>Confidence: {(aiResult.confidence * 100).toFixed(1)}%</Text>
            {aiResult.common_name && <Text style={styles.aiInfo}>Common: {aiResult.common_name}</Text>}
            {aiResult.tamil_name && <Text style={styles.aiInfo}>Tamil: {aiResult.tamil_name}</Text>}
            <Text style={styles.aiDisclaimer}>⚠ This is an AI suggestion, not a scientific verification</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Species Name *</Text>
          <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholder="e.g., Humpback Whale" />

          <Text style={styles.label}>Number Observed</Text>
          <TextInput style={styles.input} value={numberObserved} onChangeText={setNumberObserved} placeholder="1" keyboardType="numeric" />

          <Text style={styles.label}>Behavior</Text>
          <View style={styles.chipRow}>
            {BEHAVIORS.map((b) => (
              <TouchableOpacity key={b.key} style={[styles.chip, behavior === b.key && styles.chipActive]} onPress={() => setBehavior(b.key)}>
                <Text style={[styles.chipText, behavior === b.key && styles.chipTextActive]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Sea Condition</Text>
          <View style={styles.chipRow}>
            {SEA_CONDITIONS.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, seaCondition === s && styles.chipActive]} onPress={() => setSeaCondition(s)}>
                <Text style={[styles.chipText, seaCondition === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Weather</Text>
          <View style={styles.chipRow}>
            {WEATHER_OPTIONS.map((w) => (
              <TouchableOpacity key={w} style={[styles.chip, weather === w && styles.chipActive]} onPress={() => setWeather(w)}>
                <Text style={[styles.chipText, weather === w && styles.chipTextActive]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Describe the sighting..." multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        {location && (
          <Text style={styles.locationText}>📍 Location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}</Text>
        )}

        <TouchableOpacity style={[styles.submitButton, submitting && styles.disabledButton]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Sighting'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.deepNavy, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], marginBottom: SPACING.lg },
  photoPreview: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, resizeMode: 'cover' },
  photoButtons: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  photoButton: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray[200] },
  photoButtonText: { fontSize: FONT_SIZE.md, color: COLORS.deepNavy, fontWeight: '500' },
  aiText: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, textAlign: 'center', marginBottom: SPACING.md },
  aiResult: { backgroundColor: '#F0F9FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.oceanBlue + '40' },
  aiTitle: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '600', marginBottom: SPACING.xs },
  aiSpecies: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.deepNavy, marginBottom: SPACING.xs },
  aiConfidence: { fontSize: FONT_SIZE.sm, color: COLORS.seaGreen, marginBottom: SPACING.xs },
  aiInfo: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600] },
  aiDisclaimer: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: SPACING.sm, fontStyle: 'italic' },
  section: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.gray[700], marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: { backgroundColor: COLORS.gray[50], borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZE.md, borderWidth: 1, borderColor: COLORS.gray[200], marginBottom: SPACING.sm },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100] },
  chipActive: { backgroundColor: COLORS.oceanBlue },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600] },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  locationText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], textAlign: 'center', marginBottom: SPACING.md },
  submitButton: { backgroundColor: COLORS.seaGreen, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm },
  submitButtonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.md },
  disabledButton: { backgroundColor: COLORS.gray[300] },
  cancelButton: { paddingVertical: SPACING.md, alignItems: 'center' },
  cancelButtonText: { color: COLORS.gray[500], fontSize: FONT_SIZE.md },
});
