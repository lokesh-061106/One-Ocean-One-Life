import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';

export interface DeviceState {
  isOnline: boolean;
  isGpsEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
  locationError: string | null;
  networkType: string | null;
}

export function useDeviceState(): DeviceState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<DeviceState>({
    isOnline: true,
    isGpsEnabled: false,
    latitude: null,
    longitude: null,
    locationError: null,
    networkType: null,
  });

  const refresh = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      const { status } = await Location.getForegroundPermissionsAsync();
      let latitude: number | null = null;
      let longitude: number | null = null;
      let locationError: string | null = null;

      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        } catch (err: any) {
          locationError = err.message || 'Unable to get location';
        }
      } else {
        locationError = 'Location permission not granted';
      }

      setState({
        isOnline: netInfo.isConnected ?? true,
        isGpsEnabled: status === 'granted' && latitude !== null,
        latitude,
        longitude,
        locationError,
        networkType: netInfo.type,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        locationError: err.message || 'Device state check failed',
      }));
    }
  };

  useEffect(() => {
    refresh();

    const unsubscribe = NetInfo.addEventListener(netInfo => {
      setState(prev => ({
        ...prev,
        isOnline: netInfo.isConnected ?? true,
        networkType: netInfo.type,
      }));
    });

    return () => unsubscribe();
  }, []);

  return { ...state, refresh };
}
