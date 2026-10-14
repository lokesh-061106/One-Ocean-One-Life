import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { t } from '@/i18n';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.password_confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(formData);
      Alert.alert('Success', 'Registration successful! Please login.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('register')}</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Username *"
              placeholderTextColor={COLORS.gray[400]}
              value={formData.username}
              onChangeText={(v) => updateField('username', v)}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor={COLORS.gray[400]}
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="First Name"
                placeholderTextColor={COLORS.gray[400]}
                value={formData.first_name}
                onChangeText={(v) => updateField('first_name', v)}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Last Name"
                placeholderTextColor={COLORS.gray[400]}
                value={formData.last_name}
                onChangeText={(v) => updateField('last_name', v)}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor={COLORS.gray[400]}
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor={COLORS.gray[400]}
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor={COLORS.gray[400]}
              value={formData.password_confirm}
              onChangeText={(v) => updateField('password_confirm', v)}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? t('loading') : t('register')}</Text>
            </TouchableOpacity>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>{t('has_account')} {t('login')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepOcean,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray[900],
  },
  button: {
    backgroundColor: COLORS.seaGreen,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  linkText: {
    color: COLORS.oceanBlue,
    fontSize: FONT_SIZE.md,
  },
});
