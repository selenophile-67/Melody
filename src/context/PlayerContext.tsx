import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, getStoredToken } from '../lib/api';
import { Track } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export type RepeatMode = 'off' | 'all' | 'one';
export type SidePanelMode = 'none' | 'queue' | 'lyrics';

export const EQUALIZER_PRESETS: Record<string, number[]> = {
  Normal: [0, 0, 0, 0, 0],
  'Bass Boost': [6, 4, 0, 0, 0],
  'Treble Boost': [0, 0, 1, 4, 6],
  Pop: [2, 4, 1, 3, 4],
  Rock: [5, 2, -1, 3, 5],
  Classical: [3, 1, 0, 2, 4],
};

const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];
const PLAYER_STORAGE_KEY = 'melody_player_state_v1';
const DOWNLOADS_STORAGE_KEY = 'melody_offline_downloads_v1';
const OFFLINE_CACHE_NAME = 'melody-offline-v1';

interface PlayerContextValue {
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  autoplay: boolean;
  crossfadeSeconds: number;
  eqPreset: string;
  eqBands: number[];
  sleepTimerSeconds: number | null;
  sleepEndOfTrack: boolean;
  sidePanel: SidePanelMode;
  playlistModalTrack: Track | null;
  downloadedTracks: Track[];
  downloadingIds: string[];
  playTrack: (track: Track, contextQueue?: Track[]) => void;
  playTracks: (tracks: Track[], startIndex?: number, shuffled?: boolean) => void;
  togglePlayPause: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setAutoplay: (val: boolean) => void;
  setCrossfadeSeconds: (secs: number) => void;
  applyEqPreset: (preset: string) => void;
  setEqBand: (index: number, gainDb: number) => void;
  setSleepTimer: (minutes: number | null, endOfTrack?: boolean) => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setSidePanel: (mode: SidePanelMode) => void;
  openPlaylistModal: (track: Track | null) => void;
  startSmartRadio: (seedType: 'song' | 'artist' | 'genre' | 'mood', seedId: string, label?: string) => Promise<void>;
  downloadTrackOffline: (track: Track) => Promise<void>;
  removeOfflineDownload: (trackId: string) => Promise<void>;
  clearOfflineCache: () => Promise<void>;
  getFrequencyData: (target: Uint8Array) => boolean;
  externalSyncSeekAndPlay: (track: Track, positionSeconds: number, shouldPlay: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user, updatePreferences } = useAuth();
  const { showToast } = useToast();

  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [autoplay, setAutoplayState] = useState(true);
  const [crossfadeSeconds, setCrossfadeState] = useState(2);
  const [eqPreset, setEqPreset] = useState('Normal');
  const [eqBands, setEqBands] = useState<number[]>([0, 0, 0, 0, 0]);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);
  const [sleepEndOfTrack, setSleepEndOfTrack] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanelMode>('none');
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>(() => {
    try {
      const raw = localStorage.getItem(DOWNLOADS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Track[]) : [];
    } catch {
      return [];
    }
  });
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceAttachedRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const loggedTrackPlayRef = useRef<string | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Sync user preferences on login
  useEffect(() => {
    if (user?.preferences) {
      setAutoplayState(user.preferences.autoplay);
      setCrossfadeState(user.preferences.crossfadeSeconds ?? 2);
      setEqPreset(user.preferences.equalizerPreset || 'Normal');
      if (Array.isArray(user.preferences.equalizerBands) && user.preferences.equalizerBands.length === 5) {
        setEqBands(user.preferences.equalizerBands);
      }
    }
  }, [user?.id]);

  // Restore saved queue & position on mount (without auto-playing)
  useEffect(() => {
    const restore = async () => {
      try {
        const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { queue?: Track[]; currentIndex?: number; currentTime?: number };
          if (Array.isArray(parsed.queue) && parsed.queue.length > 0) {
            setQueue(parsed.queue);
            const idx = Math.min(Math.max(0, parsed.currentIndex ?? 0), parsed.queue.length - 1);
            setCurrentIndex(idx);
            if (typeof parsed.currentTime === 'number' && parsed.currentTime > 0) {
              pendingSeekRef.current = parsed.currentTime;
              setCurrentTime(parsed.currentTime);
            }
            return;
          }
        }
        // Fallback: load initial track list cleanly so player bar is populated immediately
        const res = await api.get<{ tracks: Track[] }>('/api/songs');
        if (res.tracks.length > 0) {
          setQueue(res.tracks.slice(0, 6));
          setCurrentIndex(0);
        }
      } catch {
        // Ignore restore failure
      }
    };
    restore();
  }, []);

  // Persist player state periodically
  useEffect(() => {
    if (queue.length === 0 || currentIndex < 0) return;
    try {
      localStorage.setItem(
        PLAYER_STORAGE_KEY,
        JSON.stringify({
          queue: queue.slice(0, 40),
          currentIndex,
          currentTime,
        })
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [queue, currentIndex, Math.floor(currentTime / 3)]);

  // Initialize Web Audio pipeline lazily on user gesture
  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      audioCtxRef.current = new Ctx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!sourceAttachedRef.current) {
      try {
        const src = ctx.createMediaElementSource(audio);
        const filters = EQ_FREQUENCIES.map((freq, idx) => {
          const filter = ctx.createBiquadFilter();
          filter.type = idx === 0 ? 'lowshelf' : idx === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1.1;
          filter.gain.value = eqBands[idx] || 0;
          return filter;
        });

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;

        const gainNode = ctx.createGain();
        gainNode.gain.value = isMuted ? 0 : volume;

        let node: AudioNode = src;
        for (const f of filters) {
          node.connect(f);
          node = f;
        }
        node.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(ctx.destination);

        filtersRef.current = filters;
        analyserRef.current = analyser;
        gainNodeRef.current = gainNode;
        sourceAttachedRef.current = true;
      } catch {
        // If MediaElementSource fails, native audio playback still functions normally
      }
    }
  }, [eqBands, isMuted, volume]);

  // Keep EQ gains synced
  useEffect(() => {
    filtersRef.current.forEach((filter, idx) => {
      filter.gain.value = eqBands[idx] || 0;
    });
  }, [eqBands]);

  // Keep volume synced
  useEffect(() => {
    const effective = isMuted ? 0 : volume;
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(effective, audioCtxRef.current.currentTime, 0.03);
    }
    if (audioRef.current) {
      audioRef.current.volume = sourceAttachedRef.current ? 1 : effective;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const loadAudioSourceForTrack = useCallback(async (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    let resolvedSrc = track.audioUrl;
    if ('caches' in window) {
      try {
        const cache = await caches.open(OFFLINE_CACHE_NAME);
        const cached = await cache.match(track.audioUrl);
        if (cached) {
          const blob = await cached.blob();
          const blobUrl = URL.createObjectURL(blob);
          activeBlobUrlRef.current = blobUrl;
          resolvedSrc = blobUrl;
        }
      } catch {
        // Fallback to network stream
      }
    }

    if (audio.src !== new URL(resolvedSrc, window.location.href).href) {
      audio.src = resolvedSrc;
      audio.load();
    }
  }, []);

  // Load new track when currentTrack changes
  const prevTrackIdRef = useRef<string | null>(null);
  const autoPlayNextLoadRef = useRef(false);

  useEffect(() => {
    if (!currentTrack) return;
    if (prevTrackIdRef.current === currentTrack.id) return;
    prevTrackIdRef.current = currentTrack.id;
    loggedTrackPlayRef.current = null;

    setDuration(currentTrack.duration);
    if (pendingSeekRef.current === null) {
      setCurrentTime(0);
    }

    loadAudioSourceForTrack(currentTrack).then(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (pendingSeekRef.current !== null) {
        audio.currentTime = Math.min(pendingSeekRef.current, currentTrack.duration);
        pendingSeekRef.current = null;
      }
      if (autoPlayNextLoadRef.current) {
        autoPlayNextLoadRef.current = false;
        ensureAudioGraph();
        if (crossfadeSeconds > 0 && gainNodeRef.current && audioCtxRef.current) {
          const targetVol = isMuted ? 0 : volume;
          const now = audioCtxRef.current.currentTime;
          gainNodeRef.current.gain.setValueAtTime(0.02, now);
          gainNodeRef.current.gain.linearRampToValueAtTime(targetVol, now + Math.min(crossfadeSeconds, 4));
        }
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    });
  }, [currentTrack?.id, loadAudioSourceForTrack, ensureAudioGraph, crossfadeSeconds, isMuted, volume]);

  // Log play history once playback passes 5s
  useEffect(() => {
    if (!currentTrack || !isPlaying || currentTime < 5) return;
    if (loggedTrackPlayRef.current === currentTrack.id) return;
    loggedTrackPlayRef.current = currentTrack.id;
    if (getStoredToken()) {
      api.post('/api/history', { trackId: currentTrack.id, durationPlayed: currentTrack.duration }).catch(() => {});
    }
  }, [currentTrack?.id, isPlaying, currentTime]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    if (repeat === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      return;
    }

    let nextIdx = currentIndex + 1;
    if (shuffle && queue.length > 1) {
      const candidates = queue.map((_, idx) => idx).filter((idx) => idx !== currentIndex);
      nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
    } else if (nextIdx >= queue.length) {
      if (repeat === 'all') {
        nextIdx = 0;
      } else if (autoplay && currentTrack) {
        // Smart autoplay radio extension when queue ends
        api
          .get<{ tracks: Track[] }>(`/api/radio?seedType=song&seedId=${currentTrack.id}`)
          .then((res) => {
            const fresh = res.tracks.filter((t) => !queue.some((q) => q.id === t.id));
            if (fresh.length > 0) {
              autoPlayNextLoadRef.current = true;
              setQueue((prev) => [...prev, ...fresh]);
              setCurrentIndex(queue.length);
            } else {
              setIsPlaying(false);
            }
          })
          .catch(() => setIsPlaying(false));
        return;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    autoPlayNextLoadRef.current = true;
    setCurrentIndex(nextIdx);
  }, [queue, currentIndex, repeat, shuffle, autoplay, currentTrack]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 4) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const prevIdx = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
    autoPlayNextLoadRef.current = true;
    setCurrentIndex(prevIdx);
  }, [queue.length, currentIndex]);

  // Attach native HTML5 Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (sleepEndOfTrack) {
        setSleepEndOfTrack(false);
        setSleepTimerSeconds(null);
        setIsPlaying(false);
        showToast('Sleep timer stopped playback', 'info');
        return;
      }
      nextTrack();
    };
    const onError = () => {
      setIsPlaying(false);
      showToast('Unable to load audio stream for this track', 'error');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [nextTrack, sleepEndOfTrack, showToast]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimerSeconds === null) return;
    if (sleepTimerSeconds <= 0) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setSleepTimerSeconds(null);
      showToast('Sleep timer ended — playback paused', 'info');
      return;
    }
    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepTimerSeconds, showToast]);

  const playTrack = useCallback(
    (track: Track, contextQueue?: Track[]) => {
      ensureAudioGraph();
      if (contextQueue && contextQueue.length > 0) {
        const idx = contextQueue.findIndex((t) => t.id === track.id);
        setQueue(contextQueue);
        const targetIdx = idx >= 0 ? idx : 0;
        if (currentTrack?.id === track.id && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else {
          autoPlayNextLoadRef.current = true;
          setCurrentIndex(targetIdx);
        }
        return;
      }

      const existingIdx = queue.findIndex((t) => t.id === track.id);
      if (existingIdx >= 0) {
        if (currentIndex === existingIdx && audioRef.current) {
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else {
          autoPlayNextLoadRef.current = true;
          setCurrentIndex(existingIdx);
        }
      } else {
        const nextQ = [...queue];
        const insertAt = currentIndex >= 0 ? currentIndex + 1 : 0;
        nextQ.splice(insertAt, 0, track);
        setQueue(nextQ);
        autoPlayNextLoadRef.current = true;
        setCurrentIndex(insertAt);
      }
    },
    [queue, currentIndex, currentTrack?.id, ensureAudioGraph]
  );

  const playTracks = useCallback(
    (tracks: Track[], startIndex = 0, shuffled = false) => {
      if (tracks.length === 0) return;
      ensureAudioGraph();
      let list = [...tracks];
      let targetIdx = Math.min(Math.max(0, startIndex), list.length - 1);
      if (shuffled) {
        setShuffle(true);
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        targetIdx = 0;
      }
      setQueue(list);
      if (currentTrack?.id === list[targetIdx].id && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        autoPlayNextLoadRef.current = true;
        setCurrentIndex(targetIdx);
      }
    },
    [currentTrack?.id, ensureAudioGraph]
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    ensureAudioGraph();
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentTrack, ensureAudioGraph]);

  const pausePlayback = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resumePlayback = useCallback(() => {
    ensureAudioGraph();
    audioRef.current?.play().catch(() => {});
  }, [ensureAudioGraph]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(seconds, audio.duration || duration || 0));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (clamped > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      showToast(!prev ? 'Shuffle enabled' : 'Shuffle disabled', 'info');
      return !prev;
    });
  }, [showToast]);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => {
      const next: RepeatMode = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      showToast(
        next === 'off' ? 'Repeat off' : next === 'all' ? 'Repeat all tracks' : 'Repeat current track',
        'info'
      );
      return next;
    });
  }, [showToast]);

  const setAutoplay = useCallback(
    (val: boolean) => {
      setAutoplayState(val);
      updatePreferences({ autoplay: val }).catch(() => {});
    },
    [updatePreferences]
  );

  const setCrossfadeSeconds = useCallback(
    (secs: number) => {
      const clamped = Math.max(0, Math.min(10, secs));
      setCrossfadeState(clamped);
      updatePreferences({ crossfadeSeconds: clamped }).catch(() => {});
    },
    [updatePreferences]
  );

  const applyEqPreset = useCallback(
    (preset: string) => {
      const bands = EQUALIZER_PRESETS[preset] || EQUALIZER_PRESETS.Normal;
      setEqPreset(preset);
      setEqBands([...bands]);
      updatePreferences({ equalizerPreset: preset, equalizerBands: bands }).catch(() => {});
    },
    [updatePreferences]
  );

  const setEqBand = useCallback(
    (index: number, gainDb: number) => {
      setEqPreset('Custom');
      setEqBands((prev) => {
        const next = [...prev];
        next[index] = Math.max(-12, Math.min(12, gainDb));
        updatePreferences({ equalizerPreset: 'Custom', equalizerBands: next }).catch(() => {});
        return next;
      });
    },
    [updatePreferences]
  );

  const setSleepTimer = useCallback(
    (minutes: number | null, endOfTrack = false) => {
      if (endOfTrack) {
        setSleepEndOfTrack(true);
        setSleepTimerSeconds(null);
        showToast('Playback will stop after this track', 'info');
      } else if (minutes && minutes > 0) {
        setSleepEndOfTrack(false);
        setSleepTimerSeconds(minutes * 60);
        showToast(`Sleep timer set for ${minutes} min`, 'info');
      } else {
        setSleepEndOfTrack(false);
        setSleepTimerSeconds(null);
        showToast('Sleep timer turned off', 'info');
      }
    },
    [showToast]
  );

  const addToQueue = useCallback(
    (track: Track) => {
      setQueue((prev) => {
        if (prev.length === 0) {
          autoPlayNextLoadRef.current = false;
          setCurrentIndex(0);
          return [track];
        }
        return [...prev, track];
      });
      showToast(`Added "${track.title}" to queue`, 'success');
    },
    [showToast]
  );

  const playNextInQueue = useCallback(
    (track: Track) => {
      setQueue((prev) => {
        if (prev.length === 0) {
          setCurrentIndex(0);
          return [track];
        }
        const next = [...prev];
        const insertPos = Math.max(0, currentIndex + 1);
        next.splice(insertPos, 0, track);
        return next;
      });
      showToast(`"${track.title}" will play next`, 'success');
    },
    [currentIndex, showToast]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const next = prev.filter((_, i) => i !== index);
        if (index < currentIndex) {
          setCurrentIndex((ci) => Math.max(0, ci - 1));
        } else if (index === currentIndex) {
          if (next.length === 0) {
            setCurrentIndex(-1);
            audioRef.current?.pause();
            setIsPlaying(false);
          } else {
            autoPlayNextLoadRef.current = isPlaying;
            setCurrentIndex(Math.min(index, next.length - 1));
          }
        }
        return next;
      });
    },
    [currentIndex, isPlaying]
  );

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      setQueue((prev) => {
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        if (currentIndex === fromIndex) {
          setCurrentIndex(toIndex);
        } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
          setCurrentIndex(currentIndex - 1);
        } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
          setCurrentIndex(currentIndex + 1);
        }
        return next;
      });
    },
    [currentIndex]
  );

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setCurrentIndex(0);
    } else {
      setQueue([]);
      setCurrentIndex(-1);
    }
    showToast('Cleared upcoming queue', 'info');
  }, [currentTrack, showToast]);

  const startSmartRadio = useCallback(
    async (seedType: 'song' | 'artist' | 'genre' | 'mood', seedId: string, label?: string) => {
      try {
        const res = await api.get<{ tracks: Track[] }>(
          `/api/radio?seedType=${encodeURIComponent(seedType)}&seedId=${encodeURIComponent(seedId)}`
        );
        if (res.tracks.length > 0) {
          playTracks(res.tracks, 0, false);
          showToast(`Started ${label || 'Smart'} Radio`, 'success');
        }
      } catch {
        showToast('Could not start radio queue', 'error');
      }
    },
    [playTracks, showToast]
  );

  const downloadTrackOffline = useCallback(
    async (track: Track) => {
      if (downloadedTracks.some((t) => t.id === track.id)) {
        showToast('Track is already saved for offline listening', 'info');
        return;
      }
      setDownloadingIds((prev) => [...prev, track.id]);
      try {
        if ('caches' in window) {
          const cache = await caches.open(OFFLINE_CACHE_NAME);
          await cache.add(track.audioUrl);
        }
        setDownloadedTracks((prev) => {
          const next = [track, ...prev.filter((t) => t.id !== track.id)];
          localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(next));
          return next;
        });
        showToast(`Downloaded "${track.title}" for offline playback`, 'success');
      } catch {
        showToast('Offline download failed', 'error');
      } finally {
        setDownloadingIds((prev) => prev.filter((id) => id !== track.id));
      }
    },
    [downloadedTracks, showToast]
  );

  const removeOfflineDownload = useCallback(
    async (trackId: string) => {
      const target = downloadedTracks.find((t) => t.id === trackId);
      if (target && 'caches' in window) {
        try {
          const cache = await caches.open(OFFLINE_CACHE_NAME);
          await cache.delete(target.audioUrl);
        } catch {
          // Ignore
        }
      }
      setDownloadedTracks((prev) => {
        const next = prev.filter((t) => t.id !== trackId);
        localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      showToast('Removed from Downloads', 'info');
    },
    [downloadedTracks, showToast]
  );

  const clearOfflineCache = useCallback(async () => {
    if ('caches' in window) {
      await caches.delete(OFFLINE_CACHE_NAME).catch(() => {});
    }
    localStorage.removeItem(DOWNLOADS_STORAGE_KEY);
    setDownloadedTracks([]);
    showToast('Cleared offline audio cache', 'info');
  }, [showToast]);

  const getFrequencyData = useCallback((target: Uint8Array): boolean => {
    if (!analyserRef.current) return false;
    analyserRef.current.getByteFrequencyData(target as Uint8Array<ArrayBuffer>);
    return true;
  }, []);

  const externalSyncSeekAndPlay = useCallback(
    (track: Track, positionSeconds: number, shouldPlay: boolean) => {
      ensureAudioGraph();
      if (currentTrack?.id !== track.id) {
        pendingSeekRef.current = positionSeconds;
        autoPlayNextLoadRef.current = shouldPlay;
        setQueue((prev) => {
          const idx = prev.findIndex((t) => t.id === track.id);
          if (idx >= 0) {
            setCurrentIndex(idx);
            return prev;
          }
          const next = [track, ...prev];
          setCurrentIndex(0);
          return next;
        });
        return;
      }
      const audio = audioRef.current;
      if (!audio) return;
      if (Math.abs(audio.currentTime - positionSeconds) > 1.8) {
        audio.currentTime = Math.max(0, Math.min(positionSeconds, track.duration));
        setCurrentTime(audio.currentTime);
      }
      if (shouldPlay && audio.paused) {
        audio.play().catch(() => {});
      } else if (!shouldPlay && !audio.paused) {
        audio.pause();
      }
    },
    [currentTrack?.id, ensureAudioGraph]
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchEl = document.getElementById('melody-global-search') as HTMLInputElement | null;
        searchEl?.focus();
        searchEl?.select();
        return;
      }

      if (isTyping) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekTo(currentTime + 10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekTo(currentTime - 10);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        nextTrack();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        prevTrack();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlayPause, seekTo, currentTime, nextTrack, prevTrack]);

  return (
    <PlayerContext.Provider
      value={{
        queue,
        currentIndex,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        shuffle,
        repeat,
        autoplay,
        crossfadeSeconds,
        eqPreset,
        eqBands,
        sleepTimerSeconds,
        sleepEndOfTrack,
        sidePanel,
        playlistModalTrack,
        downloadedTracks,
        downloadingIds,
        playTrack,
        playTracks,
        togglePlayPause,
        pausePlayback,
        resumePlayback,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        setAutoplay,
        setCrossfadeSeconds,
        applyEqPreset,
        setEqBand,
        setSleepTimer,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        setSidePanel,
        openPlaylistModal: setPlaylistModalTrack,
        startSmartRadio,
        downloadTrackOffline,
        removeOfflineDownload,
        clearOfflineCache,
        getFrequencyData,
        externalSyncSeekAndPlay,
      }}
    >
      <audio ref={audioRef} preload="metadata" className="hidden" />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
