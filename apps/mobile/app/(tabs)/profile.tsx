import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';
import { t } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { ENDPOINTS, API_URL } from '@/constants/api';

interface UserStats {
  total_contributions: number;
  verified_contributions: number;
  total_sounds: number;
  total_sightings: number;
  total_score: number;
}

interface ProfileData {
  photo?: string;
  bio?: string;
  village_name?: string;
}

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const [stats, setStats] = useState<UserStats>({
    total_contributions: 0, verified_contributions: 0,
    total_sounds: 0, total_sightings: 0, total_score: 0,
  });
  const [profile, setProfile] = useState<ProfileData>({});
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, profileRes] = await Promise.allSettled([
        api.get<UserStats>(ENDPOINTS.CONTRIBUTIONS.MY_STATS),
        api.get<ProfileData>(ENDPOINTS.AUTH.ME),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value as any);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value as any);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const token = await import('expo-secure-store').then(m => m.getItemAsync('access_token'));

      const uploadResult = await FileSystem.uploadAsync(`${API_URL}${ENDPOINTS.AUTH.ME}`, uri, {
        httpMethod: 'PATCH',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'photo',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (uploadResult.status === 200) {
        const res = JSON.parse(uploadResult.body);
        if (res.photo) {
          const photoUrl = res.photo.startsWith('http') ? res.photo : `${API_URL.replace('/api/v1', '')}${res.photo}`;
          setProfile(prev => ({ ...prev, photo: photoUrl }));
          Alert.alert('Success', 'Profile photo updated!');
        }
      } else {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }
    } catch (e: any) {
      Alert.alert('Upload failed', e.message || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Change Photo', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getPhotoUri = () => {
    if (!profile.photo) return null;
    if (profile.photo.startsWith('http')) return profile.photo;
    return `${API_URL.replace('/api/v1', '')}${profile.photo}`;
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const photoUri = getPhotoUri();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={showPhotoOptions} style={styles.avatarContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.first_name?.[0] || user?.username?.[0] || '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.cameraIcon}>📷</Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.role}>{(user?.role || 'Community Member').replace(/_/g, ' ')}</Text>
          {profile.village_name && (
            <Text style={styles.village}>📍 {profile.village_name}</Text>
          )}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>My Contributions</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_contributions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.verified_contributions}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_sounds}</Text>
              <Text style={styles.statLabel}>Sounds</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_sightings}</Text>
              <Text style={styles.statLabel}>Sightings</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/recognition/score')}>
            <Text style={styles.menuIcon}>🏆</Text>
            <Text style={styles.menuText}>My Score: {stats.total_score}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/recognition/leaderboard')}>
            <Text style={styles.menuIcon}>🏅</Text>
            <Text style={styles.menuText}>Leaderboard</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/emergency')}>
            <Text style={styles.menuIcon}>🚨</Text>
            <Text style={styles.menuText}>{t('emergency')}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🌍</Text>
            <Text style={styles.menuText}>Language</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.foam },
  content: { padding: SPACING.md },
  header: { alignItems: 'center', marginBottom: SPACING.xl, paddingVertical: SPACING.lg },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.oceanBlue, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.oceanBlue },
  avatarText: { fontSize: 40, color: COLORS.white, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: -4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.seaGreen, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  cameraIcon: { fontSize: 14 },
  name: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.deepNavy },
  role: { fontSize: FONT_SIZE.md, color: COLORS.gray[500], marginTop: SPACING.xs, textTransform: 'capitalize' },
  village: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, marginTop: SPACING.xs },
  statsCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOWS.md },
  statsTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.md },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.oceanBlue },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: SPACING.xs },
  menuSection: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', ...SHADOWS.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  menuIcon: { fontSize: 24, marginRight: SPACING.md },
  menuText: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.deepNavy },
  menuArrow: { fontSize: FONT_SIZE.lg, color: COLORS.gray[400] },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: COLORS.coral },
});
