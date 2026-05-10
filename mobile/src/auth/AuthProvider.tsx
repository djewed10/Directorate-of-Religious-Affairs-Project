import { api } from '@/api/queries';
import { authStorage } from '@/storage/secureStore';
import { registerPushToken, setupNotificationHandler } from '@/notifications/push-handler';
import type { AuthUser } from '@/types/api';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up notification handler once on app start
    const cleanupNotificationHandler = setupNotificationHandler();
    
    Promise.all([authStorage.getToken(), authStorage.getUser<AuthUser>()])
      .then(([savedToken, savedUser]) => {
        setToken(savedToken);
        setUser(savedUser);
        // If we have a saved token, try to register push token
        if (savedToken && savedUser) {
          registerPushToken();
        }
      })
      .finally(() => setLoading(false));

    return cleanupNotificationHandler;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      async login(email, password) {
        const response = await api.login(email, password);
        const authUser = response.user as AuthUser;
        await authStorage.setSession(response.accessToken, authUser);
        setToken(response.accessToken);
        setUser(authUser);
        // DEBUG: confirm we stored token
        try {
          // eslint-disable-next-line no-console
          console.log('[AuthProvider] login success, tokenStored=', !!response.accessToken, String(response.accessToken).slice(0,8) + '...');
        } catch (e) {}
        // Register push token after login
        await registerPushToken();
      },
      async logout() {
        await authStorage.clear();
        setToken(null);
        setUser(null);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

