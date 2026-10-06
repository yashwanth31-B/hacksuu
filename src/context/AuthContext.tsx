import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { getApiUrl } from '../lib/api.ts';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: 'citizen' | 'admin' | 'supervisor' | 'worker';
  anonymousPublicId: string;
  municipalityId: number | null;
  phone: string | null;
  isAdmin: boolean;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string | null;
  name?: string | null;
  photoURL?: string | null;
}

export interface SetupStatus {
  isConfigured: boolean;
  adminCount: number;
  projectId?: string;
}

export type AuthModalTab = 'signin' | 'register' | 'personas';

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  setupStatus: SetupStatus | null;
  checkingSetup: boolean;
  isAuthModalOpen: boolean;
  authModalTab: AuthModalTab;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    municipalityId?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  loginAsPersona: (role: 'admin' | 'worker' | 'citizen') => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  refreshSetupStatus: () => Promise<void>;
  completeInitialSetup: (emails: string[]) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'civicfix_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Modal Controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('personas');

  const openAuthModal = (tab: AuthModalTab = 'personas') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Check system setup status
  const refreshSetupStatus = async () => {
    try {
      setCheckingSetup(true);
      const res = await fetch(getApiUrl('/api/system/setup-status'));
      if (res.ok) {
        const data = await res.json();
        setSetupStatus(data);
      }
    } catch (err) {
      console.error('Failed to check setup status:', err);
    } finally {
      setCheckingSetup(false);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (token) return token;
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken();
      } catch (err) {
        console.error('Failed to get Firebase auth token:', err);
      }
    }
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored || null;
  };

  const refreshProfile = async (explicitToken?: string) => {
    const activeToken = explicitToken || (await getAuthToken());
    if (!activeToken) {
      setProfile(null);
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        if (data.user) {
          setUser({
            uid: data.user.uid,
            email: data.user.email,
            displayName: data.user.name || data.profile?.displayName,
            name: data.user.name,
          });
        }
      } else if (res.status === 401) {
        // Token expired
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  useEffect(() => {
    refreshSetupStatus();

    // 1. Initial check from saved local token
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        setToken(savedToken);
        await refreshProfile(savedToken);
      }
      setLoading(false);
    };
    initAuth();

    // 2. Firebase auth observer fallback
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !localStorage.getItem(TOKEN_KEY)) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
        const fbToken = await currentUser.getIdToken();
        await refreshProfile(fbToken);
      }
    });

    return () => unsubscribe();
  }, []);

  // Standard Email/Password Login
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setProfile(data.profile);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  // Citizen Registration
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    municipalityId?: number;
  }) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setProfile(data.profile);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  // Instant Persona Login (Administrator, Field Worker, Resident Whistleblower)
  const loginAsPersona = async (role: 'admin' | 'worker' | 'citizen') => {
    try {
      const res = await fetch(getApiUrl('/api/auth/demo-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Persona login failed' };
      }

      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setProfile(data.profile);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        const idToken = await result.user.getIdToken();
        setToken(idToken);
        localStorage.setItem(TOKEN_KEY, idToken);
        setUser({
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
        await refreshProfile(idToken);
        closeAuthModal();
      }
    } catch (err: any) {
      console.warn('Google Sign-In failed or popup closed, offering quick persona sign-in:', err);
      // If Google popup fails or was closed, open the modal with personas tab
      openAuthModal('personas');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), { method: 'POST' }).catch(() => {});
      await signOut(auth).catch(() => {});
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  const completeInitialSetup = async (emails: string[]) => {
    try {
      const res = await fetch(getApiUrl('/api/system/initial-admin-setup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to configure administrators' };
      }
      await refreshSetupStatus();
      await refreshProfile();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network request failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        setupStatus,
        checkingSetup,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginAsPersona,
        loginWithGoogle,
        logout,
        getAuthToken,
        refreshProfile,
        refreshSetupStatus,
        completeInitialSetup,
      }}
    >
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
