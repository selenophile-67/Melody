import mongoose, { Schema } from 'mongoose';

const PreferencesSchema = new Schema(
  {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    audioQuality: { type: String, enum: ['standard', 'high', 'lossless'], default: 'high' },
    autoplay: { type: Boolean, default: true },
    crossfadeSeconds: { type: Number, default: 2 },
    notificationsEnabled: { type: Boolean, default: true },
    privateSession: { type: Boolean, default: false },
    equalizerPreset: { type: String, default: 'Normal' },
    equalizerBands: { type: [Number], default: [0, 0, 0, 0, 0] },
  },
  { _id: false }
);

const HistoryEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    trackId: { type: String, required: true },
    playedAt: { type: String, required: true },
    durationPlayed: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  authProvider: { type: String, enum: ['local', 'google', 'demo'], default: 'local' },
  profilePicture: { type: String, default: '' },
  likedSongs: { type: [String], default: [] },
  savedAlbums: { type: [String], default: [] },
  savedPlaylists: { type: [String], default: [] },
  followedArtists: { type: [String], default: [] },
  searchHistory: { type: [String], default: [] },
  listeningHistory: { type: [HistoryEntrySchema], default: [] },
  preferences: { type: PreferencesSchema, default: () => ({}) },
  createdAt: { type: String, required: true },
});

const PlaylistSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  coverImage: { type: String, default: '' },
  trackIds: { type: [String], default: [] },
  isCurated: { type: Boolean, default: false },
  mood: { type: String },
  genre: { type: String },
  likesCount: { type: Number, default: 0 },
  createdAt: { type: String, required: true },
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const PlaylistModel = mongoose.models.Playlist || mongoose.model('Playlist', PlaylistSchema);
