import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Pause, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { Album, Artist, Playlist, Track, formatCompactCount, formatDuration } from '../types';
import { Artwork } from './Artwork';
import { TrackMenu } from './TrackMenu';

export function TrackCard({ track, contextQueue }: { track: Track; contextQueue?: Track[] }) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
  const navigate = useNavigate();
  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, contextQueue);
    }
  };

  return (
    <div
      onClick={() => navigate(`/album/${track.albumId}`)}
      className="group relative flex flex-col w-44 sm:w-48 shrink-0 p-3 rounded-xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] hover:bg-zinc-50 dark:hover:bg-[#1A1A20] transition-colors cursor-pointer"
    >
      <div className="relative aspect-square w-full mb-3 overflow-hidden rounded-lg">
        <Artwork src={track.artwork} alt={track.title} className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]" />
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label={isCurrent && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#FF3B5C] text-white flex items-center justify-center shadow-lg transition-all duration-150 hover:scale-105 ${
            isCurrent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          {isCurrent && isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
      </div>

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold truncate ${isCurrent ? 'text-[#FF3B5C]' : 'text-zinc-900 dark:text-zinc-100'}`}>
            {track.title}
          </div>
          <Link
            to={`/artist/${track.artistId}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-xs text-zinc-500 dark:text-zinc-400 hover:underline truncate mt-0.5"
          >
            {track.artistName}
          </Link>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1.5 tabular-nums truncate">
            <span>{track.genre}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDuration(track.duration)}</span>
          </div>
        </div>
        <TrackMenu track={track} />
      </div>
    </div>
  );
}

export function TrackRow({
  track,
  index,
  contextQueue,
  extraMenuItems,
}: {
  track: Track;
  index: number;
  contextQueue?: Track[];
  extraMenuItems?: { label: string; onClick: () => void; danger?: boolean }[];
}) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
  const { user, toggleLikeTrack } = useAuth();
  const isCurrent = currentTrack?.id === track.id;
  const isLiked = user?.likedSongs.includes(track.id) ?? false;

  const handleRowPlay = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, contextQueue);
    }
  };

  return (
    <div
      onClick={handleRowPlay}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
        isCurrent
          ? 'bg-[#FF3B5C]/10 dark:bg-[#FF3B5C]/12'
          : 'hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
      }`}
    >
      <div className="w-7 text-center shrink-0">
        <span className={`text-xs tabular-nums group-hover:hidden ${isCurrent ? 'text-[#FF3B5C] font-semibold' : 'text-zinc-400'}`}>
          {index + 1}
        </span>
        <button
          type="button"
          aria-label={isCurrent && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className="hidden group-hover:inline-flex items-center justify-center text-zinc-900 dark:text-white"
        >
          {isCurrent && isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
      </div>

      <Artwork src={track.artwork} alt={track.title} className="w-10 h-10 shrink-0" rounded="rounded-md" />

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${isCurrent ? 'text-[#FF3B5C]' : 'text-zinc-900 dark:text-zinc-100'}`}>
          {track.title}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
          <Link
            to={`/artist/${track.artistId}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline truncate"
          >
            {track.artistName}
          </Link>
          <span aria-hidden="true">·</span>
          <span>{track.genre}</span>
        </div>
      </div>

      <Link
        to={`/album/${track.albumId}`}
        onClick={(e) => e.stopPropagation()}
        className="hidden md:block text-xs text-zinc-500 dark:text-zinc-400 hover:underline truncate max-w-[180px]"
      >
        {track.albumTitle}
      </Link>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => toggleLikeTrack(track.id)}
          aria-label={isLiked ? `Remove ${track.title} from Liked Songs` : `Like ${track.title}`}
          className="p-2 rounded-lg text-zinc-400 hover:text-[#FF3B5C] transition-colors"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'text-[#FF3B5C] fill-[#FF3B5C]' : ''}`} />
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono-tabular w-11 text-right">
          {formatDuration(track.duration)}
        </span>
        <TrackMenu track={track} extraItems={extraMenuItems} />
      </div>
    </div>
  );
}

export function AlbumCard({ album, onPlayAlbum }: { album: Album; onPlayAlbum?: (album: Album) => void }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/album/${album.id}`)}
      className="group flex flex-col w-44 sm:w-48 shrink-0 p-3 rounded-xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] hover:bg-zinc-50 dark:hover:bg-[#1A1A20] transition-colors cursor-pointer"
    >
      <div className="relative aspect-square w-full mb-3 overflow-hidden rounded-lg">
        <Artwork src={album.artwork} alt={album.title} className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]" />
        {onPlayAlbum && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayAlbum(album);
            }}
            aria-label={`Play album ${album.title}`}
            className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#FF3B5C] text-white flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        )}
      </div>
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{album.title}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{album.artistName}</div>
      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1.5 tabular-nums truncate">
        <span>{album.releaseDate.slice(0, 4)}</span>
        <span aria-hidden="true">·</span>
        <span>{album.genre}</span>
      </div>
    </div>
  );
}

export function PlaylistCard({
  playlist,
  onPlayPlaylist,
}: {
  playlist: Playlist;
  onPlayPlaylist?: (playlist: Playlist) => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      className="group flex flex-col w-44 sm:w-48 shrink-0 p-3 rounded-xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] hover:bg-zinc-50 dark:hover:bg-[#1A1A20] transition-colors cursor-pointer"
    >
      <div className="relative aspect-square w-full mb-3 overflow-hidden rounded-lg">
        <Artwork src={playlist.coverImage} alt={playlist.name} className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]" />
        {onPlayPlaylist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPlaylist(playlist);
            }}
            aria-label={`Play playlist ${playlist.name}`}
            className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#FF3B5C] text-white flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        )}
      </div>
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{playlist.name}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
        {playlist.description || `By ${playlist.ownerName}`}
      </div>
      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1.5 tabular-nums truncate">
        <span>{playlist.trackIds.length} songs</span>
        {playlist.mood && (
          <>
            <span aria-hidden="true">·</span>
            <span>{playlist.mood}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function ArtistCard({ artist }: { artist: Artist }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/artist/${artist.id}`)}
      className="group flex flex-col items-center text-center w-40 sm:w-44 shrink-0 p-3 rounded-xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] hover:bg-zinc-50 dark:hover:bg-[#1A1A20] transition-colors cursor-pointer"
    >
      <div className="relative w-32 h-32 mb-3 overflow-hidden rounded-full border border-zinc-200 dark:border-white/10">
        <Artwork
          src={artist.profileImage}
          alt={artist.name}
          rounded="rounded-full"
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate w-full">{artist.name}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center justify-center gap-1.5 tabular-nums">
        <span>{artist.genre}</span>
        <span aria-hidden="true">·</span>
        <span>{formatCompactCount(artist.monthlyListeners)}</span>
      </div>
    </div>
  );
}
