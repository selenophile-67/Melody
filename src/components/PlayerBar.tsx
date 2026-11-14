import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Heart,
  ListMusic,
  Maximize2,
  MessageSquareQuote,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EQUALIZER_PRESETS, usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../types';
import { Artwork } from './Artwork';
import { AudioVisualizer } from './AudioVisualizer';

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    eqPreset,
    eqBands,
    sleepTimerSeconds,
    sleepEndOfTrack,
    sidePanel,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    applyEqPreset,
    setEqBand,
    setSleepTimer,
    setSidePanel,
  } = usePlayer();

  const { user, toggleLikeTrack } = useAuth();
  const navigate = useNavigate();
  const [audioToolsOpen, setAudioToolsOpen] = useState<'none' | 'eq' | 'sleep'>('none');

  if (!currentTrack) return null;

  const isLiked = user?.likedSongs.includes(currentTrack.id) ?? false;
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 h-[72px] md:h-[84px] bg-white/95 dark:bg-[#0F0F13]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/[0.08] px-3 sm:px-5 flex items-center justify-between gap-4">
      {/* Top hairline scrubber on mobile */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full bg-[#FF3B5C]" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Left: Track Info */}
      <div className="flex items-center gap-3 min-w-0 w-1/2 md:w-[280px] lg:w-[320px]">
        <Link to="/now-playing" className="relative shrink-0 group">
          <Artwork src={currentTrack.artwork} alt={currentTrack.title} className="w-11 h-11 md:w-13 md:h-13" rounded="rounded-lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/now-playing"
            className="block text-sm font-semibold text-zinc-900 dark:text-white hover:underline truncate"
          >
            {currentTrack.title}
          </Link>
          <Link
            to={`/artist/${currentTrack.artistId}`}
            className="block text-xs text-zinc-500 dark:text-zinc-400 hover:underline truncate"
          >
            {currentTrack.artistName}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => toggleLikeTrack(currentTrack.id)}
          aria-label={isLiked ? 'Unlike song' : 'Like song'}
          className="hidden sm:inline-flex p-2 rounded-lg text-zinc-400 hover:text-[#FF3B5C] transition-colors shrink-0"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'text-[#FF3B5C] fill-[#FF3B5C]' : ''}`} />
        </button>
      </div>

      {/* Center: Playback Controls & Progress */}
      <div className="hidden md:flex flex-col items-center justify-center flex-1 max-w-xl gap-1.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="Toggle shuffle"
            className={`p-1.5 rounded-lg transition-colors ${
              shuffle ? 'text-[#FF3B5C]' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={prevTrack}
            aria-label="Previous track"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center hover:scale-105 transition-transform shadow-md"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={nextTrack}
            aria-label="Next track"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={`Repeat mode: ${repeat}`}
            className={`p-1.5 rounded-lg transition-colors ${
              repeat !== 'off' ? 'text-[#FF3B5C]' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full flex items-center gap-2.5">
          <span className="text-[11px] font-mono-tabular text-zinc-500 dark:text-zinc-400 w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center h-4 group">
            <div className="w-full h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full bg-[#FF3B5C] transition-[width] duration-75" style={{ width: `${progressPct}%` }} />
            </div>
            <input
              type="range"
              aria-label="Seek playback position"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="melody-range absolute inset-0 w-full opacity-0 group-hover:opacity-100"
            />
          </div>
          <span className="text-[11px] font-mono-tabular text-zinc-500 dark:text-zinc-400 w-10">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Mobile Compact Controls */}
      <div className="flex md:hidden items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => toggleLikeTrack(currentTrack.id)}
          aria-label="Like"
          className="p-2 text-zinc-400"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'text-[#FF3B5C] fill-[#FF3B5C]' : ''}`} />
        </button>
        <button
          type="button"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={nextTrack}
          aria-label="Next track"
          className="p-2 text-zinc-600 dark:text-zinc-300"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Right: Visualizer, EQ, Sleep Timer, Queue, Lyrics, Volume, Expand */}
      <div className="hidden md:flex items-center justify-end gap-1.5 w-[280px] lg:w-[320px] relative">
        <div className="hidden xl:flex items-center mr-1">
          <AudioVisualizer bars={12} height={22} />
        </div>

        {/* Equalizer Popover Trigger */}
        <button
          type="button"
          onClick={() => setAudioToolsOpen((prev) => (prev === 'eq' ? 'none' : 'eq'))}
          aria-label="Equalizer"
          title={`Equalizer (${eqPreset})`}
          className={`p-2 rounded-lg transition-colors ${
            audioToolsOpen === 'eq' || eqPreset !== 'Normal'
              ? 'text-[#FF3B5C] bg-[#FF3B5C]/10'
              : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Sleep Timer Popover Trigger */}
        <button
          type="button"
          onClick={() => setAudioToolsOpen((prev) => (prev === 'sleep' ? 'none' : 'sleep'))}
          aria-label="Sleep timer"
          title="Sleep timer"
          className={`p-2 rounded-lg transition-colors ${
            audioToolsOpen === 'sleep' || sleepTimerSeconds !== null || sleepEndOfTrack
              ? 'text-[#FF3B5C] bg-[#FF3B5C]/10'
              : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setSidePanel(sidePanel === 'lyrics' ? 'none' : 'lyrics')}
          aria-label="Toggle lyrics"
          title="Lyrics"
          className={`p-2 rounded-lg transition-colors ${
            sidePanel === 'lyrics'
              ? 'text-[#FF3B5C] bg-[#FF3B5C]/10'
              : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setSidePanel(sidePanel === 'queue' ? 'none' : 'queue')}
          aria-label="Toggle queue"
          title="Queue"
          className={`p-2 rounded-lg transition-colors ${
            sidePanel === 'queue'
              ? 'text-[#FF3B5C] bg-[#FF3B5C]/10'
              : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
        </button>

        <div className="hidden lg:flex items-center gap-1.5 ml-1">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="relative w-20 flex items-center h-4 group">
            <div className="w-full h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-zinc-700 dark:bg-zinc-200"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
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

        <button
          type="button"
          onClick={() => navigate('/now-playing')}
          aria-label="Open full-screen player"
          title="Full-screen player"
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Equalizer Popover */}
        {audioToolsOpen === 'eq' && (
          <div className="absolute bottom-16 right-0 w-72 rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Equalizer</span>
              <span className="text-xs text-[#FF3B5C] font-medium">{eqPreset}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {Object.keys(EQUALIZER_PRESETS).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyEqPreset(preset)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    eqPreset === preset
                      ? 'bg-[#FF3B5C] text-white border-[#FF3B5C]'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {['60Hz', '230Hz', '910Hz', '3.6k', '14k'].map((label, idx) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={eqBands[idx] || 0}
                    onChange={(e) => setEqBand(idx, Number(e.target.value))}
                    aria-label={`${label} band`}
                    className="w-16 accent-[#FF3B5C] -rotate-90 my-5 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono-tabular text-zinc-500">{eqBands[idx] > 0 ? `+${eqBands[idx]}` : eqBands[idx]}dB</span>
                  <span className="text-[10px] text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sleep Timer Popover */}
        {audioToolsOpen === 'sleep' && (
          <div className="absolute bottom-16 right-0 w-60 rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3 z-50 space-y-1.5">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-sm font-semibold">Sleep timer</span>
              {sleepTimerSeconds !== null && (
                <span className="text-xs font-mono-tabular text-[#FF3B5C]">
                  {formatDuration(sleepTimerSeconds)}
                </span>
              )}
            </div>
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setSleepTimer(mins);
                  setAudioToolsOpen('none');
                }}
                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {mins} minutes
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSleepTimer(null, true);
                setAudioToolsOpen('none');
              }}
              className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              End of current track
            </button>
            {(sleepTimerSeconds !== null || sleepEndOfTrack) && (
              <button
                type="button"
                onClick={() => {
                  setSleepTimer(null, false);
                  setAudioToolsOpen('none');
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-rose-500 rounded-lg hover:bg-rose-500/10"
              >
                Turn off timer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
