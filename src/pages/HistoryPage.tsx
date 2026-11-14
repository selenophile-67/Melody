import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Artwork } from '../components/Artwork';
import { AlbumCard, TrackRow } from '../components/MediaCards';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Album, Track, formatTotalDuration } from '../types';

interface HistoryResponse {
  entries: { id: string; trackId: string; playedAt: string; durationPlayed: number; track: Track }[];
  recentAlbums: Album[];
  topArtists: { id: string; name: string; image: string; plays: number }[];
  favoriteGenres: { genre: string; count: number }[];
  totalListeningSeconds: number;
  totalPlays: number;
  weeklyActivity: { date: string; label: string; minutes: number; plays: number }[];
}

export function HistoryPage() {
  const { user } = useAuth();
  const { playTracks } = usePlayer();
  const { showToast } = useToast();

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const loadHistory = () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<HistoryResponse>('/api/history')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const handleClear = async () => {
    await api.delete('/api/history');
    setConfirmClear(false);
    showToast('Listening history cleared', 'info');
    loadHistory();
  };

  if (!user) {
    return (
      <div className="py-16 text-center space-y-3">
        <h1 className="text-2xl font-bold">Listening History</h1>
        <p className="text-sm text-zinc-500">Sign in or activate Demo Mode to view your listening activity.</p>
      </div>
    );
  }

  if (loading && !data) {
    return <div className="py-12 text-center text-sm text-zinc-500">Loading listening analytics…</div>;
  }

  if (!data) return null;

  const maxMinutes = Math.max(10, ...data.weeklyActivity.map((d) => d.minutes));
  const maxGenreCount = Math.max(1, ...(data.favoriteGenres.map((g) => g.count) || [1]));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listening History & Insights</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Your playback activity, favorite artists, and genre balance over the past 7 days.
          </p>
        </div>
        {data.entries.length > 0 && (
          <div>
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Listening History</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Listening Time</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">
            {formatTotalDuration(data.totalListeningSeconds)}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Tracks Played</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{data.totalPlays}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Most Played Artist</div>
          <div className="text-xl font-bold mt-1 truncate">{data.topArtists[0]?.name || '—'}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Top Genre</div>
          <div className="text-xl font-bold mt-1 truncate">{data.favoriteGenres[0]?.genre || '—'}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Daily Listening Activity</h2>
              <p className="text-xs text-zinc-500">Minutes streamed over the last 7 days</p>
            </div>
            {hoveredDay !== null && data.weeklyActivity[hoveredDay] && (
              <div className="text-xs font-mono-tabular text-[#FF3B5C]">
                {data.weeklyActivity[hoveredDay].label}: {data.weeklyActivity[hoveredDay].minutes}m (
                {data.weeklyActivity[hoveredDay].plays} plays)
              </div>
            )}
          </div>

          <div className="h-48 flex items-end gap-3 pt-4">
            {data.weeklyActivity.map((day, idx) => {
              const heightPct = Math.max(6, Math.round((day.minutes / maxMinutes) * 100));
              return (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(idx)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                >
                  <div className="text-[11px] font-mono-tabular text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.minutes}m
                  </div>
                  <div className="w-full max-w-[44px] h-32 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-200 ${
                        hoveredDay === idx ? 'bg-[#FF5270]' : 'bg-[#FF3B5C]/80'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite Genres & Top Artists */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-4">
          <h2 className="text-base font-semibold">Favorite Genres</h2>
          {data.favoriteGenres.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">Play tracks to build your genre breakdown.</p>
          ) : (
            <div className="space-y-3">
              {data.favoriteGenres.slice(0, 5).map((item) => (
                <div key={item.genre} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{item.genre}</span>
                    <span className="font-mono-tabular text-zinc-500">{item.count} plays</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-[#FF3B5C] rounded-full"
                      style={{ width: `${Math.round((item.count / maxGenreCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Artists List */}
      {data.topArtists.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Most Played Artists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.topArtists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] hover:border-[#FF3B5C]/50 transition-colors"
              >
                <Artwork src={artist.image} alt={artist.name} className="w-12 h-12 shrink-0" rounded="rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{artist.name}</div>
                  <div className="text-xs text-zinc-500 tabular-nums">{artist.plays} plays</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played Albums */}
      {data.recentAlbums.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recently Played Albums</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 melody-scroll">
            {data.recentAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onPlayAlbum={async (al) => {
                  const res = await api.get<{ tracks: Track[] }>(`/api/albums/${al.id}`);
                  playTracks(res.tracks, 0);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Played Tracks */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recently Played Songs</h2>
        {data.entries.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
            Your listening history is empty. Play any song to start tracking!
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {data.entries.map((entry, idx) => (
              <TrackRow
                key={entry.id}
                track={entry.track}
                index={idx}
                contextQueue={data.entries.map((e) => e.track)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
