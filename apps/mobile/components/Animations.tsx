import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  slideUp?: boolean;
  slideUpDistance?: number;
}

export function FadeInView({ children, delay = 0, duration = 400, style, slideUp = false, slideUpDistance = 20 }: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideUpDistance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      ...(slideUp ? [Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true })] : []),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity }, slideUp && { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

interface ScalePressProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  scaleTo?: number;
}

export function ScalePress({ children, onPress, style, scaleTo = 0.97 }: ScalePressProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <AnimatedPressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        {children}
      </AnimatedPressable>
    </Animated.View>
  );
}

function AnimatedPressable({ children, onPress, onPressIn, onPressOut }: any) {
  const { Pressable } = require('react-native');
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      {children}
    </Pressable>
  );
}

export function PulseView({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale: pulseAnim }] }]}>
      {children}
    </Animated.View>
  );
}

export function SlideInView({ children, direction = 'left', delay = 0, style }: { children: React.ReactNode; direction?: 'left' | 'right'; delay?: number; style?: ViewStyle }) {
  const translateX = useRef(new Animated.Value(direction === 'left' ? -50 : 50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: { cursor: 'pointer' },
});
