import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Radio } from 'lucide-react';
import { AlbumCard, ArtistCard, PlaylistCard, TrackRow } from '../components/MediaCards';
import { HorizontalShelf } from '../components/HorizontalShelf';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';
import { Album, Artist, Genre, Mood, Playlist, Track } from '../types';

interface ExploreResponse {
  genres: Genre[];
  moods: Mood[];
  tracks: Track[];
  topCharts: Track[];
  popularAlbums: Album[];
  recentReleases: Album[];
  regionalTracks: Track[];
  internationalTracks: Track[];
  recommendedArtists: Artist[];
  playlists: Playlist[];
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedGenre, setSelectedGenre] = useState<string>(searchParams.get('genre') || 'All');
  const [selectedMood, setSelectedMood] = useState<string>(searchParams.get('mood') || 'All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [data, setData] = useState<ExploreResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const { playTracks, startSmartRadio } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedGenre !== 'All') params.set('genre', selectedGenre);
    if (selectedMood !== 'All') params.set('mood', selectedMood);
    if (selectedRegion !== 'All') params.set('region', selectedRegion);

    api
      .get<ExploreResponse>(`/api/explore?${params.toString()}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedGenre, selectedMood, selectedRegion]);

  const selectGenre = (genre: string) => {
    setSelectedGenre(genre);
    const next = new URLSearchParams(searchParams);
    if (genre === 'All') next.delete('genre');
    else next.set('genre', genre);
    setSearchParams(next, { replace: true });
  };

  const selectMood = (mood: string) => {
    setSelectedMood(mood);
    const next = new URLSearchParams(searchParams);
    if (mood === 'All') next.delete('mood');
    else next.set('mood', mood);
    setSearchParams(next, { replace: true });
  };

  if (loading && !data) {
    return <div className="py-12 text-center text-sm text-zinc-500">Loading Explore catalog…</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Explore</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse by genre, mood, regional scenes, and trending charts.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900 self-start">
          {['All', 'International', 'Regional'].map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => setSelectedRegion(region)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedRegion === region
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Genres Filter Grid */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Genres</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectGenre('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              selectedGenre === 'All'
                ? 'bg-[#FF3B5C] text-white'
                : 'bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
            }`}
          >
            All Genres
          </button>
          {data.genres.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => selectGenre(genre)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                selectedGenre === genre
                  ? 'bg-[#FF3B5C] text-white'
                  : 'bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Moods Filter Grid */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Moods</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectMood('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              selectedMood === 'All'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                : 'bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
            }`}
          >
            All Moods
          </button>
          {data.moods.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => selectMood(mood)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                selectedMood === mood
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                  : 'bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </section>

      {/* Filtered Tracks Results */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {selectedGenre !== 'All' || selectedMood !== 'All' || selectedRegion !== 'All'
                ? 'Matching Tracks'
                : 'Trending Songs'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              {data.tracks.length} tracks
              {selectedGenre !== 'All' ? ` · ${selectedGenre}` : ''}
              {selectedMood !== 'All' ? ` · ${selectedMood}` : ''}
              {selectedRegion !== 'All' ? ` · ${selectedRegion}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data.tracks.length > 0 && (
              <button
                type="button"
                onClick={() => playTracks(data.tracks, 0)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All</span>
              </button>
            )}
            {(selectedGenre !== 'All' || selectedMood !== 'All') && (
              <button
                type="button"
                onClick={() =>
                  startSmartRadio(
                    selectedGenre !== 'All' ? 'genre' : 'mood',
                    selectedGenre !== 'All' ? selectedGenre : selectedMood,
                    selectedGenre !== 'All' ? selectedGenre : selectedMood
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium whitespace-nowrap shrink-0"
              >
                <Radio className="w-3.5 h-3.5 text-[#FF3B5C]" />
                <span>Start Radio</span>
              </button>
            )}
          </div>
        </div>

        {data.tracks.length === 0 ? (
          <div className="py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
            <p className="text-sm font-medium">No tracks match this combination of filters.</p>
            <button
              type="button"
              onClick={() => {
                selectGenre('All');
                selectMood('All');
                setSelectedRegion('All');
              }}
              className="text-xs font-medium text-[#FF3B5C] hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {data.tracks.slice(0, 12).map((track, idx) => (
              <TrackRow key={track.id} track={track} index={idx} contextQueue={data.tracks} />
            ))}
          </div>
        )}
      </section>

      {/* Top Charts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top Charts</h2>
          <button
            type="button"
            onClick={() => playTracks(data.topCharts, 0)}
            className="text-xs font-medium text-[#FF3B5C] hover:underline"
          >
            Play Chart
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {data.topCharts.slice(0, 8).map((track, idx) => (
            <div
              key={track.id}
              className="rounded-xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]"
            >
              <TrackRow track={track} index={idx} contextQueue={data.topCharts} />
            </div>
          ))}
        </div>
      </section>

      {/* Popular Albums & Recent Releases */}
      <HorizontalShelf title="Recently Released Albums">
        {data.recentReleases.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onPlayAlbum={async (al) => {
              const res = await api.get<{ tracks: Track[] }>(`/api/albums/${al.id}`);
              playTracks(res.tracks, 0);
            }}
          />
        ))}
      </HorizontalShelf>

      {/* Mood & Genre Playlists */}
      <HorizontalShelf title="Curated Discovery Playlists">
        {data.playlists.map((pl) => (
          <PlaylistCard
            key={pl.id}
            playlist={pl}
            onPlayPlaylist={async (p) => {
              const res = await api.get<{ tracks: Track[] }>(`/api/playlists/${p.id}`);
              playTracks(res.tracks, 0);
            }}
          />
        ))}
      </HorizontalShelf>

      {/* Recommended Artists */}
      <HorizontalShelf
        title="Recommended Artists"
        action={
          <button
            type="button"
            onClick={() => navigate('/artists/artist-1')}
            className="hidden"
          />
        }
      >
        {data.recommendedArtists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </HorizontalShelf>
    </div>
  );
}
