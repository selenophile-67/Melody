import React, { useEffect, useRef } from 'react';
import { Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../types';

export function LyricsView({ compact = false }: { compact?: boolean }) {
  const { currentTrack, currentTime, seekTo } = usePlayer();
  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  const syncedLines = currentTrack?.lyricsType === 'synced' ? currentTrack.syncedLyrics || [] : [];
  let activeIndex = -1;
  for (let i = 0; i < syncedLines.length; i++) {
    if (currentTime >= syncedLines[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 dark:text-zinc-400 px-4">
        <Music2 className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Play a track to view lyrics.</p>
      </div>
    );
  }

  if (currentTrack.lyricsType === 'instrumental') {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center px-6 space-y-2">
        <Music2 className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Instrumental Composition</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
          “{currentTrack.title}” is an instrumental arrangement with no spoken lyrics.
        </p>
      </div>
    );
  }

  if (currentTrack.lyricsType === 'static') {
    return (
      <div className="space-y-4 py-2">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          Static lyrics · Time synchronization unavailable for this track
        </div>
        <div className={`space-y-3 ${compact ? 'text-base' : 'text-lg md:text-xl'} leading-relaxed text-zinc-700 dark:text-zinc-200`}>
          {(currentTrack.staticLyrics || []).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <div className="text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        Synchronized lyrics · Click any line to jump
      </div>
      <div className="space-y-2">
        {syncedLines.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;
          return (
            <button
              key={`${line.time}-${idx}`}
              ref={isActive ? activeLineRef : null}
              type="button"
              onClick={() => seekTo(line.time)}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-baseline gap-3 ${
                isActive
                  ? 'bg-[#FF3B5C]/12 text-zinc-900 dark:text-white font-semibold scale-[1.01]'
                  : isPast
                  ? 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <span className="text-[11px] font-mono-tabular text-zinc-400 shrink-0">
                {formatDuration(line.time)}
              </span>
              <span className={compact ? 'text-sm leading-snug' : 'text-lg md:text-xl leading-snug'}>
                {line.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
