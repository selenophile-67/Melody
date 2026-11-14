import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AlbumPage } from './pages/AlbumPage';
import { ArtistPage } from './pages/ArtistPage';
import { ExplorePage } from './pages/ExplorePage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { LikedSongsPage } from './pages/LikedSongsPage';
import { ListeningPartyPage } from './pages/ListeningPartyPage';
import { LoginPage } from './pages/LoginPage';
import { NowPlayingPage } from './pages/NowPlayingPage';
import { PlaylistDetailPage } from './pages/PlaylistDetailPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <PlayerProvider>
              <BrowserRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/liked" element={<LikedSongsPage />} />
                    <Route path="/playlists" element={<PlaylistsPage />} />
                    <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                    <Route path="/artist/:id" element={<ArtistPage />} />
                    <Route path="/album/:id" element={<AlbumPage />} />
                    <Route path="/now-playing" element={<NowPlayingPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/party" element={<ListeningPartyPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </BrowserRouter>
            </PlayerProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
