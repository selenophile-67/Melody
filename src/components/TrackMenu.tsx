import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Disc3,
  Download,
  Heart,
  ListEnd,
  ListPlus,
  MoreVertical,
  Play,
  Radio,
  Share2,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { Track } from '../types';

interface TrackMenuProps {
  track: Track;
  extraItems?: { label: string; onClick: () => void; danger?: boolean }[];
}

export function TrackMenu({ track, extraItems = [] }: TrackMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { user, toggleLikeTrack } = useAuth();
  const {
    playNextInQueue,
    addToQueue,
    openPlaylistModal,
    startSmartRadio,
    downloadTrackOffline,
    removeOfflineDownload,
    downloadedTracks,
  } = usePlayer();
  const { showToast } = useToast();

  const isLiked = user?.likedSongs.includes(track.id) ?? false;
  const isDownloaded = downloadedTracks.some((t) => t.id === track.id);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/album/${track.albumId}?track=${track.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Track link copied to clipboard', 'success');
    } catch {
      showToast('Link ready to share: ' + track.title, 'info');
    }
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`More options for ${track.title}`}
        className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-white/10 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1.5 z-40 text-sm text-zinc-800 dark:text-zinc-200"
        >
          <button
            type="button"
            onClick={() => {
              playNextInQueue(track);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            <Play className="w-4 h-4 text-zinc-400" />
            <span>Play next</span>
          </button>
          <button
            type="button"
            onClick={() => {
              addToQueue(track);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            <ListEnd className="w-4 h-4 text-zinc-400" />
            <span>Add to queue</span>
          </button>
          <button
            type="button"
            onClick={() => {
              openPlaylistModal(track);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            <ListPlus className="w-4 h-4 text-zinc-400" />
            <span>Add to playlist</span>
          </button>
          <button
            type="button"
            onClick={() => {
              toggleLikeTrack(track.id);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'text-[#FF3B5C] fill-[#FF3B5C]' : 'text-zinc-400'}`} />
            <span>{isLiked ? 'Remove from Liked' : 'Save to Liked Songs'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              startSmartRadio('song', track.id, track.title);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            <Radio className="w-4 h-4 text-zinc-400" />
            <span>Start Smart Radio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isDownloaded) {
                removeOfflineDownload(track.id);
              } else {
                downloadTrackOffline(track);
              }
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            {isDownloaded ? <Check className="w-4 h-4 text-emerald-500" /> : <Download className="w-4 h-4 text-zinc-400" />}
            <span>{isDownloaded ? 'Remove offline copy' : 'Download offline'}</span>
          </button>
          <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
          <button
            type="button"
            onClick={() => {
              navigate(`/artist/${track.artistId}`);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            <User className="w-4 h-4 text-zinc-400" />
            <span>Go to artist</span>
          </button>
          <button
            type="button"
            onClick={() => {
              navigate(`/album/${track.albumId}`);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            <Disc3 className="w-4 h-4 text-zinc-400" />
            <span>Go to album</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap"
          >
            <Share2 className="w-4 h-4 text-zinc-400" />
            <span>Share song link</span>
          </button>
          {extraItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left whitespace-nowrap ${
                item.danger ? 'text-rose-500' : ''
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
