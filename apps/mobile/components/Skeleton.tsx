import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SHADOWS } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: COLORS.gray[200], opacity: pulseAnim } as any,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton height={140} borderRadius={12} />
      <View style={skeletonStyles.cardContent}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="100%" height={12} style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={skeletonStyles.listItem}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={skeletonStyles.listContent}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={48} height={48} borderRadius={8} />
    </View>
  );
}

export function SkeletonHero() {
  return (
    <View style={skeletonStyles.hero}>
      <Skeleton width="60%" height={28} style={{ alignSelf: 'center' }} />
      <Skeleton width="80%" height={14} style={{ alignSelf: 'center', marginTop: 12 }} />
    </View>
  );
}

export function SkeletonGrid({ columns = 2, count = 4 }: { columns?: number; count?: number }) {
  return (
    <View style={skeletonStyles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: `${100 / columns - 1}%` }}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', marginBottom: 16, ...SHADOWS.sm },
  cardContent: { padding: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 8, ...SHADOWS.sm },
  listContent: { flex: 1, marginLeft: 12 },
  hero: { backgroundColor: COLORS.deepOcean, padding: 48, borderRadius: 16, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
