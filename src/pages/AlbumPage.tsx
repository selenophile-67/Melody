import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, Play, Radio, Shuffle } from 'lucide-react';
import { Artwork } from '../components/Artwork';
import { TrackRow } from '../components/MediaCards';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';
import { Album, Artist, Track, formatTotalDuration } from '../types';

interface AlbumResponse {
  album: Album;
  tracks: Track[];
  artist?: Artist;
}

export function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const { user, toggleSaveAlbum } = useAuth();
  const { playTracks, startSmartRadio } = usePlayer();
  const [data, setData] = useState<AlbumResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<AlbumResponse>(`/api/albums/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-12 text-center text-sm text-zinc-500">Loading album…</div>;
  if (!data) return <div className="py-16 text-center text-sm text-zinc-500">Album not found.</div>;

  const { album, tracks } = data;
  const totalSecs = tracks.reduce((sum, t) => sum + t.duration, 0);
  const isSaved = user?.savedAlbums.includes(album.id) ?? false;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end gap-6 p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
        <Artwork src={album.artwork} alt={album.title} className="w-40 h-40 sm:w-48 sm:h-48 shrink-0 shadow-xl" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Album</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{album.title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">{album.description}</p>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-2 tabular-nums pt-1">
            <Link to={`/artist/${album.artistId}`} className="font-semibold text-zinc-900 dark:text-white hover:underline">
              {album.artistName}
            </Link>
            <span aria-hidden="true">·</span>
            <span>{album.releaseDate.slice(0, 4)}</span>
            <span aria-hidden="true">·</span>
            <span>{album.genre}</span>
            <span aria-hidden="true">·</span>
            <span>{tracks.length} tracks</span>
            <span aria-hidden="true">·</span>
            <span>{formatTotalDuration(totalSecs)}</span>
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => playTracks(tracks, 0)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Album</span>
            </button>
            <button
              type="button"
              onClick={() => playTracks(tracks, 0, true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSaveAlbum(album.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                isSaved
                  ? 'border-[#FF3B5C] text-[#FF3B5C] bg-[#FF3B5C]/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save Album'}</span>
            </button>
            <button
              type="button"
              onClick={() => startSmartRadio('song', tracks[0]?.id || 'track-1', album.title)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium"
            >
              <Radio className="w-4 h-4 text-[#FF3B5C]" />
              <span>Album Radio</span>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
        {tracks.map((track, idx) => (
          <TrackRow key={track.id} track={track} index={idx} contextQueue={tracks} />
        ))}
      </div>
    </div>
  );
}
