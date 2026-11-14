import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Heart, Play, Trash2 } from 'lucide-react';
import { AlbumCard, ArtistCard, PlaylistCard, TrackRow } from '../components/MediaCards';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';
import { Album, Artist, Playlist, Track } from '../types';

type LibraryTab = 'playlists' | 'liked' | 'albums' | 'artists' | 'downloads' | 'history';
type SortOrder = 'recent' | 'alpha' | 'played';

interface LibraryResponse {
  likedTracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  history: { id: string; trackId: string; playedAt: string; track: Track }[];
}

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as LibraryTab) || 'playlists';
  const [tab, setTab] = useState<LibraryTab>(initialTab);
  const [sortBy, setSortBy] = useState<SortOrder>('recent');
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, toggleSaveAlbum, toggleFollowArtist } = useAuth();
  const { downloadedTracks, removeOfflineDownload, playTracks } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    const paramTab = searchParams.get('tab') as LibraryTab | null;
    if (paramTab && ['playlists', 'liked', 'albums', 'artists', 'downloads', 'history'].includes(paramTab)) {
      setTab(paramTab);
    }
  }, [searchParams]);

  const loadLibrary = () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<LibraryResponse>('/api/library')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLibrary();
  }, [user?.id, user?.likedSongs.length, user?.savedAlbums.length, user?.followedArtists.length, user?.savedPlaylists.length]);

  const changeTab = (next: LibraryTab) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  const sortedLiked = useMemo(() => {
    const list = [...(data?.likedTracks || [])];
    if (sortBy === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'played') list.sort((a, b) => b.playCount - a.playCount);
    return list;
  }, [data?.likedTracks, sortBy]);

  const sortedPlaylists = useMemo(() => {
    const list = [...(data?.playlists || [])];
    if (sortBy === 'alpha') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [data?.playlists, sortBy]);

  const sortedAlbums = useMemo(() => {
    const list = [...(data?.albums || [])];
    if (sortBy === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [data?.albums, sortBy]);

  const sortedArtists = useMemo(() => {
    const list = [...(data?.artists || [])];
    if (sortBy === 'alpha') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [data?.artists, sortBy]);

  if (!user && tab !== 'downloads') {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Your Library</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sign in or enable Demo Mode to access your saved playlists, liked songs, and albums.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 rounded-xl bg-[#FF3B5C] text-white text-sm font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Your saved playlists, liked tracks, albums, followed artists, and offline downloads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="library-sort" className="text-xs text-zinc-500">
            Sort:
          </label>
          <select
            id="library-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOrder)}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 focus:outline-none"
          >
            <option value="recent">Recently Added</option>
            <option value="alpha">Alphabetical</option>
            <option value="played">Recently Played</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {(
          [
            { id: 'playlists', label: 'Playlists' },
            { id: 'liked', label: 'Liked Songs' },
            { id: 'albums', label: 'Albums' },
            { id: 'artists', label: 'Artists' },
            { id: 'downloads', label: `Downloads (${downloadedTracks.length})` },
            { id: 'history', label: 'Listening History' },
          ] as { id: LibraryTab; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changeTab(item.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              tab === item.id
                ? 'bg-[#FF3B5C] text-white'
                : 'bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && tab !== 'downloads' ? (
        <div className="py-12 text-center text-sm text-zinc-500">Loading your library…</div>
      ) : (
        <>
          {tab === 'playlists' && (
            <div className="space-y-4">
              {sortedPlaylists.length === 0 ? (
                <div className="py-14 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <p className="text-sm text-zinc-500">No saved playlists yet.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/playlists?create=1')}
                    className="px-4 py-2 rounded-xl bg-[#FF3B5C] text-white text-xs font-semibold"
                  >
                    Create Playlist
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {sortedPlaylists.map((pl) => (
                    <PlaylistCard
                      key={pl.id}
                      playlist={pl}
                      onPlayPlaylist={async (p) => {
                        const res = await api.get<{ tracks: Track[] }>(`/api/playlists/${p.id}`);
                        playTracks(res.tracks, 0);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'liked' && (
            <div className="space-y-4">
              {sortedLiked.length === 0 ? (
                <div className="py-14 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <Heart className="w-7 h-7 mx-auto text-zinc-400" />
                  <p className="text-sm text-zinc-500">Tap the heart on any song to save it here.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 tabular-nums">{sortedLiked.length} liked songs</span>
                    <button
                      type="button"
                      onClick={() => playTracks(sortedLiked, 0)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF3B5C] text-white text-xs font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play All</span>
                    </button>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
                    {sortedLiked.map((track, idx) => (
                      <TrackRow key={track.id} track={track} index={idx} contextQueue={sortedLiked} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'albums' && (
            <div>
              {sortedAlbums.length === 0 ? (
                <div className="py-14 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">No saved albums yet. Explore releases to add albums.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {sortedAlbums.map((album) => (
                    <div key={album.id} className="space-y-2">
                      <AlbumCard
                        album={album}
                        onPlayAlbum={async (al) => {
                          const res = await api.get<{ tracks: Track[] }>(`/api/albums/${al.id}`);
                          playTracks(res.tracks, 0);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleSaveAlbum(album.id)}
                        className="text-xs text-zinc-500 hover:text-rose-500 px-1"
                      >
                        Remove album
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'artists' && (
            <div>
              {sortedArtists.length === 0 ? (
                <div className="py-14 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">You are not following any artists yet.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {sortedArtists.map((artist) => (
                    <div key={artist.id} className="flex flex-col items-center gap-2">
                      <ArtistCard artist={artist} />
                      <button
                        type="button"
                        onClick={() => toggleFollowArtist(artist.id)}
                        className="text-xs text-zinc-500 hover:text-rose-500"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'downloads' && (
            <div className="space-y-4">
              {downloadedTracks.length === 0 ? (
                <div className="py-14 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <Download className="w-7 h-7 mx-auto text-zinc-400" />
                  <p className="text-sm font-medium">No offline downloads yet</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Use the three-dot menu on any track and choose “Download offline” to cache audio locally.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {downloadedTracks.length} cached offline tracks
                    </span>
                    <button
                      type="button"
                      onClick={() => playTracks(downloadedTracks, 0)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF3B5C] text-white text-xs font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Downloads</span>
                    </button>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
                    {downloadedTracks.map((track, idx) => (
                      <div key={track.id} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <TrackRow track={track} index={idx} contextQueue={downloadedTracks} />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOfflineDownload(track.id)}
                          aria-label={`Delete offline copy of ${track.title}`}
                          className="p-2 text-zinc-400 hover:text-rose-500 mr-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 tabular-nums">
                  {data?.history.length || 0} recent plays
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/history')}
                  className="text-xs font-medium text-[#FF3B5C] hover:underline"
                >
                  Open full listening analytics
                </button>
              </div>
              {!data || data.history.length === 0 ? (
                <div className="py-14 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">No recent plays recorded yet.</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
                  {data.history.slice(0, 20).map((entry, idx) => (
                    <TrackRow
                      key={entry.id}
                      track={entry.track}
                      index={idx}
                      contextQueue={data.history.map((h) => h.track)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
