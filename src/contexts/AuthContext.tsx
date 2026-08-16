import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Session {
  user: User;
  token: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there's a saved session in localStorage
    const savedSession = localStorage.getItem('auth_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
      } catch (error) {
        console.error('Failed to parse saved session:', error);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      const newSession: Session = {
        user: {
          id: response.id,
          email: email,
          name: response.email,
        },
        token: response.token,
      };
      setSession(newSession);
      localStorage.setItem('auth_session', JSON.stringify(newSession));
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await api.auth.signup(email, password);
      const newSession: Session = {
        user: {
          id: response.id,
          email: email,
          name: response.name,
        },
        token: response.token,
      };
      setSession(newSession);
      localStorage.setItem('auth_session', JSON.stringify(newSession));
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setSession(null);
    localStorage.removeItem('auth_session');
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
