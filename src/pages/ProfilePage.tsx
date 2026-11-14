import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Upload } from 'lucide-react';
import { Artwork } from '../components/Artwork';
import { PlaylistCard, TrackRow } from '../components/MediaCards';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Playlist, Track, formatTotalDuration } from '../types';

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { playTracks } = usePlayer();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.profilePicture || '');
  const [saving, setSaving] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setAvatar(user.profilePicture);

    api
      .get<{ likedTracks: Track[]; playlists: Playlist[] }>('/api/library')
      .then((res) => {
        setLikedTracks(res.likedTracks || []);
        setPlaylists(res.playlists || []);
      })
      .catch(() => {});

    api
      .get<{ totalListeningSeconds: number; totalPlays: number }>('/api/history')
      .then((res) => {
        setTotalSeconds(res.totalListeningSeconds || 0);
        setTotalPlays(res.totalPlays || 0);
      })
      .catch(() => {});
  }, [user?.id]);

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-zinc-500">Sign in to view and manage your Melody profile.</p>
        <Link to="/login" className="inline-block px-5 py-2.5 rounded-xl bg-[#FF3B5C] text-white text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      showToast('Please choose an avatar image under 1.5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 2) {
      showToast('Username must be at least 2 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ username: username.trim(), profilePicture: avatar });
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <form onSubmit={handleSave} className="flex flex-col sm:flex-row sm:items-center gap-5 flex-1">
          <div className="relative shrink-0 self-start">
            <Artwork src={avatar} alt={user.username} rounded="rounded-full" className="w-24 h-24 border border-zinc-200 dark:border-white/10" />
            <label
              aria-label="Upload profile picture"
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#FF3B5C] text-white shadow-lg cursor-pointer hover:bg-[#FF5270]"
            >
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-3 flex-1 max-w-md">
            <div className="text-xs text-zinc-500">
              {user.email} · {user.authProvider === 'demo' ? 'Demo Account' : 'Verified Member'}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-label="Edit username"
                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-rose-500 hover:bg-rose-500/10 self-start md:self-center"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>

      {/* Listening Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
          <div className="text-xs text-zinc-500">Total Time Streamed</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{formatTotalDuration(totalSeconds)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
          <div className="text-xs text-zinc-500">Total Plays</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{totalPlays}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
          <div className="text-xs text-zinc-500">Liked Songs</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{user.likedSongs.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07]">
          <div className="text-xs text-zinc-500">Followed Artists</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{user.followedArtists.length}</div>
        </div>
      </div>

      {/* Favorite Songs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Favorite Songs</h2>
          <Link to="/liked" className="text-xs font-medium text-[#FF3B5C] hover:underline">
            View all
          </Link>
        </div>
        {likedTracks.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
            No favorite songs yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] p-2 divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {likedTracks.slice(0, 6).map((track, idx) => (
              <TrackRow key={track.id} track={track} index={idx} contextQueue={likedTracks} />
            ))}
          </div>
        )}
      </section>

      {/* Playlists */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Saved & Created Playlists</h2>
          <Link to="/playlists" className="text-xs font-medium text-[#FF3B5C] hover:underline">
            Manage playlists
          </Link>
        </div>
        <div className="flex flex-wrap gap-4">
          {playlists.map((pl) => (
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
    </div>
  );
}
