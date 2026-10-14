import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { API_URL, ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/stores/authStore';
import { saveOfflineContribution } from '@/database/offlineDb';

interface Choice {
  value: string;
  label: string;
}

interface WizardField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  section?: string;
  help?: string;
  choices?: Choice[];
  min?: number;
}

interface MediaSlot {
  field: string;
  label: string;
}

interface WizardType {
  value: string;
  label: string;
  description: string;
  icon: string;
  primary?: boolean;
  requires_geotag?: boolean;
  fields?: WizardField[];
  text_fields?: { key: string; label: string; required?: boolean }[];
  media?: { required?: MediaSlot[]; any_of?: MediaSlot[]; optional?: MediaSlot[] };
}

interface WizardConfig {
  types: WizardType[];
  contributor_types?: Choice[];
  villages?: Choice[];
}

const TYPE_ICONS: Record<string, string> = {
  ocean_sound: '🎙',
  marine_sighting: '🐬',
  fish_catch: '🐟',
  education_post: '🎓',
  event: '📅',
  beach_cleanup: '🏖',
  local_knowledge: '📚',
  observation: '🔍',
};

const NUMERIC_TYPES = new Set(['integer', 'float', 'number']);

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Date.now() + Math.random() * 16) % 16 | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function ContributeScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const { token } = useAuthStore();

  const [config, setConfig] = useState<WizardConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  // This project's router shim has no setParams, so the chosen type lives in
  // local state (seeded from the ?type= param) rather than the URL.
  const [selectedType, setSelectedType] = useState<string>(params.type || '');

  const [title, setTitle] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}${ENDPOINTS.CONTRIBUTIONS.WIZARD_CONFIG}`);
        const data: WizardConfig = await res.json();
        if (!cancelled) setConfig(data);
      } catch (e) {
        console.error('Failed to load wizard config:', e);
        if (!cancelled) Alert.alert('Offline', 'Could not load the contribution form.');
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const wizardType = useMemo(
    () => config?.types.find((t) => t.value === selectedType) || null,
    [config, selectedType]
  );

  const setValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll access');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }, []);

  const captureLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant location access');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
  }, []);

  const missingRequired = useMemo(() => {
    if (!wizardType) return [];
    return (wizardType.fields || [])
      .filter((f) => f.required && f.type !== 'choice' && !(values[f.key] || '').trim())
      .map((f) => f.label);
  }, [wizardType, values]);

  const mediaRequiresPhoto =
    !!wizardType?.media?.any_of?.some((slot) => slot.field === 'images') &&
    !wizardType?.media?.any_of?.some((slot) => slot.field === 'video');

  const handleSubmit = useCallback(async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Please log in to share a contribution.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log in', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (missingRequired.length > 0) {
      Alert.alert('Missing details', `Please fill in: ${missingRequired.join(', ')}`);
      return;
    }
    if (mediaRequiresPhoto && !photoUri) {
      Alert.alert('Photo needed', 'This contribution type needs at least one photo.');
      return;
    }

    const metadata: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value != null && String(value).trim() !== '') metadata[key] = String(value).trim();
    }

    const payload: Record<string, unknown> = {
      type: selectedType,
      title: title.trim(),
      notes: notes.trim() || undefined,
      description: description.trim() || undefined,
      metadata,
    };
    if (coords) payload.location = { type: 'Point', coordinates: [coords.lon, coords.lat] };

    setSubmitting(true);
    try {
      let res: Response;
      if (photoUri) {
        const form = new FormData();
        form.append('type', selectedType);
        form.append('title', title.trim());
        if (notes.trim()) form.append('notes', notes.trim());
        if (description.trim()) form.append('description', description.trim());
        form.append('metadata', JSON.stringify(metadata));
        if (coords) form.append('location', JSON.stringify(payload.location));
        form.append('images', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
        res = await fetch(`${API_URL}${ENDPOINTS.CONTRIBUTIONS.CREATE}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form as any,
        });
      } else {
        res = await fetch(`${API_URL}${ENDPOINTS.CONTRIBUTIONS.CREATE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        Alert.alert('Thank you!', 'Your contribution has been submitted for review.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      const errData = await res.json().catch(() => ({}));
      const msg = Object.entries(errData)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        .join('\n');
      Alert.alert('Not submitted', msg || 'The server rejected this contribution.');
    } catch {
      // Network failure - queue it locally and sync later.
      try {
        await saveOfflineContribution({
          id: uuid(),
          type: selectedType,
          title: title.trim(),
          description: description.trim(),
          notes: notes.trim(),
          latitude: coords?.lat,
          longitude: coords?.lon,
          metadata,
        });
        Alert.alert('Saved offline', 'Will sync when you are back online.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } catch {
        Alert.alert('Error', 'Could not save your contribution.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    token, title, notes, description, selectedType, values, coords, photoUri,
    missingRequired, mediaRequiresPhoto,
  ]);

  if (loadingConfig) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.oceanBlue} />
      </View>
    );
  }

  if (!wizardType) {
    const types = config?.types || [];
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Share with the community</Text>
          <Text style={styles.subtitle}>Choose what you would like to contribute</Text>
          {types.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={styles.typeCard}
              onPress={() => setSelectedType(t.value)}
            >
              <Text style={styles.typeIcon}>{TYPE_ICONS[t.value] || '➕'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeTitle}>{t.label}</Text>
                <Text style={styles.typeText}>{t.description}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
          {types.length === 0 && (
            <Text style={styles.emptyText}>Could not load contribution types.</Text>
          )}
        </View>
      </ScrollView>
    );
  }

  const detailFields = (wizardType.fields || []).filter((f) => f.type !== 'choice');
  const choiceFields = (wizardType.fields || []).filter((f) => f.type === 'choice');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <TouchableOpacity onPress={() => setSelectedType('')}>
            <Text style={styles.backLink}>← Change type</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{TYPE_ICONS[wizardType.value]} {wizardType.label}</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a short, clear title"
          />

          {choiceFields.map((field) => (
            <View key={field.key}>
              <Text style={styles.label}>
                {field.label}
                {field.required ? ' *' : ''}
              </Text>
              <View style={styles.chipRow}>
                {(field.choices || []).map((choice) => {
                  const active = values[field.key] === choice.value;
                  return (
                    <TouchableOpacity
                      key={choice.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setValue(field.key, active ? '' : choice.value)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {choice.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {detailFields.map((field) => (
            <View key={field.key}>
              <Text style={styles.label}>
                {field.label}
                {field.required ? ' *' : ''}
              </Text>
              <TextInput
                style={styles.input}
                value={values[field.key] || ''}
                onChangeText={(v) => setValue(field.key, v)}
                placeholder={field.help || field.label}
                keyboardType={NUMERIC_TYPES.has(field.type) ? 'decimal-pad' : 'default'}
              />
            </View>
          ))}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything else you would like to share"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe it in more detail"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Photo</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity style={styles.mediaChip} onPress={takePhoto}>
              <Text style={styles.mediaChipText}>📷 Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaChip} onPress={pickImage}>
              <Text style={styles.mediaChipText}>🖼 Choose photo</Text>
            </TouchableOpacity>
            {photoUri && (
              <TouchableOpacity
                style={[styles.mediaChip, styles.mediaChipClear]}
                onPress={() => setPhotoUri(null)}
              >
                <Text style={[styles.mediaChipText, { color: COLORS.gray[600] }]}>✕ Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          {photoUri && <Text style={styles.photoHint}>1 photo attached</Text>}

          {wizardType.requires_geotag && (
            <>
              <Text style={styles.label}>Location {coords ? '' : '(required)'}</Text>
              <TouchableOpacity style={styles.mediaChip} onPress={captureLocation}>
                <Text style={styles.mediaChipText}>
                  {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : '📍 Capture my location'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit for review'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  backLink: { color: COLORS.oceanBlue, fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  title: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  typeIcon: { fontSize: 32, marginRight: SPACING.md },
  typeTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  typeText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: FONT_SIZE.lg, color: COLORS.gray[400] },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: 110 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100] },
  chipActive: { backgroundColor: COLORS.oceanBlue },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600] },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  mediaChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100] },
  mediaChipClear: { backgroundColor: COLORS.gray[200] },
  mediaChipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[700] },
  photoHint: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  button: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xxl },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.md },
});
