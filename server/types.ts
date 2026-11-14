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

export type SynthStyle =
  | 'electronic'
  | 'lofi'
  | 'indie'
  | 'pop'
  | 'hiphop'
  | 'rock'
  | 'classical'
  | 'jazz'
  | 'bollywood'
  | 'punjabi'
  | 'devotional'
  | 'instrumental';

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  duration: number; // seconds
  artwork: string;
  audioUrl: string;
  genre: Genre;
  moods: Mood[];
  region: 'International' | 'Regional';
  releaseDate: string;
  playCount: number;
  bpm: number;
  rootFreq: number;
  scale: 'major' | 'minor' | 'pentatonic' | 'dorian' | 'raga' | 'lofi7';
  synthStyle: SynthStyle;
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

export interface ListeningHistoryEntry {
  id: string;
  trackId: string;
  playedAt: string;
  durationPlayed: number;
}

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  authProvider: 'local' | 'google' | 'demo';
  profilePicture: string;
  likedSongs: string[];
  savedAlbums: string[];
  savedPlaylists: string[];
  followedArtists: string[];
  searchHistory: string[];
  listeningHistory: ListeningHistoryEntry[];
  preferences: UserPreferences;
  createdAt: string;
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
