import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  ListMusic,
  ListPlus,
  MessageSquareQuote,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Artwork } from '../components/Artwork';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { LyricsView } from '../components/LyricsView';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { formatDuration } from '../types';

export function NowPlayingPage() {
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    playTrack,
    openPlaylistModal,
    startSmartRadio,
  } = usePlayer();
  const { user, toggleLikeTrack } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [rightTab, setRightTab] = useState<'lyrics' | 'queue'>('lyrics');

  if (!currentTrack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-lg font-semibold">No track selected</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-[#FF3B5C] text-white text-sm font-semibold"
        >
          Browse Music
        </button>
      </div>
    );
  }

  const isLiked = user?.likedSongs.includes(currentTrack.id) ?? false;
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/album/${currentTrack.albumId}`);
      showToast('Song link copied to clipboard', 'success');
    } catch {
      showToast('Share link ready', 'info');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#09090B] text-white overflow-hidden flex flex-col">
      {/* Ambient artwork backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={currentTrack.artwork}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover scale-125 blur-3xl opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090B]/70 via-[#09090B]/85 to-[#09090B]" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-16">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium whitespace-nowrap"
        >
          <ChevronDown className="w-4 h-4" />
          <span>Minimize</span>
        </button>
        <div className="text-xs text-zinc-300 truncate max-w-xs">
          Playing from <Link to={`/album/${currentTrack.albumId}`} className="underline hover:text-white">{currentTrack.albumTitle}</Link>
        </div>
        <button
          type="button"
          onClick={() => startSmartRadio('song', currentTrack.id, currentTrack.title)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium whitespace-nowrap"
        >
          <Radio className="w-3.5 h-3.5 text-[#FF3B5C]" />
          <span>Smart Radio</span>
        </button>
      </div>

      {/* Main Split Viewport */}
      <div className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Artwork + Controls */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start space-y-6">
          <div className="w-full max-w-[380px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <Artwork src={currentTrack.artwork} alt={currentTrack.title} loading="eager" className="w-full h-full" />
          </div>

          <div className="w-full max-w-[380px] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{currentTrack.title}</h1>
                <div className="text-sm text-zinc-300 mt-0.5 flex items-center gap-2 truncate">
                  <Link to={`/artist/${currentTrack.artistId}`} className="hover:underline truncate">
                    {currentTrack.artistName}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link to={`/album/${currentTrack.albumId}`} className="text-zinc-400 hover:underline truncate">
                    {currentTrack.albumTitle}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleLikeTrack(currentTrack.id)}
                  aria-label="Like song"
                  className="p-2 rounded-lg hover:bg-white/10"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'text-[#FF3B5C] fill-[#FF3B5C]' : 'text-zinc-300'}`} />
                </button>
                <button
                  type="button"
                  onClick={() => openPlaylistModal(currentTrack)}
                  aria-label="Add to playlist"
                  className="p-2 rounded-lg hover:bg-white/10 text-zinc-300"
                >
                  <ListPlus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share song"
                  className="p-2 rounded-lg hover:bg-white/10 text-zinc-300"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Visualizer */}
            <div className="flex justify-center lg:justify-start py-1">
              <AudioVisualizer bars={36} height={32} className="w-full max-w-[380px]" />
            </div>

            {/* Scrubber */}
            <div className="space-y-1.5">
              <div className="relative flex items-center h-4 group">
                <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full bg-[#FF3B5C]" style={{ width: `${progressPct}%` }} />
                </div>
                <input
                  type="range"
                  aria-label="Seek"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="melody-range absolute inset-0 w-full opacity-0 group-hover:opacity-100"
                />
              </div>
              <div className="flex justify-between text-xs font-mono-tabular text-zinc-400">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleShuffle}
                aria-label="Shuffle"
                className={`p-2 rounded-lg ${shuffle ? 'text-[#FF3B5C]' : 'text-zinc-400 hover:text-white'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={prevTrack}
                aria-label="Previous"
                className="p-2 text-zinc-200 hover:text-white"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-14 h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={nextTrack}
                aria-label="Next"
                className="p-2 text-zinc-200 hover:text-white"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={cycleRepeat}
                aria-label="Repeat"
                className={`p-2 rounded-lg ${repeat !== 'off' ? 'text-[#FF3B5C]' : 'text-zinc-400 hover:text-white'}`}
              >
                {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={toggleMute} aria-label="Mute" className="text-zinc-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="relative flex-1 flex items-center h-4 group">
                <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                </div>
                <input
                  type="range"
                  aria-label="Volume"
                  min={0}
                  max={1}
                  step={0.02}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="melody-range absolute inset-0 w-full opacity-0 group-hover:opacity-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lyrics / Queue Switcher */}
        <div className="lg:col-span-6 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 p-5 h-[460px] flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setRightTab('lyrics')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                rightTab === 'lyrics' ? 'bg-white text-zinc-950' : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Lyrics</span>
            </button>
            <button
              type="button"
              onClick={() => setRightTab('queue')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                rightTab === 'queue' ? 'bg-white text-zinc-950' : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Up Next ({queue.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto melody-scroll pr-1">
            {rightTab === 'lyrics' ? (
              <LyricsView />
            ) : (
              <div className="space-y-1.5">
                {queue.map((t, idx) => (
                  <button
                    key={`${t.id}-${idx}`}
                    type="button"
                    onClick={() => playTrack(t, queue)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      idx === currentIndex ? 'bg-[#FF3B5C]/20 text-white' : 'hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <Artwork src={t.artwork} alt={t.title} className="w-10 h-10 shrink-0" rounded="rounded" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-zinc-400 truncate">{t.artistName}</div>
                    </div>
                    <span className="text-xs font-mono-tabular text-zinc-400">{formatDuration(t.duration)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
