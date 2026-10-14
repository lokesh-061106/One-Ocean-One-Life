import { View, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, BORDER_RADIUS, SPACING, FONT_SIZE, SHADOWS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface OceanHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  height?: number;
  style?: ViewStyle;
}

export function OceanHeader({ title, subtitle, children, height = 200, style }: OceanHeaderProps) {
  return (
    <LinearGradient colors={GRADIENTS.deep as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[headerStyles.container, { minHeight: height }, style]}>
      <View style={headerStyles.overlay}>
        <View style={headerStyles.waveContainer}>
          <Text style={headerStyles.waveEmoji}>🌊</Text>
        </View>
        <Text style={headerStyles.title}>{title}</Text>
        {subtitle && <Text style={headerStyles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </LinearGradient>
  );
}

export function SectionDivider({ title, style }: { title?: string; style?: ViewStyle }) {
  return (
    <View style={[dividerStyles.container, style]}>
      {title ? (
        <>
          <View style={dividerStyles.line} />
          <Text style={dividerStyles.text}>{title}</Text>
          <View style={dividerStyles.line} />
        </>
      ) : (
        <View style={dividerStyles.fullLine} />
      )}
    </View>
  );
}

export function FeatureCard({ icon, title, description, onPress, style }: {
  icon: string; title: string; description?: string; onPress?: () => void; style?: ViewStyle;
}) {
  return (
    <View style={[featureStyles.card, style]}>
      <View style={featureStyles.iconContainer}>
        <Text style={featureStyles.icon}>{icon}</Text>
      </View>
      <Text style={featureStyles.title}>{title}</Text>
      {description && <Text style={featureStyles.description} numberOfLines={2}>{description}</Text>}
    </View>
  );
}

export function ProgressIndicator({ progress, color = COLORS.oceanBlue, label, style }: {
  progress: number; color?: string; label?: string; style?: ViewStyle;
}) {
  return (
    <View style={[progressStyles.container, style]}>
      {label && <Text style={progressStyles.label}>{label}</Text>}
      <View style={progressStyles.bar}>
        <View style={[progressStyles.fill, { width: `${Math.min(progress, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[progressStyles.value, { color }]}>{progress.toFixed(0)}%</Text>
    </View>
  );
}

export function InfoRow({ icon, label, value, style }: {
  icon?: string; label: string; value: string; style?: ViewStyle;
}) {
  return (
    <View style={[infoStyles.row, style]}>
      {icon && <Text style={infoStyles.icon}>{icon}</Text>}
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: { overflow: 'hidden' },
  overlay: { flex: 1, padding: SPACING.xl, justifyContent: 'flex-end' },
  waveContainer: { position: 'absolute', top: SPACING.md, right: SPACING.md, opacity: 0.15 },
  waveEmoji: { fontSize: 80 },
  title: { fontSize: FONT_SIZE.hero, fontWeight: 'bold', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.white, opacity: 0.8 },
});

const dividerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  line: { flex: 1, height: 1, backgroundColor: COLORS.gray[200] },
  fullLine: { flex: 1, height: 1, backgroundColor: COLORS.gray[200] },
  text: { paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.sm, color: COLORS.gray[400], fontWeight: '500' },
});

const featureStyles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', ...SHADOWS.md },
  iconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.lightBlue, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  icon: { fontSize: 28 },
  title: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy, textAlign: 'center', marginBottom: SPACING.xs },
  description: { fontSize: FONT_SIZE.sm, color: COLORS.gray[500], textAlign: 'center', lineHeight: 18 },
});

const progressStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  label: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], minWidth: 80 },
  bar: { flex: 1, height: 8, backgroundColor: COLORS.gray[200], borderRadius: 4 },
  fill: { height: '100%', borderRadius: 4 },
  value: { fontSize: FONT_SIZE.sm, fontWeight: '600', minWidth: 40, textAlign: 'right' },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  icon: { fontSize: 16, marginRight: SPACING.sm, width: 20 },
  label: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.gray[500] },
  value: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.deepNavy },
});
