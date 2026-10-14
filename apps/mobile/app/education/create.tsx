import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { useAuthStore } from '@/stores/authStore';

export default function CreateEducation() {
  const { token } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('blog');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/education/posts/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, post_type: category }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Education article created!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const errData = await res.json();
        const msg = Object.entries(errData).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('\n');
        Alert.alert('Error', msg || 'Failed to create article');
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
        <Text style={styles.title}>Create Education Article</Text>

        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Article title" />

        <Text style={styles.label}>Content</Text>
        <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} placeholder="Write your article..." multiline numberOfLines={6} textAlignVertical="top" />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Publishing...' : 'Publish Article'}</Text>
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
  textArea: { height: 150 },
  button: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginBottom: SPACING.xxl },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.md },
});
