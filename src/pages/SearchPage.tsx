import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { AlbumCard, ArtistCard, PlaylistCard, TrackRow } from '../components/MediaCards';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';
import { Album, Artist, Genre, Playlist, Track } from '../types';

interface SearchResponse {
  query: string;
  songs: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  genres: Genre[];
  trendingSearches: string[];
  searchHistory: string[];
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [filter, setFilter] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { playTracks } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    api
      .get<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}&type=${filter}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, filter]);

  const triggerSearch = (term: string) => {
    setQuery(term);
    if (term.trim()) {
      setSearchParams({ q: term.trim() }, { replace: true });
      if (user) {
        api.post('/api/search/history', { query: term.trim() }).catch(() => {});
      }
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const clearHistory = async () => {
    await api.delete('/api/search/history').catch(() => {});
    setData((prev) => (prev ? { ...prev, searchHistory: [] } : prev));
  };

  const hasResults =
    data &&
    (data.songs.length > 0 || data.artists.length > 0 || data.albums.length > 0 || data.playlists.length > 0);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            triggerSearch(query);
          }}
          className="relative max-w-2xl"
        >
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => triggerSearch(e.target.value)}
            placeholder="Search by song title, artist, album, playlist, genre, or mood…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-white/[0.09] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
          />
        </form>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'songs', 'artists', 'albums', 'playlists'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                filter === tab
                  ? 'bg-[#FF3B5C] text-white'
                  : 'bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {!query.trim() && data && (
        <div className="space-y-8">
          {data.searchHistory.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Searches</h2>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear search history</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.searchHistory.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => triggerSearch(term)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-sm hover:border-[#FF3B5C]/60 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Trending Searches</h2>
            <div className="flex flex-wrap gap-2">
              {data.trendingSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => triggerSearch(term)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-sm hover:border-[#FF3B5C]/60 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Browse by Genre</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data.genres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => navigate(`/explore?genre=${encodeURIComponent(genre)}`)}
                  className="p-4 rounded-xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] hover:border-[#FF3B5C]/60 text-left font-semibold text-sm transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {query.trim() && !loading && data && !hasResults && (
        <div className="py-16 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2 px-4">
          <p className="text-base font-semibold">No results found for “{query}”</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Try searching for a different song title, artist name, genre, or mood.
          </p>
        </div>
      )}

      {query.trim() && data && hasResults && (
        <div className="space-y-8">
          {data.songs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Songs ({data.songs.length})</h2>
              <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
                {data.songs.map((track, idx) => (
                  <TrackRow key={track.id} track={track} index={idx} contextQueue={data.songs} />
                ))}
              </div>
            </section>
          )}

          {data.artists.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Artists ({data.artists.length})</h2>
              <div className="flex flex-wrap gap-4">
                {data.artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </section>
          )}

          {data.albums.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Albums ({data.albums.length})</h2>
              <div className="flex flex-wrap gap-4">
                {data.albums.map((album) => (
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

          {data.playlists.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Playlists ({data.playlists.length})</h2>
              <div className="flex flex-wrap gap-4">
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
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
