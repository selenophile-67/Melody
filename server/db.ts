import crypto from 'crypto';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { CURATED_PLAYLISTS, IMG } from './catalog';
import { PlaylistModel, UserModel } from './models';
import { Playlist, UserPreferences, UserPublic, UserRecord } from './types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  audioQuality: 'high',
  autoplay: true,
  crossfadeSeconds: 2,
  notificationsEnabled: true,
  privateSession: false,
  equalizerPreset: 'Normal',
  equalizerBands: [0, 0, 0, 0, 0],
};

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function toPublicUser(user: UserRecord): UserPublic {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    authProvider: user.authProvider,
    profilePicture: user.profilePicture,
    likedSongs: user.likedSongs,
    savedAlbums: user.savedAlbums,
    savedPlaylists: user.savedPlaylists,
    followedArtists: user.followedArtists,
    searchHistory: user.searchHistory,
    preferences: user.preferences,
    createdAt: user.createdAt,
  };
}

interface LocalDbSchema {
  users: UserRecord[];
  playlists: Playlist[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'melody-db.json');

let useMongo = false;
let localDb: LocalDbSchema = { users: [], playlists: [] };

function buildSeedData(): LocalDbSchema {
  const now = Date.now();
  const dayMs = 86400000;

  const demoUser: UserRecord = {
    id: 'user-demo',
    username: 'Listener Demo',
    email: 'demo@melody.app',
    passwordHash: hashPassword('melodydemo'),
    authProvider: 'demo',
    profilePicture: IMG.defaultAvatar,
    likedSongs: ['track-1', 'track-4', 'track-7', 'track-10', 'track-16', 'track-25'],
    savedAlbums: ['album-1', 'album-2', 'album-3'],
    savedPlaylists: ['pl-midnight-sessions', 'pl-lofi-rain', 'pl-user-1'],
    followedArtists: ['artist-1', 'artist-2', 'artist-3', 'artist-6'],
    searchHistory: ['Crimson Prism', 'Aria Vance', 'Lo-fi', 'Bollywood Dusk'],
    listeningHistory: [
      { id: 'hist-1', trackId: 'track-1', playedAt: new Date(now - 1000 * 60 * 35).toISOString(), durationPlayed: 148 },
      { id: 'hist-2', trackId: 'track-4', playedAt: new Date(now - 1000 * 60 * 95).toISOString(), durationPlayed: 124 },
      { id: 'hist-3', trackId: 'track-7', playedAt: new Date(now - dayMs * 1 + 3600000).toISOString(), durationPlayed: 175 },
      { id: 'hist-4', trackId: 'track-16', playedAt: new Date(now - dayMs * 1 + 7200000).toISOString(), durationPlayed: 144 },
      { id: 'hist-5', trackId: 'track-10', playedAt: new Date(now - dayMs * 2).toISOString(), durationPlayed: 150 },
      { id: 'hist-6', trackId: 'track-25', playedAt: new Date(now - dayMs * 2 + 1800000).toISOString(), durationPlayed: 148 },
      { id: 'hist-7', trackId: 'track-13', playedAt: new Date(now - dayMs * 3).toISOString(), durationPlayed: 168 },
      { id: 'hist-8', trackId: 'track-28', playedAt: new Date(now - dayMs * 3 + 5000000).toISOString(), durationPlayed: 172 },
      { id: 'hist-9', trackId: 'track-19', playedAt: new Date(now - dayMs * 4).toISOString(), durationPlayed: 185 },
      { id: 'hist-10', trackId: 'track-34', playedAt: new Date(now - dayMs * 4 + 3200000).toISOString(), durationPlayed: 174 },
      { id: 'hist-11', trackId: 'track-2', playedAt: new Date(now - dayMs * 5).toISOString(), durationPlayed: 136 },
      { id: 'hist-12', trackId: 'track-5', playedAt: new Date(now - dayMs * 5 + 4200000).toISOString(), durationPlayed: 118 },
      { id: 'hist-13', trackId: 'track-22', playedAt: new Date(now - dayMs * 6).toISOString(), durationPlayed: 154 },
      { id: 'hist-14', trackId: 'track-8', playedAt: new Date(now - dayMs * 6 + 6100000).toISOString(), durationPlayed: 164 },
    ],
    preferences: { ...DEFAULT_PREFERENCES },
    createdAt: new Date(now - dayMs * 30).toISOString(),
  };

  const userPlaylists: Playlist[] = [
    {
      id: 'pl-user-1',
      name: 'Studio Night Rotation',
      description: 'Personal mix of electronic prisms, rain beats, and acoustic twilight.',
      ownerId: 'user-demo',
      ownerName: 'Listener Demo',
      coverImage: IMG.neonPrism,
      trackIds: ['track-1', 'track-4', 'track-13', 'track-28'],
      isCurated: false,
      likesCount: 1,
      createdAt: new Date(now - dayMs * 12).toISOString(),
    },
    {
      id: 'pl-user-2',
      name: 'Weekend Drive',
      description: 'Upbeat pop, Punjabi grooves, and hip-hop energy.',
      ownerId: 'user-demo',
      ownerName: 'Listener Demo',
      coverImage: '/api/artwork/art-pop-afterglow.svg',
      trackIds: ['track-16', 'track-25', 'track-10', 'track-7'],
      isCurated: false,
      likesCount: 1,
      createdAt: new Date(now - dayMs * 5).toISOString(),
    },
  ];

  return {
    users: [demoUser],
    playlists: [...CURATED_PLAYLISTS, ...userPlaylists],
  };
}

function saveLocalDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(localDb, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

export async function initDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      useMongo = true;
      const existingDemo = await UserModel.findOne({ id: 'user-demo' });
      const seed = buildSeedData();
      if (!existingDemo) {
        await UserModel.create(seed.users[0]);
      }
      const playlistCount = await PlaylistModel.countDocuments();
      if (playlistCount === 0) {
        await PlaylistModel.insertMany(seed.playlists);
      }
      console.log('Connected to MongoDB via Mongoose');
      return;
    } catch (err) {
      console.warn('MongoDB connection unavailable, falling back to local atomic persistence:', (err as Error).message);
      useMongo = false;
    }
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as LocalDbSchema;
      localDb = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [],
      };
      // Ensure curated playlists stay synced if new ones were added
      const existingIds = new Set(localDb.playlists.map((p) => p.id));
      for (const cp of CURATED_PLAYLISTS) {
        if (!existingIds.has(cp.id)) {
          localDb.playlists.push(cp);
        }
      }
      if (!localDb.users.some((u) => u.id === 'user-demo')) {
        localDb.users.push(buildSeedData().users[0]);
      }
      saveLocalDb();
    } catch {
      localDb = buildSeedData();
      saveLocalDb();
    }
  } else {
    localDb = buildSeedData();
    saveLocalDb();
  }
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  if (useMongo) {
    const doc = await UserModel.findOne({ email: normalized }).lean();
    return (doc as unknown as UserRecord) || null;
  }
  return localDb.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (useMongo) {
    const doc = await UserModel.findOne({ id }).lean();
    return (doc as unknown as UserRecord) || null;
  }
  return localDb.users.find((u) => u.id === id) || null;
}

export async function createUser(user: UserRecord): Promise<UserRecord> {
  if (useMongo) {
    await UserModel.create(user);
    return user;
  }
  localDb.users.push(user);
  saveLocalDb();
  return user;
}

export async function updateUser(id: string, updater: (u: UserRecord) => UserRecord): Promise<UserRecord | null> {
  if (useMongo) {
    const current = await findUserById(id);
    if (!current) return null;
    const next = updater({ ...current });
    await UserModel.updateOne({ id }, { $set: next });
    return next;
  }
  const idx = localDb.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  localDb.users[idx] = updater({ ...localDb.users[idx] });
  saveLocalDb();
  return localDb.users[idx];
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  if (useMongo) {
    const docs = await PlaylistModel.find().lean();
    return docs as unknown as Playlist[];
  }
  return localDb.playlists;
}

export async function getPlaylistById(id: string): Promise<Playlist | null> {
  if (useMongo) {
    const doc = await PlaylistModel.findOne({ id }).lean();
    return (doc as unknown as Playlist) || null;
  }
  return localDb.playlists.find((p) => p.id === id) || null;
}

export async function createPlaylist(playlist: Playlist): Promise<Playlist> {
  if (useMongo) {
    await PlaylistModel.create(playlist);
    return playlist;
  }
  localDb.playlists.unshift(playlist);
  saveLocalDb();
  return playlist;
}

export async function updatePlaylist(id: string, updater: (p: Playlist) => Playlist): Promise<Playlist | null> {
  if (useMongo) {
    const current = await getPlaylistById(id);
    if (!current) return null;
    const next = updater({ ...current });
    await PlaylistModel.updateOne({ id }, { $set: next });
    return next;
  }
  const idx = localDb.playlists.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  localDb.playlists[idx] = updater({ ...localDb.playlists[idx] });
  saveLocalDb();
  return localDb.playlists[idx];
}

export async function deletePlaylistById(id: string): Promise<boolean> {
  if (useMongo) {
    const res = await PlaylistModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const before = localDb.playlists.length;
  localDb.playlists = localDb.playlists.filter((p) => p.id !== id);
  const removed = localDb.playlists.length < before;
  if (removed) saveLocalDb();
  return removed;
}
