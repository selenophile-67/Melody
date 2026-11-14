import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Compass,
  Download,
  Heart,
  History,
  Home,
  Library,
  ListMusic,
  Menu,
  Moon,
  Plus,
  Radio,
  Search,
  Settings,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { Artist, Playlist, Track } from '../types';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { Artwork } from './Artwork';
import { PlayerBar } from './PlayerBar';
import { QueuePanel } from './QueuePanel';

function MelodyLogo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#FF3B5C" />
        <path
          d="M9 21V12.5C9 11.4 9.9 10.5 11 10.5C11.7 10.5 12.3 10.9 12.7 11.5L16 17L19.3 11.5C19.7 10.9 20.3 10.5 21 10.5C22.1 10.5 23 11.4 23 12.5V21"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Melody
      </span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, loginDemo } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    songs: Track[];
    artists: Artist[];
    trendingSearches: string[];
    searchHistory: string[];
  }>({ songs: [], artists: [], trendingSearches: [], searchHistory: [] });
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const isFullscreenPlayer = location.pathname === '/now-playing';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    api
      .get<{ userPlaylists: Playlist[] }>('/api/playlists')
      .then((res) => setUserPlaylists(res.userPlaylists || []))
      .catch(() => {});
  }, [user?.id, location.pathname]);

  useEffect(() => {
    if (!searchFocused) return;
    const handle = setTimeout(() => {
      api
        .get<{
          songs: Track[];
          artists: Artist[];
          trendingSearches: string[];
          searchHistory: string[];
        }>(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => setSuggestions(res))
        .catch(() => {});
    }, 120);
    return () => clearTimeout(handle);
  }, [searchQuery, searchFocused]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) setSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const submitSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) {
      navigate('/search');
      setSearchFocused(false);
      return;
    }
    if (user) {
      api.post('/api/search/history', { query: clean }).catch(() => {});
    }
    setSearchFocused(false);
    navigate(`/search?q=${encodeURIComponent(clean)}`);
  };

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100">
        {children}
      </div>
    );
  }

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/library', label: 'Library', icon: Library },
    { to: '/playlists', label: 'Playlists', icon: ListMusic },
    { to: '/liked', label: 'Liked Songs', icon: Heart },
    { to: '/history', label: 'Recently Played', icon: History },
    { to: '/library?tab=downloads', label: 'Downloads', icon: Download },
    { to: '/party', label: 'Listening Party', icon: Radio },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const isNavItemActive = (to: string) => {
    if (to === '/library?tab=downloads') {
      return location.pathname === '/library' && location.search.includes('tab=downloads');
    }
    if (to === '/library') {
      return location.pathname === '/library' && !location.search.includes('tab=downloads');
    }
    return location.pathname === to;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex">
      {/* Left Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 fixed top-0 left-0 bottom-[84px] bg-white dark:bg-[#101014] border-r border-zinc-200 dark:border-white/[0.07] z-30">
        <div className="h-16 px-5 flex items-center border-b border-zinc-200/70 dark:border-white/[0.06]">
          <MelodyLogo />
        </div>

        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto melody-scroll p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#FF3B5C]/12 text-[#FF3B5C]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-white/[0.06]">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Your Playlists</span>
              <button
                type="button"
                onClick={() => navigate('/playlists?create=1')}
                aria-label="Create playlist"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {userPlaylists.slice(0, 6).map((pl) => (
                <Link
                  key={pl.id}
                  to={`/playlist/${pl.id}`}
                  className="block px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.04] truncate"
                >
                  {pl.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#101014] h-full flex flex-col border-r border-zinc-200 dark:border-zinc-800 z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
              <MelodyLogo />
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      active
                        ? 'bg-[#FF3B5C]/12 text-[#FF3B5C]'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 md:pl-60 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navigation Header */}
        {!isFullscreenPlayer && (
          <header className="sticky top-0 z-30 h-16 bg-zinc-50/90 dark:bg-[#09090B]/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/[0.06] px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
                className="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/10"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Global Search Bar */}
              <div ref={searchBoxRef} className="relative flex-1 max-w-md">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitSearch(searchQuery);
                  }}
                >
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="melody-global-search"
                    type="search"
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search songs, artists, albums, moods… (⌘K)"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
                  />
                </form>

                {searchFocused && (
                  <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3 z-50 max-h-96 overflow-y-auto melody-scroll space-y-3">
                    {searchQuery.trim() === '' ? (
                      <>
                        {suggestions.searchHistory.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between px-2 mb-1.5">
                              <span className="text-xs font-medium text-zinc-500">Recent searches</span>
                              <button
                                type="button"
                                onClick={() => {
                                  api.delete('/api/search/history').then(() =>
                                    setSuggestions((s) => ({ ...s, searchHistory: [] }))
                                  );
                                }}
                                className="text-xs text-[#FF3B5C] hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              {suggestions.searchHistory.slice(0, 5).map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(term);
                                    submitSearch(term);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/70 flex items-center gap-2"
                                >
                                  <History className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="truncate">{term}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="px-2 mb-1.5 text-xs font-medium text-zinc-500">Trending searches</div>
                          <div className="flex flex-wrap gap-1.5 px-2">
                            {suggestions.trendingSearches.map((term) => (
                              <button
                                key={term}
                                type="button"
                                onClick={() => {
                                  setSearchQuery(term);
                                  submitSearch(term);
                                }}
                                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        {suggestions.songs.slice(0, 4).map((song) => (
                          <button
                            key={song.id}
                            type="button"
                            onClick={() => {
                              playTrack(song);
                              setSearchFocused(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-left"
                          >
                            <Artwork src={song.artwork} alt={song.title} className="w-9 h-9 shrink-0" rounded="rounded" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{song.title}</div>
                              <div className="text-xs text-zinc-500 truncate">{song.artistName} · Song</div>
                            </div>
                          </button>
                        ))}
                        {suggestions.artists.slice(0, 2).map((artist) => (
                          <button
                            key={artist.id}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              navigate(`/artist/${artist.id}`);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-left"
                          >
                            <Artwork src={artist.profileImage} alt={artist.name} className="w-9 h-9 shrink-0" rounded="rounded-full" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{artist.name}</div>
                              <div className="text-xs text-zinc-500 truncate">Artist · {artist.genre}</div>
                            </div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => submitSearch(searchQuery)}
                          className="w-full py-2 text-xs font-medium text-[#FF3B5C] hover:underline text-center border-t border-zinc-200 dark:border-zinc-800"
                        >
                          View all results for “{searchQuery}”
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-label="Notifications"
                  className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Bell className="w-4 h-4" />
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3 z-50 space-y-2">
                    <div className="text-xs font-semibold text-zinc-500 px-1">Recent Releases & Updates</div>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/album/album-6');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
                    >
                      <div className="text-sm font-medium">Afterglow Avenue · Zara Sterling</div>
                      <div className="text-xs text-zinc-500 mt-0.5">New Pop album available to stream</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/playlist/pl-midnight-sessions');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
                    >
                      <div className="text-sm font-medium">Midnight Sessions refreshed</div>
                      <div className="text-xs text-zinc-500 mt-0.5">6 nocturnal studio tracks curated for you</div>
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Settings Shortcut */}
              <Link
                to="/settings"
                aria-label="Settings"
                className="hidden sm:inline-flex p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Profile / Auth */}
              {user ? (
                <div ref={profileRef} className="relative ml-1">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((o) => !o)}
                    aria-label="Account menu"
                    className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-white dark:bg-[#141418] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 transition-colors"
                  >
                    <Artwork
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-7 h-7 shrink-0"
                      rounded="rounded-full"
                    />
                    <span className="hidden sm:inline text-xs font-medium max-w-[110px] truncate">
                      {user.username}
                    </span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1.5 z-50 text-sm">
                      <div className="px-3.5 py-2 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="font-medium truncate">{user.username}</div>
                        <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Listening History
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Settings
                      </Link>
                      {user.authProvider === 'demo' && (
                        <Link
                          to="/login"
                          onClick={() => setProfileMenuOpen(false)}
                          className="block px-3.5 py-2 text-[#FF3B5C] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Sign in with account
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3.5 py-2 text-rose-500 hover:bg-rose-500/10"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <button
                    type="button"
                    onClick={loginDemo}
                    className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap shrink-0"
                  >
                    Demo Mode
                  </button>
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FF3B5C] hover:bg-[#FF5270] text-white whitespace-nowrap shrink-0"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Main Scrollable Viewport */}
        <main
          className={`flex-1 min-w-0 ${
            isFullscreenPlayer ? '' : 'px-4 sm:px-6 lg:px-8 py-6 pb-40 md:pb-28 max-w-[1400px] w-full mx-auto'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Persistent Player, Queue Slide-over, Playlist Modal & Mobile Bottom Nav */}
      {!isFullscreenPlayer && <PlayerBar />}
      {!isFullscreenPlayer && <QueuePanel />}
      <AddToPlaylistModal />

      {/* Mobile Bottom Nav */}
      {!isFullscreenPlayer && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 h-14 z-40 bg-white dark:bg-[#0F0F13] border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-around px-2"
        >
          {[
            { to: '/', label: 'Home', icon: Home },
            { to: '/explore', label: 'Explore', icon: Compass },
            { to: '/search', label: 'Search', icon: Search },
            { to: '/library', label: 'Library', icon: Library },
            { to: '/profile', label: 'Profile', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-1 px-2 text-[11px] font-medium ${
                    isActive ? 'text-[#FF3B5C]' : 'text-zinc-500 dark:text-zinc-400'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
