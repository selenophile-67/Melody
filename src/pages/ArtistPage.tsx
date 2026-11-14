import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Radio, UserCheck, UserPlus } from 'lucide-react';
import { Artwork } from '../components/Artwork';
import { HorizontalShelf } from '../components/HorizontalShelf';
import { AlbumCard, ArtistCard, TrackRow } from '../components/MediaCards';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';
import { Album, Artist, Track, formatCompactCount } from '../types';

interface ArtistResponse {
  artist: Artist;
  songs: Track[];
  albums: Album[];
  relatedArtists: Artist[];
}

export function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { user, toggleFollowArtist } = useAuth();
  const { playTracks, startSmartRadio } = usePlayer();
  const [data, setData] = useState<ArtistResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<ArtistResponse>(`/api/artists/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-12 text-center text-sm text-zinc-500">Loading artist…</div>;
  if (!data) return <div className="py-16 text-center text-sm text-zinc-500">Artist not found.</div>;

  const { artist, songs, albums, relatedArtists } = data;
  const isFollowing = user?.followedArtists.includes(artist.id) ?? false;

  return (
    <div className="space-y-10">
      {/* Artist Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-6 p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
        <Artwork
          src={artist.profileImage}
          alt={artist.name}
          rounded="rounded-full"
          className="w-36 h-36 sm:w-44 sm:h-44 shrink-0 border border-zinc-200 dark:border-white/10 shadow-xl"
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2 tabular-nums">
            <span>{artist.genre}</span>
            <span aria-hidden="true">·</span>
            <span>{artist.region}</span>
            {artist.monthlyListeners > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatCompactCount(artist.monthlyListeners)} monthly listeners</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{artist.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">{artist.biography}</p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={songs.length === 0}
              onClick={() => playTracks(songs, 0)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Popular</span>
            </button>
            <button
              type="button"
              onClick={() => toggleFollowArtist(artist.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                isFollowing
                  ? 'border-[#FF3B5C] text-[#FF3B5C] bg-[#FF3B5C]/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
            <button
              type="button"
              onClick={() => startSmartRadio('artist', artist.id, artist.name)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium"
            >
              <Radio className="w-4 h-4 text-[#FF3B5C]" />
              <span>Artist Radio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Popular Songs */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Popular Songs</h2>
        <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
          {songs.map((track, idx) => (
            <TrackRow key={track.id} track={track} index={idx} contextQueue={songs} />
          ))}
        </div>
      </section>

      {/* Albums */}
      {albums.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Albums & Releases</h2>
          <div className="flex flex-wrap gap-4">
            {albums.map((album) => (
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

      {/* Related Artists */}
      {relatedArtists.length > 0 && (
        <HorizontalShelf title="Fans Also Listen To">
          {relatedArtists.map((rel) => (
            <ArtistCard key={rel.id} artist={rel} />
          ))}
        </HorizontalShelf>
      )}
    </div>
  );
}
