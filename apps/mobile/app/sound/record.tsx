import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { fetchLibraryCategories } from '@/services/sound-library';
import { saveOfflineSound } from '@/database/offlineDb';
import { useOfflineStore } from '@/stores/offlineStore';

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.floor(Math.random() * 16);
  const v = c === 'x' ? r : (r & 0x3) | 0x8;
  return v.toString(16);
});

const INSTRUMENTS = [
  'Hydrophone', 'Standard Recorder', 'Phone Recorder', 'Other',
];

const ENVIRONMENT_OPTIONS = [
  { key: 'calm', label: '🌊 Calm' },
  { key: 'moderate', label: '🌊🌊 Moderate' },
  { key: 'rough', label: '🌊🌊🌊 Rough' },
];

type CategoryOption = { label: string; value: string };

const extOf = (uri: string) => (uri.split('.').pop() || '').toLowerCase();
const imageMime = (uri: string) => {
  const ext = extOf(uri);
  return ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
};

export default function SoundRecord() {
  const { isOnline } = useOfflineStore();
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
  const recorderState = useAudioRecorderState(recorder);
  const recording = recorderState.isRecording;

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [instrument, setInstrument] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [depth, setDepth] = useState('');
  const [description, setDescription] = useState('');
  const [seaCondition, setSeaCondition] = useState('calm');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sound Library (admin "Add sound item") fields.
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categorySlug, setCategorySlug] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [source, setSource] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [spectrogramUri, setSpectrogramUri] = useState<string | null>(null);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentFileName, setDocumentFileName] = useState('');
  const [documentName, setDocumentName] = useState('');

  const recordingSeconds = recording ? Math.round(recorderState.durationMillis / 1000) : duration;
  const formattedDuration = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`;

  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      } catch {}
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  useEffect(() => {
    fetchLibraryCategories()
      .then((list) => {
        const opts: CategoryOption[] = [];
        for (const parent of list) {
          opts.push({ label: parent.name, value: parent.slug });
          for (const child of parent.children || []) {
            opts.push({ label: `${parent.name} / ${child.name}`, value: child.slug });
          }
        }
        setCategories(opts);
      })
      .catch(() => {
        // Offline / fetch failed — category can be blank (server falls back).
      });
  }, []);

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) setter(result.assets[0].uri);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setDocumentUri(asset.uri);
    setDocumentFileName(asset.name);
    setDocumentName((prev) => prev || asset.name);
  };

  const toggleRecording = async () => {
    if (recording) {
      try {
        const seconds = Math.max(1, Math.round(recorderState.durationMillis / 1000));
        await recorder.stop();
        setDuration(seconds);
        setAudioUri(recorder.uri);
      } catch {
        Alert.alert('Recording failed', 'Could not stop the recording.');
      }
      return;
    }

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone needed', 'Please allow microphone access to record ocean sounds.');
        return;
      }
      setAudioUri(null);
      setDuration(0);
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert('Recording failed', 'Could not start recording. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!audioUri || recordingSeconds < 3) {
      Alert.alert('Too Short', 'Record at least 3 seconds of sound');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this recording a name — it becomes the sound library entry name.');
      return;
    }
    if (categories.length > 0 && !categorySlug) {
      Alert.alert('Category required', 'Choose the library category for this recording.');
      return;
    }
    setSubmitting(true);

    const soundId = uuid();
    const contributionId = uuid();
    const now = new Date();
    const fileName = `recording_${soundId}.m4a`;
    const data = {
      id: soundId,
      contribution_id: contributionId,
      audio_uri: audioUri,
      instrument,
      manufacturer,
      model_number: modelNumber,
      depth_meters: depth ? parseFloat(depth) : undefined,
      written_description: description,
      environmental_conditions: { sea: seaCondition },
      duration_seconds: recordingSeconds,
      recording_date: now.toISOString().split('T')[0],
      recording_time: now.toTimeString().slice(0, 8),
      latitude: location?.coords.latitude,
      longitude: location?.coords.longitude,
      name: name.trim(),
      category: categorySlug,
      slug: slug.trim(),
      sort_order: parseInt(sortOrder, 10) || 0,
      source: source.trim(),
      description,
      document_name: documentName.trim(),
      photo_uri: photoUri ?? undefined,
      spectrogram_uri: spectrogramUri ?? undefined,
      document_uri: documentUri ?? undefined,
    };

    const saveOffline = async () => {
      await saveOfflineSound(data);
      Alert.alert('Saved Offline', 'Will sync when online', [{ text: 'OK', onPress: () => router.back() }]);
    };

    try {
      if (!isOnline) {
        await saveOffline();
        return;
      }

      const form = new FormData();
      form.append('audio_file', { uri: audioUri, name: fileName, type: 'audio/m4a' } as any);
      form.append('instrument', instrument);
      form.append('manufacturer', manufacturer);
      form.append('model_number', modelNumber);
      if (depth) form.append('depth_meters', depth);
      if (description) {
        form.append('written_description', description);
        form.append('description', description);
      }
      form.append('environmental_conditions', JSON.stringify({ sea: seaCondition }));
      form.append('duration_seconds', String(recordingSeconds));
      form.append('recording_date', String(data.recording_date));
      form.append('recording_time', String(data.recording_time));
      if (data.latitude !== undefined) form.append('latitude', String(data.latitude));
      if (data.longitude !== undefined) form.append('longitude', String(data.longitude));

      // Sound Library (admin parity) fields.
      form.append('name', name.trim());
      if (categorySlug) form.append('category', categorySlug);
      if (slug.trim()) form.append('slug', slug.trim());
      form.append('sort_order', sortOrder.trim() || '0');
      if (source.trim()) form.append('source', source.trim());
      if (documentName.trim()) form.append('document_name', documentName.trim());
      if (photoUri) {
        form.append('photo_file', { uri: photoUri, name: `photo.${extOf(photoUri)}`, type: imageMime(photoUri) } as any);
      }
      if (spectrogramUri) {
        form.append('spectrogram_file', { uri: spectrogramUri, name: `spectrogram.${extOf(spectrogramUri)}`, type: imageMime(spectrogramUri) } as any);
      }
      if (documentUri) {
        form.append('document', { uri: documentUri, name: documentFileName || `document.${extOf(documentUri)}` } as any);
      }

      await api.post(ENDPOINTS.SOUNDS.CREATE, form);
      Alert.alert('Success', 'Sound recording uploaded!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      const message = String(e?.message || e || '');
      if (/^API Error: [45]/.test(message)) {
        Alert.alert('Upload failed', `The server rejected this recording (${message}).`);
      } else {
        try {
          await saveOffline();
        } catch {
          Alert.alert('Error', 'Could not save this recording. Please try again.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Record Ocean Sound</Text>
        <Text style={styles.subtitle}>Capture marine acoustic data</Text>

        <View style={[styles.waveContainer, recording && styles.waveContainerActive]}>
          <Text style={styles.waveText}>{recording ? '🔴 Recording...' : audioUri ? '✅ Recording ready' : '⚪ Ready to record'}</Text>
          <Text style={styles.duration}>{formattedDuration}</Text>
          {location && (
            <Text style={styles.locationText}>📍 {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}</Text>
          )}
          {audioUri && !recording && <Text style={styles.locationText}>Audio captured — fill the details below</Text>}
        </View>

        <TouchableOpacity style={[styles.recordButton, recording && styles.recordButtonActive]} onPress={toggleRecording}>
          <Text style={styles.recordButtonText}>{recording ? 'Stop' : 'Record'}</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording Details</Text>

          <Text style={styles.label}>Instrument</Text>
          <View style={styles.chipRow}>
            {INSTRUMENTS.map((inst) => (
              <TouchableOpacity key={inst} style={[styles.chip, instrument === inst && styles.chipActive]} onPress={() => setInstrument(inst)}>
                <Text style={[styles.chipText, instrument === inst && styles.chipTextActive]}>{inst}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Manufacturer</Text>
          <TextInput style={styles.input} value={manufacturer} onChangeText={setManufacturer} placeholder="e.g., Ocean Instruments" />

          <Text style={styles.label}>Model Number</Text>
          <TextInput style={styles.input} value={modelNumber} onChangeText={setModelNumber} placeholder="e.g., H1a" />

          <Text style={styles.label}>Depth (meters)</Text>
          <TextInput style={styles.input} value={depth} onChangeText={setDepth} placeholder="e.g., 10" keyboardType="numeric" />

          <Text style={styles.label}>Sea Condition</Text>
          <View style={styles.chipRow}>
            {ENVIRONMENT_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.key} style={[styles.chip, seaCondition === opt.key && styles.chipActive]} onPress={() => setSeaCondition(opt.key)}>
                <Text style={[styles.chipText, seaCondition === opt.key && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound Library Details</Text>
          <Text style={styles.hint}>Same fields as the O3L sound library (admin) entry.</Text>

          <Text style={styles.label}>Category *</Text>
          {categories.length > 0 ? (
            <View style={styles.chipRow}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.value} style={[styles.chip, categorySlug === cat.value && styles.chipActive]} onPress={() => setCategorySlug(cat.value)}>
                  <Text style={[styles.chipText, categorySlug === cat.value && styles.chipTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.hint}>Categories unavailable offline — you can still save this recording.</Text>
          )}

          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Humpback whale moan" />

          <Text style={styles.label}>Slug</Text>
          <TextInput style={styles.input} value={slug} onChangeText={setSlug} placeholder="Auto-generated from Name if blank" autoCapitalize="none" />

          <Text style={styles.label}>Sort order</Text>
          <TextInput style={styles.input} value={sortOrder} onChangeText={setSortOrder} placeholder="0" keyboardType="numeric" />

          <Text style={styles.label}>Source</Text>
          <TextInput style={styles.input} value={source} onChangeText={setSource} placeholder="e.g. NOAA 2023, personal recording, field survey" />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe what you heard, any patterns, unusual sounds..." multiline numberOfLines={4} textAlignVertical="top" />

          <Text style={styles.label}>Photo file</Text>
          {photoUri ? (
            <View style={styles.fileRow}>
              <Text style={styles.fileName} numberOfLines={1}>{photoUri.split('/').pop()}</Text>
              <TouchableOpacity onPress={() => setPhotoUri(null)}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickButton} onPress={() => pickImage(setPhotoUri)}>
              <Text style={styles.pickButtonText}>+ Add photo</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Spectrogram file</Text>
          {spectrogramUri ? (
            <View style={styles.fileRow}>
              <Text style={styles.fileName} numberOfLines={1}>{spectrogramUri.split('/').pop()}</Text>
              <TouchableOpacity onPress={() => setSpectrogramUri(null)}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickButton} onPress={() => pickImage(setSpectrogramUri)}>
              <Text style={styles.pickButtonText}>+ Add spectrogram image</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Document</Text>
          {documentUri ? (
            <View style={styles.fileRow}>
              <Text style={styles.fileName} numberOfLines={1}>{documentFileName}</Text>
              <TouchableOpacity onPress={() => { setDocumentUri(null); setDocumentFileName(''); }}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickButton} onPress={pickDocument}>
              <Text style={styles.pickButtonText}>+ Add document (PDF, Word, Excel…)</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Document name</Text>
          <TextInput style={styles.input} value={documentName} onChangeText={setDocumentName} placeholder="Display name — blank uses the file name" />
        </View>

        <TouchableOpacity style={[styles.submitButton, (submitting || !audioUri) && styles.disabledButton]} onPress={handleSubmit} disabled={submitting || !audioUri}>
          <Text style={styles.submitButtonText}>{submitting ? 'Saving...' : 'Save Recording'}</Text>
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
  waveContainer: { width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.lg, borderWidth: 4, borderColor: COLORS.gray[200] },
  waveContainerActive: { borderColor: COLORS.coral, backgroundColor: '#FFF5F5' },
  waveText: { fontSize: FONT_SIZE.md, color: COLORS.gray[600], marginBottom: SPACING.sm },
  duration: { fontSize: 48, fontWeight: 'bold', color: COLORS.deepNavy },
  locationText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: SPACING.xs },
  recordButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.oceanBlue, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.lg },
  recordButtonActive: { backgroundColor: COLORS.coral },
  recordButtonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.md },
  section: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.gray[700], marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: { backgroundColor: COLORS.gray[50], borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZE.md, borderWidth: 1, borderColor: COLORS.gray[200], marginBottom: SPACING.sm },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[100] },
  chipActive: { backgroundColor: COLORS.oceanBlue },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600] },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  hint: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginBottom: SPACING.sm },
  fileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, backgroundColor: COLORS.gray[50], borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.gray[200], marginBottom: SPACING.sm },
  fileName: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.gray[700] },
  removeText: { fontSize: FONT_SIZE.sm, color: COLORS.coral, fontWeight: '600' },
  pickButton: { borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.gray[300], borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm },
  pickButtonText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600] },
  submitButton: { backgroundColor: COLORS.seaGreen, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm },
  submitButtonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.md },
  disabledButton: { backgroundColor: COLORS.gray[300] },
  cancelButton: { paddingVertical: SPACING.md, alignItems: 'center' },
  cancelButtonText: { color: COLORS.gray[500], fontSize: FONT_SIZE.md },
});
