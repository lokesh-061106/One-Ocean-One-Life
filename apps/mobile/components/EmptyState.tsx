import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon = '🌊', title, description, actionLabel, onAction, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description={message}
      actionLabel={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="📡"
      title="You're offline"
      description="Your contributions will be saved locally and synced when you're back online."
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.xl },
  icon: { fontSize: 64, marginBottom: SPACING.md },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.deepNavy, textAlign: 'center', marginBottom: SPACING.sm },
  description: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  button: { backgroundColor: COLORS.oceanBlue, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 4, borderRadius: BORDER_RADIUS.md },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
