import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { useAuthStore } from '@/stores/authStore';

export default function CreateEvent() {
  const { token } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    setSubmitting(true);
    try {
      const startDate = new Date().toISOString();
      const res = await fetch(`${API_URL}/community/events/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          description: description.trim() || `${title} - organized by the community.`,
          location_name: location,
          event_type: 'community_meeting',
          start_date: startDate,
        }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Event created!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        Alert.alert('Error', 'Failed to create event');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Event</Text>

        <Text style={styles.label}>Event Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Event title" />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe the event..." multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Event location" />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Creating...' : 'Create Event'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZE.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border || '#e0e0e0' },
  textArea: { height: 120 },
  button: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginBottom: SPACING.xxl },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.md },
});
