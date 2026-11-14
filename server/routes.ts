import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { serveArtworkSvg } from './artworkSvg';
import { serveTrackAudio } from './audioSynth';
import { AuthRequest, optionalAuth, requireAuth, signToken } from './auth';
import { ALBUMS, ARTISTS, GENRES, IMG, MOODS, TRACKS, getAlbumById, getArtistById, getTrackById } from './catalog';
import {
  DEFAULT_PREFERENCES,
  createPlaylist,
  createUser,
  deletePlaylistById,
  findUserByEmail,
  findUserById,
  getAllPlaylists,
  getPlaylistById,
  hashPassword,
  toPublicUser,
  updatePlaylist,
  updateUser,
  verifyPassword,
} from './db';
import { Mood, Playlist, Track, UserRecord } from './types';

function computeRecommendedTracks(user: UserRecord | undefined): Track[] {
  if (!user || (user.likedSongs.length === 0 && user.listeningHistory.length === 0)) {
    return [...TRACKS].sort((a, b) => b.playCount - a.playCount).slice(0, 12);
  }

  const genreWeights = new Map<string, number>();
  const artistWeights = new Map<string, number>();
  const moodWeights = new Map<string, number>();

  for (const id of user.likedSongs) {
    const t = getTrackById(id);
    if (t) {
      genreWeights.set(t.genre, (genreWeights.get(t.genre) || 0) + 3);
      artistWeights.set(t.artistId, (artistWeights.get(t.artistId) || 0) + 3);
      for (const m of t.moods) moodWeights.set(m, (moodWeights.get(m) || 0) + 2);
    }
  }
  for (const id of user.followedArtists) {
    artistWeights.set(id, (artistWeights.get(id) || 0) + 4);
  }
  for (const h of user.listeningHistory.slice(0, 20)) {
    const t = getTrackById(h.trackId);
    if (t) {
      genreWeights.set(t.genre, (genreWeights.get(t.genre) || 0) + 1.5);
      artistWeights.set(t.artistId, (artistWeights.get(t.artistId) || 0) + 1);
      for (const m of t.moods) moodWeights.set(m, (moodWeights.get(m) || 0) + 1);
    }
  }

  return [...TRACKS]
    .map((track) => {
      let score = track.playCount / 1_000_000;
      score += (genreWeights.get(track.genre) || 0) * 2.2;
      score += (artistWeights.get(track.artistId) || 0) * 1.8;
      for (const m of track.moods) score += (moodWeights.get(m) || 0) * 0.9;
      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.track)
    .slice(0, 12);
}

export function createApiRouter() {
  const router = express.Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'melody-api', trackCount: TRACKS.length });
  });

  // Media endpoints
  router.get('/audio/:trackId', serveTrackAudio);
  router.get('/artwork/:seed', serveArtworkSvg);

  // ================= AUTHENTICATION =================
  router.post('/auth/demo', async (_req: Request, res: Response) => {
    const demoUser = await findUserByEmail('demo@melody.app');
    if (!demoUser) {
      res.status(404).json({ error: 'Demo user unavailable' });
      return;
    }
    const token = signToken(demoUser.id);
    res.json({ token, user: toPublicUser(demoUser) });
  });

  router.post('/auth/register', async (req: Request, res: Response) => {
    const { username, email, password, confirmPassword } = req.body || {};
    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      res.status(400).json({ error: 'Username must be at least 2 characters.' });
      return;
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const user: UserRecord = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      username: username.trim().slice(0, 40),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      authProvider: 'local',
      profilePicture: IMG.defaultAvatar,
      likedSongs: [],
      savedAlbums: [],
      savedPlaylists: ['pl-midnight-sessions'],
      followedArtists: [],
      searchHistory: [],
      listeningHistory: [],
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt: new Date().toISOString(),
    };

    await createUser(user);
    const token = signToken(user.id);
    res.status(201).json({ token, user: toPublicUser(user) });
  });

  router.post('/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const user = await findUserByEmail(String(email));
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user: toPublicUser(user) });
  });

  router.post('/auth/forgot-password', async (req: Request, res: Response) => {
    const { email, newPassword } = req.body || {};
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Please provide your registered email address.' });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'No account found with that email address.' });
      return;
    }
    if (newPassword && typeof newPassword === 'string') {
      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters.' });
        return;
      }
      await updateUser(user.id, (u) => ({ ...u, passwordHash: hashPassword(newPassword) }));
      res.json({ message: 'Password updated successfully. You can now sign in.' });
      return;
    }
    res.json({ verified: true, message: 'Account verified. Enter a new password below to reset access.' });
  });

  router.post('/auth/google', async (req: Request, res: Response) => {
    const { credential } = req.body || {};
    if (!credential || typeof credential !== 'string') {
      res.status(400).json({ error: 'Missing Google ID credential token.' });
      return;
    }
    try {
      const verifyResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!verifyResp.ok) {
        res.status(401).json({ error: 'Unable to verify Google credential.' });
        return;
      }
      const payload = (await verifyResp.json()) as {
        email?: string;
        name?: string;
        picture?: string;
        aud?: string;
      };
      const expectedClientId = process.env.VITE_GOOGLE_CLIENT_ID;
      if (expectedClientId && payload.aud !== expectedClientId) {
        res.status(401).json({ error: 'Google token audience mismatch.' });
        return;
      }
      if (!payload.email) {
        res.status(400).json({ error: 'Google account did not return an email address.' });
        return;
      }
      let user = await findUserByEmail(payload.email);
      if (!user) {
        user = {
          id: `user-${crypto.randomUUID().slice(0, 8)}`,
          username: (payload.name || payload.email.split('@')[0]).slice(0, 40),
          email: payload.email.toLowerCase(),
          passwordHash: hashPassword(crypto.randomBytes(24).toString('hex')),
          authProvider: 'google',
          profilePicture: payload.picture || IMG.defaultAvatar,
          likedSongs: [],
          savedAlbums: [],
          savedPlaylists: ['pl-midnight-sessions'],
          followedArtists: [],
          searchHistory: [],
          listeningHistory: [],
          preferences: { ...DEFAULT_PREFERENCES },
          createdAt: new Date().toISOString(),
        };
        await createUser(user);
      }
      const token = signToken(user.id);
      res.json({ token, user: toPublicUser(user) });
    } catch {
      res.status(502).json({ error: 'Google verification service unreachable.' });
    }
  });

  router.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
    res.json({ user: toPublicUser(req.user!) });
  });

  // ================= HOME & DISCOVERY =================
  router.get('/home', optionalAuth, async (req: AuthRequest, res: Response) => {
    const user = req.user || (await findUserById('user-demo')) || undefined;
    const allPlaylists = await getAllPlaylists();
    const curated = allPlaylists.filter((p) => p.isCurated);

    const recommended = computeRecommendedTracks(user);
    const trending = [...TRACKS].sort((a, b) => b.playCount - a.playCount).slice(0, 12);
    const newReleases = [...ALBUMS].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    const popularAlbums = [...ALBUMS].slice(0, 10);
    const topArtists = [...ARTISTS].sort((a, b) => b.monthlyListeners - a.monthlyListeners);

    const recentTrackIds: string[] = [];
    if (user) {
      for (const h of user.listeningHistory) {
        if (!recentTrackIds.includes(h.trackId)) recentTrackIds.push(h.trackId);
      }
    }
    const recentlyPlayed = recentTrackIds
      .map((id) => getTrackById(id))
      .filter((t): t is Track => Boolean(t))
      .slice(0, 12);

    const quickPicks = TRACKS.slice(0, 12);
    const dailyMix = [...recommended].reverse().slice(0, 10);

    const selectedMood = (req.query.mood as Mood) || 'Focus';
    const moodTracks = TRACKS.filter((t) => t.moods.includes(selectedMood));

    res.json({
      featured: {
        type: 'playlist',
        playlist: curated[0],
        album: ALBUMS[0],
        artwork: IMG.heroStudio,
        headline: 'Midnight Sessions',
        subtitle: 'Aria Vance, Sora Takahashi, The Obsidian Quartet & more',
        description:
          'Curated late-night analog electronics, warm Rhodes loops, and modern chamber cuts mastered for deep listening.',
      },
      madeForYou: recommended,
      quickPicks,
      trendingNow: trending,
      popularAlbums,
      newReleases,
      topArtists,
      recommendedPlaylists: curated,
      recentlyPlayed: recentlyPlayed.length > 0 ? recentlyPlayed : trending.slice(0, 6),
      dailyMix,
      moodMusic: {
        mood: selectedMood,
        availableMoods: MOODS,
        tracks: moodTracks,
      },
    });
  });

  router.get('/explore', async (req: Request, res: Response) => {
    const genre = req.query.genre ? String(req.query.genre) : '';
    const mood = req.query.mood ? String(req.query.mood) : '';
    const region = req.query.region ? String(req.query.region) : '';

    let filteredTracks = [...TRACKS];
    if (genre && genre !== 'All') {
      filteredTracks = filteredTracks.filter((t) => t.genre.toLowerCase() === genre.toLowerCase());
    }
    if (mood && mood !== 'All') {
      filteredTracks = filteredTracks.filter((t) =>
        t.moods.some((m) => m.toLowerCase() === mood.toLowerCase())
      );
    }
    if (region && region !== 'All') {
      filteredTracks = filteredTracks.filter((t) => t.region.toLowerCase() === region.toLowerCase());
    }

    const topCharts = [...TRACKS].sort((a, b) => b.playCount - a.playCount).slice(0, 10);
    const recentReleases = [...ALBUMS].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    const regionalTracks = TRACKS.filter((t) => t.region === 'Regional');
    const internationalTracks = TRACKS.filter((t) => t.region === 'International');
    const allPlaylists = await getAllPlaylists();

    res.json({
      genres: GENRES,
      moods: MOODS,
      tracks: filteredTracks,
      topCharts,
      popularAlbums: ALBUMS,
      recentReleases,
      regionalTracks,
      internationalTracks,
      recommendedArtists: ARTISTS,
      playlists: allPlaylists.filter((p) => p.isCurated),
    });
  });

  // ================= SEARCH =================
  router.get('/search', optionalAuth, async (req: AuthRequest, res: Response) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const type = String(req.query.type || 'all').toLowerCase();
    const allPlaylists = await getAllPlaylists();

    const trendingSearches = ['Crimson Prism', 'Bollywood Dusk', 'Lo-fi', 'Aria Vance', 'Workout', 'Jazz'];

    if (!q) {
      res.json({
        query: '',
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
        genres: GENRES,
        trendingSearches,
        searchHistory: req.user?.searchHistory || [],
      });
      return;
    }

    const songs =
      type === 'all' || type === 'songs'
        ? TRACKS.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.artistName.toLowerCase().includes(q) ||
              t.albumTitle.toLowerCase().includes(q) ||
              t.genre.toLowerCase().includes(q) ||
              t.moods.some((m) => m.toLowerCase().includes(q))
          )
        : [];

    const artists =
      type === 'all' || type === 'artists'
        ? ARTISTS.filter((a) => a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q))
        : [];

    const albums =
      type === 'all' || type === 'albums'
        ? ALBUMS.filter(
            (al) =>
              al.title.toLowerCase().includes(q) ||
              al.artistName.toLowerCase().includes(q) ||
              al.genre.toLowerCase().includes(q)
          )
        : [];

    const playlists =
      type === 'all' || type === 'playlists'
        ? allPlaylists.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              (p.genre && p.genre.toLowerCase().includes(q)) ||
              (p.mood && p.mood.toLowerCase().includes(q))
          )
        : [];

    res.json({
      query: req.query.q,
      songs,
      artists,
      albums,
      playlists,
      genres: GENRES.filter((g) => g.toLowerCase().includes(q)),
      trendingSearches,
      searchHistory: req.user?.searchHistory || [],
    });
  });

  router.post('/search/history', requireAuth, async (req: AuthRequest, res: Response) => {
    const term = String(req.body?.query || '').trim().slice(0, 80);
    if (!term) {
      res.status(400).json({ error: 'Search query required' });
      return;
    }
    const updated = await updateUser(req.user!.id, (u) => ({
      ...u,
      searchHistory: [term, ...u.searchHistory.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 12),
    }));
    res.json({ searchHistory: updated?.searchHistory || [] });
  });

  router.delete('/search/history', requireAuth, async (req: AuthRequest, res: Response) => {
    await updateUser(req.user!.id, (u) => ({ ...u, searchHistory: [] }));
    res.json({ searchHistory: [] });
  });

  // ================= ENTITIES =================
  router.get('/songs', (_req: Request, res: Response) => {
    res.json({ tracks: TRACKS });
  });

  router.get('/songs/:id', (req: Request, res: Response) => {
    const track = getTrackById(String(req.params.id));
    if (!track) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }
    const artist = getArtistById(track.artistId);
    const album = getAlbumById(track.albumId);
    res.json({ track, artist, album });
  });

  router.get('/artists/:id', (req: Request, res: Response) => {
    const artist = getArtistById(String(req.params.id));
    if (!artist) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }
    const songs = TRACKS.filter((t) => t.artistId === artist.id).sort((a, b) => b.playCount - a.playCount);
    const albums = ALBUMS.filter((al) => al.artistId === artist.id);
    const relatedArtists = artist.relatedArtistIds
      .map((id) => getArtistById(id))
      .filter(Boolean);
    res.json({ artist, songs, albums, relatedArtists });
  });

  router.get('/albums/:id', (req: Request, res: Response) => {
    const album = getAlbumById(String(req.params.id));
    if (!album) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }
    const tracks = album.trackIds.map((id) => getTrackById(id)).filter((t): t is Track => Boolean(t));
    const artist = getArtistById(album.artistId);
    res.json({ album, tracks, artist });
  });

  // ================= SMART RADIO =================
  router.get('/radio', (req: Request, res: Response) => {
    const seedType = String(req.query.seedType || 'song');
    const seedId = String(req.query.seedId || 'track-1');

    let seedTrack = getTrackById(seedId);
    let targetGenre = seedTrack?.genre;
    let targetMoods: Mood[] = seedTrack?.moods || [];

    if (seedType === 'artist') {
      const artist = getArtistById(seedId);
      if (artist) {
        targetGenre = artist.genre;
        seedTrack = TRACKS.find((t) => t.artistId === artist.id);
        targetMoods = seedTrack?.moods || [];
      }
    } else if (seedType === 'genre') {
      targetGenre = seedId as Track['genre'];
    } else if (seedType === 'mood') {
      targetMoods = [seedId as Mood];
    }

    const scored = TRACKS.map((t) => {
      let score = 0;
      if (seedTrack && t.id === seedTrack.id) score += 100;
      if (targetGenre && t.genre.toLowerCase() === targetGenre.toLowerCase()) score += 10;
      for (const m of targetMoods) {
        if (t.moods.includes(m)) score += 5;
      }
      if (seedTrack && t.artistId === seedTrack.artistId) score += 4;
      score += (t.playCount / 3_500_000) * 2;
      return { track: t, score };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map((x) => x.track);

    res.json({ seedType, seedId, tracks: scored });
  });

  // ================= PLAYLISTS =================
  router.get('/playlists', optionalAuth, async (req: AuthRequest, res: Response) => {
    const all = await getAllPlaylists();
    const userId = req.user?.id;
    res.json({
      curated: all.filter((p) => p.isCurated),
      userPlaylists: userId ? all.filter((p) => !p.isCurated && p.ownerId === userId) : all.filter((p) => !p.isCurated),
      all,
    });
  });

  router.get('/playlists/:id', async (req: Request, res: Response) => {
    const playlist = await getPlaylistById(String(req.params.id));
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    const tracks = playlist.trackIds
      .map((id) => getTrackById(id))
      .filter((t): t is Track => Boolean(t));
    res.json({ playlist, tracks });
  });

  router.post('/playlists', requireAuth, async (req: AuthRequest, res: Response) => {
    const { name, description, coverImage, trackIds } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      res.status(400).json({ error: 'Playlist name is required.' });
      return;
    }
    const validTracks = Array.isArray(trackIds)
      ? trackIds.filter((id) => typeof id === 'string' && Boolean(getTrackById(id)))
      : [];

    const playlist: Playlist = {
      id: `pl-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim().slice(0, 80),
      description: String(description || '').trim().slice(0, 300),
      ownerId: req.user!.id,
      ownerName: req.user!.username,
      coverImage: typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : IMG.neonPrism,
      trackIds: validTracks,
      isCurated: false,
      likesCount: 1,
      createdAt: new Date().toISOString(),
    };

    await createPlaylist(playlist);
    await updateUser(req.user!.id, (u) => ({
      ...u,
      savedPlaylists: [playlist.id, ...u.savedPlaylists.filter((id) => id !== playlist.id)],
    }));

    res.status(201).json({ playlist });
  });

  router.patch('/playlists/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    const existing = await getPlaylistById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    if (existing.isCurated || existing.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'You can only edit playlists you created.' });
      return;
    }
    const { name, description, coverImage } = req.body || {};
    const updated = await updatePlaylist(existing.id, (p) => ({
      ...p,
      name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : p.name,
      description: typeof description === 'string' ? description.trim().slice(0, 300) : p.description,
      coverImage: typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : p.coverImage,
    }));
    res.json({ playlist: updated });
  });

  router.delete('/playlists/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    const existing = await getPlaylistById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    if (existing.isCurated || existing.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'You can only delete playlists you created.' });
      return;
    }
    await deletePlaylistById(existing.id);
    await updateUser(req.user!.id, (u) => ({
      ...u,
      savedPlaylists: u.savedPlaylists.filter((id) => id !== existing.id),
    }));
    res.json({ deleted: true });
  });

  router.post('/playlists/:id/tracks', requireAuth, async (req: AuthRequest, res: Response) => {
    const existing = await getPlaylistById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    if (existing.isCurated || existing.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'You can only modify your own playlists.' });
      return;
    }
    const trackId = String(req.body?.trackId || '');
    if (!getTrackById(trackId)) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    const updated = await updatePlaylist(existing.id, (p) => ({
      ...p,
      trackIds: p.trackIds.includes(trackId) ? p.trackIds : [...p.trackIds, trackId],
    }));
    res.json({ playlist: updated });
  });

  router.delete('/playlists/:id/tracks/:trackId', requireAuth, async (req: AuthRequest, res: Response) => {
    const existing = await getPlaylistById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    if (existing.isCurated || existing.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'You can only modify your own playlists.' });
      return;
    }
    const trackId = String(req.params.trackId);
    const updated = await updatePlaylist(existing.id, (p) => ({
      ...p,
      trackIds: p.trackIds.filter((id) => id !== trackId),
    }));
    res.json({ playlist: updated });
  });

  router.put('/playlists/:id/reorder', requireAuth, async (req: AuthRequest, res: Response) => {
    const existing = await getPlaylistById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    if (existing.isCurated || existing.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'You can only reorder your own playlists.' });
      return;
    }
    const trackIds = req.body?.trackIds;
    if (!Array.isArray(trackIds)) {
      res.status(400).json({ error: 'trackIds array is required.' });
      return;
    }
    const validIds = trackIds.filter((id) => typeof id === 'string' && Boolean(getTrackById(id)));
    const updated = await updatePlaylist(existing.id, (p) => ({ ...p, trackIds: validIds }));
    res.json({ playlist: updated });
  });

  router.post('/playlists/:id/save', requireAuth, async (req: AuthRequest, res: Response) => {
    const playlist = await getPlaylistById(String(req.params.id));
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    const alreadySaved = req.user!.savedPlaylists.includes(playlist.id);
    const updatedUser = await updateUser(req.user!.id, (u) => ({
      ...u,
      savedPlaylists: alreadySaved
        ? u.savedPlaylists.filter((id) => id !== playlist.id)
        : [playlist.id, ...u.savedPlaylists],
    }));
    await updatePlaylist(playlist.id, (p) => ({
      ...p,
      likesCount: Math.max(0, p.likesCount + (alreadySaved ? -1 : 1)),
    }));
    res.json({ saved: !alreadySaved, user: toPublicUser(updatedUser!) });
  });

  // ================= LIBRARY =================
  router.get('/library', requireAuth, async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const allPlaylists = await getAllPlaylists();

    const likedTracks = user.likedSongs
      .map((id) => getTrackById(id))
      .filter((t): t is Track => Boolean(t));

    const albums = user.savedAlbums
      .map((id) => getAlbumById(id))
      .filter(Boolean);

    const artists = user.followedArtists
      .map((id) => getArtistById(id))
      .filter(Boolean);

    const playlists = allPlaylists.filter(
      (p) => p.ownerId === user.id || user.savedPlaylists.includes(p.id)
    );

    const history = user.listeningHistory
      .map((entry) => ({
        ...entry,
        track: getTrackById(entry.trackId),
      }))
      .filter((e) => Boolean(e.track));

    res.json({
      likedTracks,
      albums,
      artists,
      playlists,
      history,
    });
  });

  router.post('/library/like/:trackId', requireAuth, async (req: AuthRequest, res: Response) => {
    const trackId = String(req.params.trackId);
    if (!getTrackById(trackId)) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    const liked = req.user!.likedSongs.includes(trackId);
    const updated = await updateUser(req.user!.id, (u) => ({
      ...u,
      likedSongs: liked ? u.likedSongs.filter((id) => id !== trackId) : [trackId, ...u.likedSongs],
    }));
    res.json({ liked: !liked, user: toPublicUser(updated!) });
  });

  router.post('/library/album/:albumId', requireAuth, async (req: AuthRequest, res: Response) => {
    const albumId = String(req.params.albumId);
    if (!getAlbumById(albumId)) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }
    const saved = req.user!.savedAlbums.includes(albumId);
    const updated = await updateUser(req.user!.id, (u) => ({
      ...u,
      savedAlbums: saved ? u.savedAlbums.filter((id) => id !== albumId) : [albumId, ...u.savedAlbums],
    }));
    res.json({ saved: !saved, user: toPublicUser(updated!) });
  });

  router.post('/library/follow/:artistId', requireAuth, async (req: AuthRequest, res: Response) => {
    const artistId = String(req.params.artistId);
    if (!getArtistById(artistId)) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }
    const following = req.user!.followedArtists.includes(artistId);
    const updated = await updateUser(req.user!.id, (u) => ({
      ...u,
      followedArtists: following
        ? u.followedArtists.filter((id) => id !== artistId)
        : [artistId, ...u.followedArtists],
    }));
    res.json({ following: !following, user: toPublicUser(updated!) });
  });

  // ================= HISTORY & ANALYTICS =================
  router.post('/history', requireAuth, async (req: AuthRequest, res: Response) => {
    if (req.user!.preferences.privateSession) {
      res.json({ recorded: false, reason: 'Private session enabled' });
      return;
    }
    const trackId = String(req.body?.trackId || '');
    const durationPlayed = Math.max(1, Math.min(600, Number(req.body?.durationPlayed) || 30));
    const track = getTrackById(trackId);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    const entry = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      trackId,
      playedAt: new Date().toISOString(),
      durationPlayed: Math.round(durationPlayed),
    };
    await updateUser(req.user!.id, (u) => ({
      ...u,
      listeningHistory: [entry, ...u.listeningHistory].slice(0, 150),
    }));
    res.json({ recorded: true, entry });
  });

  router.get('/history', requireAuth, (req: AuthRequest, res: Response) => {
    const entries = req.user!.listeningHistory;
    const enriched = entries
      .map((e) => ({ ...e, track: getTrackById(e.trackId) }))
      .filter((e): e is typeof e & { track: Track } => Boolean(e.track));

    const totalSeconds = enriched.reduce((acc, item) => acc + (item.durationPlayed || item.track.duration), 0);

    // Top artists & genres
    const artistCounts = new Map<string, { id: string; name: string; image: string; plays: number }>();
    const genreCounts = new Map<string, number>();
    const recentAlbumIds: string[] = [];

    for (const item of enriched) {
      const a = getArtistById(item.track.artistId);
      if (a) {
        const cur = artistCounts.get(a.id) || { id: a.id, name: a.name, image: a.profileImage, plays: 0 };
        cur.plays += 1;
        artistCounts.set(a.id, cur);
      }
      genreCounts.set(item.track.genre, (genreCounts.get(item.track.genre) || 0) + 1);
      if (!recentAlbumIds.includes(item.track.albumId)) recentAlbumIds.push(item.track.albumId);
    }

    // Weekly listening activity (last 7 days)
    const days: { date: string; label: string; minutes: number; plays: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ date: iso, label, minutes: 0, plays: 0 });
    }
    for (const item of enriched) {
      const dayIso = item.playedAt.slice(0, 10);
      const bucket = days.find((d) => d.date === dayIso);
      if (bucket) {
        bucket.plays += 1;
        bucket.minutes += Math.round((item.durationPlayed || item.track.duration) / 60);
      }
    }

    res.json({
      entries: enriched,
      recentAlbums: recentAlbumIds.map((id) => getAlbumById(id)).filter(Boolean),
      topArtists: Array.from(artistCounts.values()).sort((a, b) => b.plays - a.plays).slice(0, 6),
      favoriteGenres: Array.from(genreCounts.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count),
      totalListeningSeconds: totalSeconds,
      totalPlays: enriched.length,
      weeklyActivity: days,
    });
  });

  router.delete('/history', requireAuth, async (req: AuthRequest, res: Response) => {
    await updateUser(req.user!.id, (u) => ({ ...u, listeningHistory: [] }));
    res.json({ cleared: true });
  });

  // ================= USER PROFILE & PREFERENCES =================
  router.patch('/user/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    const { username, profilePicture } = req.body || {};
    const updated = await updateUser(req.user!.id, (u) => ({
      ...u,
      username: typeof username === 'string' && username.trim().length >= 2 ? username.trim().slice(0, 40) : u.username,
      profilePicture:
        typeof profilePicture === 'string' && profilePicture.trim() ? profilePicture.trim() : u.profilePicture,
    }));
    res.json({ user: toPublicUser(updated!) });
  });

  router.patch('/user/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
    const prefs = req.body || {};
    const updated = await updateUser(req.user!.id, (u) => ({
      ...u,
      preferences: {
        ...u.preferences,
        ...(prefs.theme === 'dark' || prefs.theme === 'light' ? { theme: prefs.theme } : {}),
        ...(prefs.audioQuality === 'standard' || prefs.audioQuality === 'high' || prefs.audioQuality === 'lossless'
          ? { audioQuality: prefs.audioQuality }
          : {}),
        ...(typeof prefs.autoplay === 'boolean' ? { autoplay: prefs.autoplay } : {}),
        ...(typeof prefs.crossfadeSeconds === 'number'
          ? { crossfadeSeconds: Math.max(0, Math.min(10, prefs.crossfadeSeconds)) }
          : {}),
        ...(typeof prefs.notificationsEnabled === 'boolean'
          ? { notificationsEnabled: prefs.notificationsEnabled }
          : {}),
        ...(typeof prefs.privateSession === 'boolean' ? { privateSession: prefs.privateSession } : {}),
        ...(typeof prefs.equalizerPreset === 'string' ? { equalizerPreset: prefs.equalizerPreset } : {}),
        ...(Array.isArray(prefs.equalizerBands) && prefs.equalizerBands.length === 5
          ? { equalizerBands: prefs.equalizerBands.map((n: unknown) => Number(n) || 0) }
          : {}),
      },
    }));
    res.json({ user: toPublicUser(updated!) });
  });

  return router;
}
