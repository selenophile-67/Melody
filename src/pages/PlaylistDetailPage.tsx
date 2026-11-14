import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Edit3,
  Play,
  Plus,
  Share2,
  Shuffle,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Artwork } from '../components/Artwork';
import { TrackRow } from '../components/MediaCards';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Playlist, Track, formatTotalDuration } from '../types';

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, toggleSavePlaylist, refreshUser } = useAuth();
  const { playTracks } = usePlayer();
  const { showToast } = useToast();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [addSongsOpen, setAddSongsOpen] = useState(false);
  const [catalogTracks, setCatalogTracks] = useState<Track[]>([]);
  const [songSearch, setSongSearch] = useState('');

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCover, setEditCover] = useState('');

  const loadPlaylist = () => {
    if (!id) return;
    setLoading(true);
    api
      .get<{ playlist: Playlist; tracks: Track[] }>(`/api/playlists/${id}`)
      .then((res) => {
        setPlaylist(res.playlist);
        setTracks(res.tracks);
        setEditName(res.playlist.name);
        setEditDesc(res.playlist.description);
        setEditCover(res.playlist.coverImage);
      })
      .catch(() => setPlaylist(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const isOwner = Boolean(user && playlist && !playlist.isCurated && playlist.ownerId === user.id);
  const isSaved = Boolean(user && playlist && user.savedPlaylists.includes(playlist.id));

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist) return;
    try {
      const res = await api.patch<{ playlist: Playlist }>(`/api/playlists/${playlist.id}`, {
        name: editName,
        description: editDesc,
        coverImage: editCover,
      });
      setPlaylist(res.playlist);
      setEditOpen(false);
      showToast('Playlist updated', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setEditCover(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    try {
      await api.delete(`/api/playlists/${playlist.id}`);
      await refreshUser();
      showToast('Playlist deleted', 'info');
      navigate('/playlists');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    try {
      await api.delete(`/api/playlists/${playlist.id}/tracks/${trackId}`);
      loadPlaylist();
      showToast('Removed track from playlist', 'info');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleMoveTrack = async (index: number, delta: -1 | 1) => {
    if (!playlist) return;
    const target = index + delta;
    if (target < 0 || target >= tracks.length) return;
    const nextTracks = [...tracks];
    const [moved] = nextTracks.splice(index, 1);
    nextTracks.splice(target, 0, moved);
    setTracks(nextTracks);
    try {
      await api.put(`/api/playlists/${playlist.id}/reorder`, {
        trackIds: nextTracks.map((t) => t.id),
      });
    } catch {
      loadPlaylist();
    }
  };

  const openAddSongs = async () => {
    setAddSongsOpen(true);
    if (catalogTracks.length === 0) {
      const res = await api.get<{ tracks: Track[] }>('/api/songs');
      setCatalogTracks(res.tracks || []);
    }
  };

  const handleAddTrack = async (trackId: string) => {
    if (!playlist) return;
    try {
      await api.post(`/api/playlists/${playlist.id}/tracks`, { trackId });
      loadPlaylist();
      showToast('Song added to playlist', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Playlist link copied', 'success');
    } catch {
      showToast('Copy URL from address bar to share', 'info');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-zinc-500">Loading playlist…</div>;
  }

  if (!playlist) {
    return <div className="py-16 text-center text-sm text-zinc-500">Playlist not found.</div>;
  }

  const totalSecs = tracks.reduce((acc, t) => acc + t.duration, 0);
  const filteredCatalog = catalogTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      t.artistName.toLowerCase().includes(songSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-6 p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
        <Artwork src={playlist.coverImage} alt={playlist.name} className="w-40 h-40 sm:w-48 sm:h-48 shrink-0 shadow-xl" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {playlist.isCurated ? 'Curated Playlist' : 'Custom Playlist'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">{playlist.description}</p>
          )}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-2 tabular-nums pt-1">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{playlist.ownerName}</span>
            <span aria-hidden="true">·</span>
            <span>{tracks.length} songs</span>
            <span aria-hidden="true">·</span>
            <span>{formatTotalDuration(totalSecs)}</span>
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={tracks.length === 0}
              onClick={() => playTracks(tracks, 0)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All</span>
            </button>
            <button
              type="button"
              disabled={tracks.length === 0}
              onClick={() => playTracks(tracks, 0, true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSavePlaylist(playlist.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                isSaved
                  ? 'border-[#FF3B5C] text-[#FF3B5C] bg-[#FF3B5C]/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={openAddSongs}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Songs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  aria-label="Edit playlist"
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDeletePlaylist}
                  aria-label="Delete playlist"
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Track List */}
      {tracks.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <p className="text-sm text-zinc-500">This playlist doesn’t have any songs yet.</p>
          {isOwner && (
            <button
              type="button"
              onClick={openAddSongs}
              className="px-4 py-2 rounded-xl bg-[#FF3B5C] text-white text-xs font-semibold"
            >
              Add Songs
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
          {tracks.map((track, idx) => (
            <div key={`${track.id}-${idx}`} className="flex items-center gap-1">
              <div className="flex-1 min-w-0">
                <TrackRow
                  track={track}
                  index={idx}
                  contextQueue={tracks}
                  extraMenuItems={
                    isOwner
                      ? [{ label: 'Remove from playlist', onClick: () => handleRemoveTrack(track.id), danger: true }]
                      : []
                  }
                />
              </div>
              {isOwner && (
                <div className="hidden sm:flex items-center gap-0.5 pr-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveTrack(idx, -1)}
                    aria-label="Move track up"
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-25"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === tracks.length - 1}
                    onClick={() => handleMoveTrack(idx, 1)}
                    aria-label="Move track down"
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-25"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setEditOpen(false)}
        >
          <form
            onSubmit={handleSaveEdit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Playlist</h2>
              <button type="button" onClick={() => setEditOpen(false)} className="p-1 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Artwork src={editCover} alt={editName} className="w-20 h-20 shrink-0" />
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Change cover</span>
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            </div>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm"
            />
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm text-zinc-500">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#FF3B5C] text-white text-sm font-semibold">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Songs Modal */}
      {addSongsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setAddSongsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Songs to {playlist.name}</h2>
              <button type="button" onClick={() => setAddSongsOpen(false)} className="p-1 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="search"
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder="Search catalog tracks…"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm"
            />
            <div className="flex-1 overflow-y-auto melody-scroll space-y-1">
              {filteredCatalog.map((t) => {
                const inPl = tracks.some((pt) => pt.id === t.id);
                return (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <Artwork src={t.artwork} alt={t.title} className="w-10 h-10 shrink-0" rounded="rounded" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-zinc-500 truncate">{t.artistName}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={inPl}
                      onClick={() => handleAddTrack(t.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40 shrink-0"
                    >
                      {inPl ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
