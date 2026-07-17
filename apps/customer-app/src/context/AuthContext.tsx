import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Role, UserDto } from '@kafe/shared-types';

const getBackendUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web') {
    // Use the same host the page itself was loaded from (not a hardcoded 'localhost').
    // Otherwise, opening the app via a LAN IP (e.g. http://192.168.x.x:8081) while the API
    // call still targets 'localhost' crosses address spaces (private -> loopback), which
    // Chrome's Private Network Access policy blocks outright.
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:4000`;
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:4000`;
  }
  // Standalone/release builds have no debugger host — fall back to the deployed
  // production backend rather than the emulator-only 10.0.2.2 alias.
  return 'https://kafe-backend-sox3.onrender.com';
};

export const API_URL = getBackendUrl();

// Product images are stored as backend-relative paths (e.g. "/public/espresso.png").
// On web that resolves fine against the page's own origin, but React Native's <Image
// source={{uri}}> has no notion of "current origin" on native — it needs a full URL.
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

const saveSecureToken = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getSecureToken = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteSecureToken = async (key: string) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

interface AuthContextType {
  user: UserDto | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    phone: string,
    password: string,
    fullName: string,
    kvkkAccepted: boolean,
    marketingOptIn: boolean,
    birthday?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedAccess = await getSecureToken('accessToken');
        const storedRefresh = await getSecureToken('refreshToken');

        if (storedUser && storedAccess && storedRefresh) {
          setUser(JSON.parse(storedUser));
          setAccessToken(storedAccess);
          setRefreshToken(storedRefresh);
        }
      } catch (e) {
        console.error('Failed to load authentication state', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Giriş yapılamadı' };
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await saveSecureToken('accessToken', data.accessToken);
      await saveSecureToken('refreshToken', data.refreshToken);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internetinizi kontrol edin.' };
    }
  };

  const register = async (
    email: string,
    phone: string,
    password: string,
    fullName: string,
    kvkkAccepted: boolean,
    marketingOptIn: boolean,
    birthday?: string
  ) => {
    try {
      const payload = {
        email,
        phone,
        password,
        fullName,
        role: Role.CUSTOMER,
        birthday: birthday || undefined,
        kvkkAccepted,
        marketingOptIn,
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Kayıt olunamadı' };
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await saveSecureToken('accessToken', data.accessToken);
      await saveSecureToken('refreshToken', data.refreshToken);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'Sunucuya bağlanılamadı. Lütfen internetinizi kontrol edin.' };
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch (e) {
      // Ignore network errors on logout
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    await AsyncStorage.removeItem('user');
    await deleteSecureToken('accessToken');
    await deleteSecureToken('refreshToken');
  };

  // Dedicated fetch helper that handles token injection and automatic token refresh
  const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    let currentToken = accessToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers || {}) as Record<string, string>),
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const mergedOptions = { ...options, headers };
    let response = await fetch(`${API_URL}${endpoint}`, mergedOptions);

    // If unauthorized, attempt to use refresh token
    if (response.status === 401 && refreshToken) {
      console.log('Access token expired, attempting refresh...');
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          currentToken = refreshData.accessToken;
          setAccessToken(currentToken);
          setRefreshToken(refreshData.refreshToken);
          setUser(refreshData.user);

          await AsyncStorage.setItem('user', JSON.stringify(refreshData.user));
          await saveSecureToken('accessToken', refreshData.accessToken);
          await saveSecureToken('refreshToken', refreshData.refreshToken);

          // Retry the original request
          headers['Authorization'] = `Bearer ${currentToken}`;
          response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        } else {
          // Refresh token also invalid/expired -> logout
          await logout();
          throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
      } catch (err) {
        await logout();
        throw err;
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'İstek başarısız oldu');
    }
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
