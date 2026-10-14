import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AudioPlayer({ uri, style }: { uri: string; style?: any }) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  const duration = Number.isFinite(status.duration) ? status.duration : 0;
  const position = duration > 0 ? Math.min(status.currentTime, duration) : 0;
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish) player.seekTo(0);
    player.play();
  };

  return (
    <View style={[styles.row, style]}>
      <TouchableOpacity onPress={toggle} style={[styles.button, status.playing && styles.buttonActive]} accessibilityRole="button">
        <Text style={styles.buttonText}>{status.playing ? 'Pause' : 'Play'}</Text>
      </TouchableOpacity>

      <View style={styles.trackWrap}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.time}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray[50], borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.gray[200], padding: SPACING.sm, gap: SPACING.sm },
  button: { backgroundColor: COLORS.oceanBlue, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, minWidth: 64, alignItems: 'center' },
  buttonActive: { backgroundColor: COLORS.coral },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  trackWrap: { flex: 1 },
  track: { height: 6, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.gray[200], overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: COLORS.oceanBlue, borderRadius: BORDER_RADIUS.full },
  time: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], marginTop: 4 },
});
