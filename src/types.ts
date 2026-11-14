export type Genre =
  | 'Pop'
  | 'Hip-Hop'
  | 'Rock'
  | 'Classical'
  | 'Jazz'
  | 'Electronic'
  | 'Indie'
  | 'Bollywood'
  | 'Punjabi'
  | 'Lo-fi'
  | 'Devotional'
  | 'Instrumental';

export type Mood =
  | 'Happy'
  | 'Sad'
  | 'Romantic'
  | 'Energetic'
  | 'Relaxing'
  | 'Focus'
  | 'Workout'
  | 'Sleep'
  | 'Party'
  | 'Nostalgic';

export interface LyricLine {
  time: number;
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  duration: number;
  artwork: string;
  audioUrl: string;
  genre: Genre;
  moods: Mood[];
  region: 'International' | 'Regional';
  releaseDate: string;
  playCount: number;
  bpm: number;
  lyricsType: 'synced' | 'static' | 'instrumental';
  syncedLyrics?: LyricLine[];
  staticLyrics?: string[];
}

export interface Artist {
  id: string;
  name: string;
  profileImage: string;
  genre: Genre;
  region: 'International' | 'Regional';
  biography: string;
  monthlyListeners: number;
  relatedArtistIds: string[];
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  artwork: string;
  releaseDate: string;
  genre: Genre;
  description: string;
  trackIds: string[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  coverImage: string;
  trackIds: string[];
  isCurated: boolean;
  mood?: Mood;
  genre?: Genre;
  likesCount: number;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  audioQuality: 'standard' | 'high' | 'lossless';
  autoplay: boolean;
  crossfadeSeconds: number;
  notificationsEnabled: boolean;
  privateSession: boolean;
  equalizerPreset: string;
  equalizerBands: number[];
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  authProvider: 'local' | 'google' | 'demo';
  profilePicture: string;
  likedSongs: string[];
  savedAlbums: string[];
  savedPlaylists: string[];
  followedArtists: string[];
  searchHistory: string[];
  preferences: UserPreferences;
  createdAt: string;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTotalDuration(seconds: number): string {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours} hr ${mins} min`;
  return `${mins} min`;
}

export function formatCompactCount(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return String(num);
}
