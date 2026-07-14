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
    // Otherwise, opening the app via a LAN IP (e.g. http://192.168.x.x:8082) while the API
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
  return 'http://10.0.2.2:4000';
};

export const API_URL = getBackendUrl();

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
  logout: () => Promise<void>;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('admin_user');
        const storedAccess = await getSecureToken('admin_accessToken');
        const storedRefresh = await getSecureToken('admin_refreshToken');

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

      // Yalnızca Admin rolü bu uygulamaya giriş yapabilir — şube yönetimi, vardiya atama ve
      // çapraz şube Z-Raporu görünürlüğü personel/müşteri hesaplarına açık değildir.
      if (data.user.role !== Role.ADMIN) {
        return {
          success: false,
          error: 'Yetkisiz hesap. Bu uygulamaya yalnızca yönetici hesapları giriş yapabilir.',
        };
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      await AsyncStorage.setItem('admin_user', JSON.stringify(data.user));
      await saveSecureToken('admin_accessToken', data.accessToken);
      await saveSecureToken('admin_refreshToken', data.refreshToken);

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
    await AsyncStorage.removeItem('admin_user');
    await deleteSecureToken('admin_accessToken');
    await deleteSecureToken('admin_refreshToken');
  };

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

          await AsyncStorage.setItem('admin_user', JSON.stringify(refreshData.user));
          await saveSecureToken('admin_accessToken', refreshData.accessToken);
          await saveSecureToken('admin_refreshToken', refreshData.refreshToken);

          headers['Authorization'] = `Bearer ${currentToken}`;
          response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        } else {
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
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, apiFetch }}>
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
