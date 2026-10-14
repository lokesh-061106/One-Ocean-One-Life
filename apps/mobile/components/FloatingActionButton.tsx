import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOWS } from '@/constants/theme';

interface FloatingActionButtonProps {
  icon: string;
  actions: { icon: string; label: string; onPress: () => void; color?: string }[];
}

export function FloatingActionButton({ icon, actions }: FloatingActionButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[fabStyles.container, { bottom: insets.bottom + 24 }]}>
      {expanded && (
        <View style={fabStyles.actions}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[fabStyles.action, { backgroundColor: action.color || COLORS.oceanBlue }]}
              onPress={() => { action.onPress(); setExpanded(false); }}
            >
              <Text style={fabStyles.actionIcon}>{action.icon}</Text>
              <Text style={fabStyles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={[fabStyles.button, expanded && fabStyles.buttonActive]}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={fabStyles.buttonIcon}>{expanded ? '✕' : icon}</Text>
      </TouchableOpacity>
    </View>
  );
}

const fabStyles = StyleSheet.create({
  container: { position: 'absolute', right: 24, alignItems: 'flex-end' },
  actions: { marginBottom: SPACING.md, gap: SPACING.sm },
  action: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, ...SHADOWS.md },
  actionIcon: { fontSize: 18, marginRight: SPACING.sm },
  actionLabel: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  button: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.oceanBlue, alignItems: 'center', justifyContent: 'center', ...SHADOWS.xl },
  buttonActive: { backgroundColor: COLORS.gray[600] },
  buttonIcon: { fontSize: 24, color: COLORS.white },
});
