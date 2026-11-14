import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Upload, X } from 'lucide-react';
import { PlaylistCard } from '../components/MediaCards';
import { Artwork } from '../components/Artwork';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Playlist, Track } from '../types';

const PRESET_COVERS = [
  '/src/assets/images/cover_neon_pulse_1794653959233.jpg',
  '/src/assets/images/cover_velvet_lofi_1794653960104.jpg',
  '/src/assets/images/cover_acoustic_horizon_1794653960369.jpg',
  '/src/assets/images/cover_golden_raga_1794653961531.jpg',
  '/src/assets/images/cover_urban_echo_1794653961582.jpg',
  '/src/assets/images/cover_symphony_noir_1794653961569.jpg',
];

export function PlaylistsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [curated, setCurated] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(searchParams.get('create') === '1');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0]);
  const [submitting, setSubmitting] = useState(false);

  const { user, refreshUser } = useAuth();
  const { playTracks } = usePlayer();
  const { showToast } = useToast();

  const fetchPlaylists = () => {
    setLoading(true);
    api
      .get<{ userPlaylists: Playlist[]; curated: Playlist[] }>('/api/playlists')
      .then((res) => {
        setUserPlaylists(res.userPlaylists || []);
        setCurated(res.curated || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user?.id]);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      showToast('Please select an image smaller than 1.5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!user) {
      showToast('Sign in or enable Demo mode to create playlists', 'info');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/playlists', {
        name: name.trim(),
        description: description.trim(),
        coverImage,
      });
      setName('');
      setDescription('');
      setCreateOpen(false);
      setSearchParams({}, { replace: true });
      await refreshUser();
      fetchPlaylists();
      showToast('Playlist created', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayPlaylist = async (pl: Playlist) => {
    const res = await api.get<{ tracks: Track[] }>(`/api/playlists/${pl.id}`);
    playTracks(res.tracks, 0);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Playlists</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Create custom collections, upload cover artwork, and explore editorial playlists.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold self-start whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your Playlists</h2>
        {loading ? (
          <div className="text-sm text-zinc-500">Loading playlists…</div>
        ) : userPlaylists.length === 0 ? (
          <div className="py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
            <p className="text-sm text-zinc-500">You haven’t created any custom playlists yet.</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold"
            >
              Create your first playlist
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {userPlaylists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} onPlayPlaylist={handlePlayPlaylist} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Curated by Melody</h2>
        <div className="flex flex-wrap gap-4">
          {curated.map((pl) => (
            <PlaylistCard key={pl.id} playlist={pl} onPlayPlaylist={handlePlayPlaylist} />
          ))}
        </div>
      </section>

      {createOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create playlist"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setCreateOpen(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Playlist</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Artwork src={coverImage} alt="Playlist cover preview" className="w-24 h-24 shrink-0" />
              <div className="space-y-2 flex-1">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload custom cover</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COVERS.map((img, i) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setCoverImage(img)}
                      aria-label={`Select cover preset ${i + 1}`}
                      className={`w-8 h-8 rounded-md overflow-hidden border-2 ${
                        coverImage === img ? 'border-[#FF3B5C]' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pl-name" className="text-xs font-medium text-zinc-500">
                Playlist name
              </label>
              <input
                id="pl-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Late Night Focus"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pl-desc" className="text-xs font-medium text-zinc-500">
                Description
              </label>
              <textarea
                id="pl-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a short description for this playlist…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B5C]/40"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className="px-5 py-2 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Playlist'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
