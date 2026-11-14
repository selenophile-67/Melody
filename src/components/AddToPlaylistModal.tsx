import React, { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Playlist } from '../types';
import { Artwork } from './Artwork';

export function AddToPlaylistModal() {
  const { playlistModalTrack, openPlaylistModal } = usePlayer();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!playlistModalTrack) return;
    setLoading(true);
    api
      .get<{ userPlaylists: Playlist[] }>('/api/playlists')
      .then((res) => setPlaylists(res.userPlaylists || []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false));
  }, [playlistModalTrack]);

  if (!playlistModalTrack) return null;

  const handleAdd = async (playlist: Playlist) => {
    try {
      const res = await api.post<{ playlist: Playlist }>(`/api/playlists/${playlist.id}/tracks`, {
        trackId: playlistModalTrack.id,
      });
      setPlaylists((prev) => prev.map((p) => (p.id === playlist.id ? res.playlist : p)));
      showToast(`Added "${playlistModalTrack.title}" to "${playlist.name}"`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    setCreating(true);
    try {
      const res = await api.post<{ playlist: Playlist }>('/api/playlists', {
        name: newName.trim(),
        coverImage: playlistModalTrack.artwork,
        trackIds: [playlistModalTrack.id],
      });
      setPlaylists((prev) => [res.playlist, ...prev]);
      setNewName('');
      await refreshUser();
      showToast(`Created "${res.playlist.name}" with track`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add to playlist"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => openPlaylistModal(null)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold">Add to playlist</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[280px]">
              {playlistModalTrack.title} · {playlistModalTrack.artistName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openPlaylistModal(null)}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-72 overflow-y-auto melody-scroll space-y-2">
          {!user ? (
            <p className="text-sm text-zinc-500 py-6 text-center">Sign in to create and save custom playlists.</p>
          ) : loading ? (
            <p className="text-sm text-zinc-500 py-6 text-center">Loading your playlists…</p>
          ) : playlists.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No custom playlists yet. Create one below.</p>
          ) : (
            playlists.map((pl) => {
              const alreadyIn = pl.trackIds.includes(playlistModalTrack.id);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => !alreadyIn && handleAdd(pl)}
                  disabled={alreadyIn}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left disabled:opacity-75"
                >
                  <Artwork src={pl.coverImage} alt={pl.name} className="w-11 h-11 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{pl.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {pl.trackIds.length} songs
                    </div>
                  </div>
                  {alreadyIn ? (
                    <span className="text-xs text-emerald-500 flex items-center gap-1 shrink-0">
                      <Check className="w-4 h-4" /> Added
                    </span>
                  ) : (
                    <Plus className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {user && (
          <form onSubmit={handleCreate} className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New playlist name…"
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/50"
            />
            <button
              type="submit"
              disabled={!newName.trim() || creating}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#FF3B5C] hover:bg-[#FF5270] text-white disabled:opacity-50 whitespace-nowrap shrink-0 transition-colors"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
