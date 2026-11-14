import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Play, Sparkles } from 'lucide-react';
import { AlbumCard, ArtistCard, PlaylistCard, TrackCard } from '../components/MediaCards';
import { HorizontalShelf } from '../components/HorizontalShelf';
import { Artwork } from '../components/Artwork';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';
import { Album, Artist, Mood, Playlist, Track } from '../types';

interface HomeResponse {
  featured: {
    playlist: Playlist;
    album: Album;
    artwork: string;
    headline: string;
    subtitle: string;
    description: string;
  };
  madeForYou: Track[];
  quickPicks: Track[];
  trendingNow: Track[];
  popularAlbums: Album[];
  newReleases: Album[];
  topArtists: Artist[];
  recommendedPlaylists: Playlist[];
  recentlyPlayed: Track[];
  dailyMix: Track[];
  moodMusic: {
    mood: Mood;
    availableMoods: Mood[];
    tracks: Track[];
  };
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
}

export function HomePage() {
  const { user } = useAuth();
  const { playTracks, startSmartRadio } = usePlayer();
  const navigate = useNavigate();

  const [data, setData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<Mood>('Focus');

  useEffect(() => {
    setLoading(true);
    api
      .get<HomeResponse>(`/api/home?mood=${encodeURIComponent(selectedMood)}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleMoodChange = async (mood: Mood) => {
    setSelectedMood(mood);
    try {
      const res = await api.get<HomeResponse>(`/api/home?mood=${encodeURIComponent(mood)}`);
      setData(res);
    } catch {
      // Ignore
    }
  };

  const handlePlayAlbum = async (album: Album) => {
    try {
      const res = await api.get<{ tracks: Track[] }>(`/api/albums/${album.id}`);
      playTracks(res.tracks, 0);
    } catch {
      navigate(`/album/${album.id}`);
    }
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    try {
      const res = await api.get<{ tracks: Track[] }>(`/api/playlists/${playlist.id}`);
      playTracks(res.tracks, 0);
    } catch {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-72 rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
        <div className="space-y-3">
          <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-900" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-48 h-60 rounded-xl bg-zinc-200 dark:bg-zinc-900 shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-zinc-500">
        Unable to load the home feed right now. Refresh to try again.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white text-balance">
            {getTimeGreeting()} {user ? user.username : ''}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Every Mood Has a Melody · Discover curated mixes, live radio, and lossless sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startSmartRadio('mood', selectedMood, selectedMood)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-opacity self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Start {selectedMood} Radio</span>
        </button>
      </div>

      {/* Featured Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/[0.08] min-h-[280px] sm:min-h-[320px] flex items-end">
        <Artwork
          src={data.featured.artwork}
          alt={data.featured.headline}
          loading="eager"
          rounded="rounded-none"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />
        <div className="relative z-10 p-6 sm:p-8 max-w-2xl space-y-3">
          <div className="text-xs font-medium text-zinc-300 flex items-center gap-2">
            <span>Featured Collection</span>
            <span aria-hidden="true">·</span>
            <span>{data.featured.playlist.trackIds.length} Tracks</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
            {data.featured.headline}
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed max-w-xl">
            {data.featured.description}
          </p>
          <div className="text-xs text-zinc-300">{data.featured.subtitle}</div>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handlePlayPlaylist(data.featured.playlist)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Now</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-sm font-medium border border-white/20 transition-colors whitespace-nowrap shrink-0"
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </button>
          </div>
        </div>
      </section>

      {/* 1. Made for You */}
      <HorizontalShelf title="Made for You" subtitle="Personalized from your listening habits and liked tracks">
        {data.madeForYou.map((track) => (
          <TrackCard key={track.id} track={track} contextQueue={data.madeForYou} />
        ))}
      </HorizontalShelf>

      {/* 2. Quick Picks */}
      <HorizontalShelf title="Quick Picks" subtitle="Jump straight into a track across genres">
        {data.quickPicks.map((track) => (
          <TrackCard key={track.id} track={track} contextQueue={data.quickPicks} />
        ))}
      </HorizontalShelf>

      {/* 3. Trending Now */}
      <HorizontalShelf title="Trending Now" subtitle="Most-streamed tracks across Melody this week">
        {data.trendingNow.map((track) => (
          <TrackCard key={track.id} track={track} contextQueue={data.trendingNow} />
        ))}
      </HorizontalShelf>

      {/* 4. Popular Albums */}
      <HorizontalShelf title="Popular Albums" subtitle="Full-length studio records ready to stream">
        {data.popularAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} onPlayAlbum={handlePlayAlbum} />
        ))}
      </HorizontalShelf>

      {/* 5. New Releases */}
      <HorizontalShelf title="New Releases" subtitle="Latest albums added to the catalog">
        {data.newReleases.map((album) => (
          <AlbumCard key={album.id} album={album} onPlayAlbum={handlePlayAlbum} />
        ))}
      </HorizontalShelf>

      {/* 6. Top Artists */}
      <HorizontalShelf title="Top Artists" subtitle="Follow creators to shape your recommendations">
        {data.topArtists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </HorizontalShelf>

      {/* 7. Recommended Playlists */}
      <HorizontalShelf title="Recommended Playlists" subtitle="Hand-sequenced editorial moods and sessions">
        {data.recommendedPlaylists.map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} onPlayPlaylist={handlePlayPlaylist} />
        ))}
      </HorizontalShelf>

      {/* 8. Recently Played */}
      <HorizontalShelf
        title="Recently Played"
        subtitle="Pick up right where you left off"
        action={
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="text-xs font-medium text-[#FF3B5C] hover:underline whitespace-nowrap"
          >
            View history
          </button>
        }
      >
        {data.recentlyPlayed.map((track) => (
          <TrackCard key={track.id} track={track} contextQueue={data.recentlyPlayed} />
        ))}
      </HorizontalShelf>

      {/* 9. Your Daily Mix */}
      <HorizontalShelf title="Your Daily Mix" subtitle="Blended favorites and fresh discoveries">
        {data.dailyMix.map((track) => (
          <TrackCard key={track.id} track={track} contextQueue={data.dailyMix} />
        ))}
      </HorizontalShelf>

      {/* 10. Mood-Based Music */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Mood-Based Music
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select a mood to dynamically filter tracks and launch a tailored mix
            </p>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {data.moodMusic.availableMoods.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => handleMoodChange(mood)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedMood === mood
                    ? 'bg-[#FF3B5C] text-white'
                    : 'bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 melody-scroll">
          {data.moodMusic.tracks.map((track) => (
            <TrackCard key={track.id} track={track} contextQueue={data.moodMusic.tracks} />
          ))}
        </div>
      </section>
    </div>
  );
}
