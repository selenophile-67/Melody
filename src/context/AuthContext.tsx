import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../lib/api';
import { UserPreferences, UserPublic } from '../types';
import { useTheme } from './ThemeContext';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  loginWithGoogleCredential: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: { username?: string; profilePicture?: string }) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  toggleLikeTrack: (trackId: string) => Promise<boolean>;
  toggleSaveAlbum: (albumId: string) => Promise<boolean>;
  toggleFollowArtist: (artistId: string) => Promise<boolean>;
  toggleSavePlaylist: (playlistId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();
  const { showToast } = useToast();

  const applyUserSession = useCallback(
    (token: string, nextUser: UserPublic) => {
      setStoredToken(token);
      setUser(nextUser);
      if (nextUser.preferences?.theme) {
        setTheme(nextUser.preferences.theme);
      }
    },
    [setTheme]
  );

  const bootstrapAuth = useCallback(async () => {
    setLoading(true);
    try {
      const existingToken = getStoredToken();
      if (existingToken) {
        try {
          const res = await api.get<{ user: UserPublic }>('/api/auth/me');
          setUser(res.user);
          return;
        } catch {
          setStoredToken(null);
        }
      }
      // Automatically initialize Demo Mode so users can explore immediately without forced signup
      const signedOutExplicitly = sessionStorage.getItem('melody_signed_out') === '1';
      if (!signedOutExplicitly) {
        const demoRes = await api.post<{ token: string; user: UserPublic }>('/api/auth/demo');
        applyUserSession(demoRes.token, demoRes.user);
      }
    } catch {
      // Offline or unauthenticated state handled cleanly
    } finally {
      setLoading(false);
    }
  }, [applyUserSession]);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      sessionStorage.removeItem('melody_signed_out');
      const res = await api.post<{ token: string; user: UserPublic }>('/api/auth/login', { email, password });
      applyUserSession(res.token, res.user);
      showToast(`Welcome back, ${res.user.username}`, 'success');
    },
    [applyUserSession, showToast]
  );

  const register = useCallback(
    async (username: string, email: string, password: string, confirmPassword: string) => {
      sessionStorage.removeItem('melody_signed_out');
      const res = await api.post<{ token: string; user: UserPublic }>('/api/auth/register', {
        username,
        email,
        password,
        confirmPassword,
      });
      applyUserSession(res.token, res.user);
      showToast('Account created. Welcome to Melody.', 'success');
    },
    [applyUserSession, showToast]
  );

  const loginDemo = useCallback(async () => {
    sessionStorage.removeItem('melody_signed_out');
    const res = await api.post<{ token: string; user: UserPublic }>('/api/auth/demo');
    applyUserSession(res.token, res.user);
    showToast('Signed in to Demo Listener mode', 'success');
  }, [applyUserSession, showToast]);

  const loginWithGoogleCredential = useCallback(
    async (credential: string) => {
      sessionStorage.removeItem('melody_signed_out');
      const res = await api.post<{ token: string; user: UserPublic }>('/api/auth/google', { credential });
      applyUserSession(res.token, res.user);
      showToast(`Signed in as ${res.user.username}`, 'success');
    },
    [applyUserSession, showToast]
  );

  const logout = useCallback(() => {
    sessionStorage.setItem('melody_signed_out', '1');
    setStoredToken(null);
    setUser(null);
    showToast('Signed out of Melody', 'info');
  }, [showToast]);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const res = await api.get<{ user: UserPublic }>('/api/auth/me');
      setUser(res.user);
    } catch {
      // Ignore transient errors
    }
  }, []);

  const updateProfile = useCallback(
    async (payload: { username?: string; profilePicture?: string }) => {
      const res = await api.patch<{ user: UserPublic }>('/api/user/profile', payload);
      setUser(res.user);
      showToast('Profile updated', 'success');
    },
    [showToast]
  );

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>) => {
      if (!getStoredToken()) return;
      const res = await api.patch<{ user: UserPublic }>('/api/user/preferences', prefs);
      setUser(res.user);
    },
    []
  );

  const toggleLikeTrack = useCallback(
    async (trackId: string): Promise<boolean> => {
      if (!user) {
        showToast('Sign in or enable Demo mode to save liked songs', 'info');
        return false;
      }
      const res = await api.post<{ liked: boolean; user: UserPublic }>(`/api/library/like/${trackId}`);
      setUser(res.user);
      showToast(res.liked ? 'Added to Liked Songs' : 'Removed from Liked Songs', 'success');
      return res.liked;
    },
    [user, showToast]
  );

  const toggleSaveAlbum = useCallback(
    async (albumId: string): Promise<boolean> => {
      if (!user) {
        showToast('Sign in to save albums to your library', 'info');
        return false;
      }
      const res = await api.post<{ saved: boolean; user: UserPublic }>(`/api/library/album/${albumId}`);
      setUser(res.user);
      showToast(res.saved ? 'Album saved to Library' : 'Album removed from Library', 'success');
      return res.saved;
    },
    [user, showToast]
  );

  const toggleFollowArtist = useCallback(
    async (artistId: string): Promise<boolean> => {
      if (!user) {
        showToast('Sign in to follow artists', 'info');
        return false;
      }
      const res = await api.post<{ following: boolean; user: UserPublic }>(`/api/library/follow/${artistId}`);
      setUser(res.user);
      showToast(res.following ? 'Following artist' : 'Unfollowed artist', 'success');
      return res.following;
    },
    [user, showToast]
  );

  const toggleSavePlaylist = useCallback(
    async (playlistId: string): Promise<boolean> => {
      if (!user) {
        showToast('Sign in to save playlists', 'info');
        return false;
      }
      const res = await api.post<{ saved: boolean; user: UserPublic }>(`/api/playlists/${playlistId}/save`);
      setUser(res.user);
      showToast(res.saved ? 'Playlist saved to Library' : 'Playlist removed from Library', 'success');
      return res.saved;
    },
    [user, showToast]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginDemo,
        loginWithGoogleCredential,
        logout,
        refreshUser,
        updateProfile,
        updatePreferences,
        toggleLikeTrack,
        toggleSaveAlbum,
        toggleFollowArtist,
        toggleSavePlaylist,
      }}
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
