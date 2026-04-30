import { api } from '@/api/queries';
import { authStorage } from '@/storage/secureStore';
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
    Promise.all([authStorage.getToken(), authStorage.getUser<AuthUser>()])
      .then(([savedToken, savedUser]) => {
        setToken(savedToken);
        setUser(savedUser);
      })
      .finally(() => setLoading(false));
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

