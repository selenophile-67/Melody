import React from 'react';
import { ArrowDown, ArrowUp, Play, Trash2, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../types';
import { Artwork } from './Artwork';
import { LyricsView } from './LyricsView';

export function QueuePanel() {
  const {
    queue,
    currentIndex,
    currentTrack,
    sidePanel,
    setSidePanel,
    playTrack,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  } = usePlayer();

  if (sidePanel === 'none') return null;

  return (
    <aside
      aria-label={sidePanel === 'queue' ? 'Playback queue' : 'Song lyrics'}
      className="fixed right-0 top-16 bottom-[84px] w-full sm:w-96 z-30 bg-white dark:bg-[#111114] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setSidePanel('queue')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              sidePanel === 'queue'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Queue ({queue.length})
          </button>
          <button
            type="button"
            onClick={() => setSidePanel('lyrics')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              sidePanel === 'lyrics'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Lyrics
          </button>
        </div>

        <div className="flex items-center gap-1">
          {sidePanel === 'queue' && queue.length > 1 && (
            <button
              type="button"
              onClick={clearQueue}
              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-rose-500 transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setSidePanel('none')}
            aria-label="Close panel"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto melody-scroll p-4">
        {sidePanel === 'lyrics' ? (
          <LyricsView compact />
        ) : (
          <div className="space-y-4">
            {currentTrack && (
              <div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Now Playing</div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FF3B5C]/10 border border-[#FF3B5C]/25">
                  <Artwork src={currentTrack.artwork} alt={currentTrack.title} className="w-11 h-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#FF3B5C] truncate">{currentTrack.title}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{currentTrack.artistName}</div>
                  </div>
                  <span className="text-xs font-mono-tabular text-zinc-500">{formatDuration(currentTrack.duration)}</span>
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Up Next ({Math.max(0, queue.length - currentIndex - 1)})
              </div>
              {queue.length === 0 ? (
                <p className="text-sm text-zinc-500 py-8 text-center">Queue is empty.</p>
              ) : (
                <div className="space-y-1">
                  {queue.map((track, idx) => {
                    const isCurrent = idx === currentIndex;
                    return (
                      <div
                        key={`${track.id}-${idx}`}
                        className={`group flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                          isCurrent ? 'opacity-50' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => playTrack(track, queue)}
                          aria-label={`Play ${track.title}`}
                          className="relative w-9 h-9 shrink-0 rounded overflow-hidden"
                        >
                          <Artwork src={track.artwork} alt={track.title} className="w-full h-full" rounded="rounded" />
                          <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </span>
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate text-zinc-900 dark:text-zinc-100">{track.title}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{track.artistName}</div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => reorderQueue(idx, idx - 1)}
                            aria-label="Move up"
                            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-25"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === queue.length - 1}
                            onClick={() => reorderQueue(idx, idx + 1)}
                            aria-label="Move down"
                            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-25"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromQueue(idx)}
                            aria-label={`Remove ${track.title} from queue`}
                            className="p-1 text-zinc-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
