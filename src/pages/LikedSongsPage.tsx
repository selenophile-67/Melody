import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Play, Shuffle } from 'lucide-react';
import { TrackRow } from '../components/MediaCards';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';
import { Track, formatTotalDuration } from '../types';

export function LikedSongsPage() {
  const { user } = useAuth();
  const { playTracks } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<{ likedTracks: Track[] }>('/api/library')
      .then((res) => setTracks(res.likedTracks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, user?.likedSongs.length]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
    );
  }, [tracks, filter]);

  const totalSecs = tracks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-5 p-6 rounded-2xl bg-gradient-to-br from-[#FF3B5C]/20 via-zinc-900/10 to-transparent border border-zinc-200 dark:border-white/[0.08]">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-[#FF3B5C] flex items-center justify-center shrink-0 shadow-xl">
          <Heart className="w-12 h-12 text-white fill-white" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Collection</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Liked Songs</h1>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums flex items-center gap-2">
            <span>{user?.username || 'Guest'}</span>
            <span aria-hidden="true">·</span>
            <span>{tracks.length} songs</span>
            <span aria-hidden="true">·</span>
            <span>{formatTotalDuration(totalSecs)}</span>
          </div>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={() => playTracks(filtered, 0)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All</span>
            </button>
            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={() => playTracks(filtered, 0, true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      </div>

      {tracks.length > 0 && (
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter liked songs…"
          className="w-full max-w-sm px-4 py-2 text-sm rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
        />
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-500">Loading liked songs…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
          {tracks.length === 0 ? 'No liked songs yet. Tap the heart icon on any track.' : 'No liked songs match your filter.'}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
          {filtered.map((track, idx) => (
            <TrackRow key={track.id} track={track} index={idx} contextQueue={filtered} />
          ))}
        </div>
      )}
    </div>
  );
}
