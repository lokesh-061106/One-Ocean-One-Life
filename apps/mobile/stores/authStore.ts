import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: any) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
    } catch {
      throw new Error('Cannot reach server — is the API running?');
    }
    const data = await response.json();
    if (response.ok) {
      await SecureStore.setItemAsync('access_token', data.access);
      await SecureStore.setItemAsync('refresh_token', data.refresh);
      set({ isAuthenticated: true, token: data.access });
    } else {
      throw new Error(data.detail || 'Invalid username or password');
    }
  },

  register: async (registerData: any) => {
    const response = await fetch(`${API_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });
    const data = await response.json();
    if (!response.ok) {
      const errors = Object.entries(data)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
        .join('\n');
      throw new Error(errors || data.detail || 'Registration failed');
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user: any) => set({ user }),
  setToken: (token: string) => set({ token }),
}));
