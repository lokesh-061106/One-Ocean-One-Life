import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, GLASS } from '@/constants/theme';

interface OceanGradientProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function OceanGradient({ children, style, colors = GRADIENTS.ocean as unknown as string[], start = { x: 0, y: 0 }, end = { x: 1, y: 1 } }: OceanGradientProps) {
  return (
    <LinearGradient colors={colors as any} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
}

export function HeroGradient({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={GRADIENTS.deep as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[heroStyles.container, style]}>
      {children}
    </LinearGradient>
  );
}

export function CoralGradient({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={GRADIENTS.coral as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

export function GreenGradient({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={GRADIENTS.green as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

export function GradientButton({ title, onPress, style, colors = GRADIENTS.ocean as unknown as string[], icon }: {
  title: string; onPress: () => void; style?: ViewStyle; colors?: string[]; icon?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[btnStyles.gradient, style]}>
        {icon && <Text style={btnStyles.icon}>{icon}</Text>}
        <Text style={btnStyles.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GlassCard({ children, style, dark = false }: { children: React.ReactNode; style?: ViewStyle; dark?: boolean }) {
  const glassStyle = dark ? GLASS.dark : GLASS.light;
  return <View style={[cardStyles.glass, glassStyle, style]}>{children}</View>;
}

export function GlassCardTouchable({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: ViewStyle }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[cardStyles.glass, GLASS.light, style]}>{children}</View>
    </TouchableOpacity>
  );
}

export function OceanCard({ children, style, variant = 'default' }: { children: React.ReactNode; style?: ViewStyle; variant?: 'default' | 'elevated' | 'outlined' }) {
  return (
    <View style={[
      cardStyles.ocean,
      variant === 'elevated' && cardStyles.elevated,
      variant === 'outlined' && cardStyles.outlined,
      style,
    ]}>
      {children}
    </View>
  );
}

export function StatCard({ value, label, icon, color = COLORS.oceanBlue, style }: {
  value: string | number; label: string; icon?: string; color?: string; style?: ViewStyle;
}) {
  return (
    <View style={[statStyles.card, style]}>
      <View style={[statStyles.iconCircle, { backgroundColor: color + '20' }]}>
        <Text style={statStyles.icon}>{icon || '📊'}</Text>
      </View>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, subtitle, action, onAction, style }: {
  title: string; subtitle?: string; action?: string; onAction?: () => void; style?: ViewStyle;
}) {
  return (
    <View style={[sectionStyles.header, style]}>
      <View style={sectionStyles.headerText}>
        <Text style={sectionStyles.title}>{title}</Text>
        {subtitle && <Text style={sectionStyles.subtitle}>{subtitle}</Text>}
      </View>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={sectionStyles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Badge({ children, variant = 'default', style }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info'; style?: ViewStyle }) {
  const bg = variant === 'success' ? COLORS.lightGreen : variant === 'warning' ? '#FEF3C7' : variant === 'error' ? COLORS.lightCoral : variant === 'info' ? COLORS.lightBlue : COLORS.gray[100];
  const textColor = variant === 'success' ? COLORS.seaGreen : variant === 'warning' ? '#F59E0B' : variant === 'error' ? COLORS.coral : variant === 'info' ? COLORS.oceanBlue : COLORS.gray[600];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: bg }, style]}>
      <Text style={[badgeStyles.text, { color: textColor }]}>{children}</Text>
    </View>
  );
}

export function Avatar({ name, size = 40, style }: { name: string; size?: number; style?: ViewStyle }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colorIndex = name.charCodeAt(0) % 5;
  const colors = [COLORS.oceanBlue, COLORS.seaGreen, COLORS.coral, '#F59E0B', '#8B5CF6'];
  return (
    <View style={[avatarStyles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors[colorIndex] }, style]}>
      <Text style={[avatarStyles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: { padding: SPACING.xl, borderRadius: BORDER_RADIUS.xl },
});

const btnStyles = StyleSheet.create({
  gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: BORDER_RADIUS.md },
  icon: { fontSize: 18, marginRight: 8 },
  text: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});

const cardStyles = StyleSheet.create({
  glass: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  ocean: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.md },
  elevated: { ...SHADOWS.lg },
  outlined: { borderWidth: 1, borderColor: COLORS.gray[200], shadowOpacity: 0, elevation: 0 },
});

const statStyles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOWS.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  icon: { fontSize: 20 },
  value: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', marginBottom: 2 },
  label: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], textAlign: 'center' },
});

const sectionStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  headerText: { flex: 1 },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.deepNavy },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], marginTop: 2 },
  action: { fontSize: FONT_SIZE.sm, color: COLORS.oceanBlue, fontWeight: '600' },
});

const badgeStyles = StyleSheet.create({
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full, alignSelf: 'flex-start' },
  text: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
});

const avatarStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.white, fontWeight: '700' },
});
