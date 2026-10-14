import { useState, useCallback, createContext, useContext, useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SHADOWS, BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_COLORS: Record<ToastType, string> = {
  success: COLORS.seaGreen,
  error: COLORS.coral,
  info: COLORS.oceanBlue,
  warning: '#F59E0B',
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(Toast & { animValue: Animated.Value })[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const animValue = new Animated.Value(-100);
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration, animValue }]);

    Animated.spring(animValue, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 150 }).start();

    setTimeout(() => {
      Animated.timing(animValue, { toValue: -100, duration: 250, useNativeDriver: true }).start(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      });
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={toastStyles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            style={[toastStyles.toast, { transform: [{ translateY: toast.animValue }], backgroundColor: TOAST_COLORS[toast.type] }]}
          >
            <View style={toastStyles.iconCircle}>
              <Text style={toastStyles.icon}>{TOAST_ICONS[toast.type]}</Text>
            </View>
            <Text style={toastStyles.message} numberOfLines={2}>{toast.message}</Text>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const { width } = Dimensions.get('window');

const toastStyles = StyleSheet.create({
  container: { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 9999, alignItems: 'center', paddingHorizontal: 16 },
  toast: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: BORDER_RADIUS.lg, width: width - 32, maxWidth: 400, ...SHADOWS.lg },
  iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  message: { flex: 1, color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '500' },
});
