import React, { useEffect, useRef, useState } from 'react';
import { Copy, Pause, Play, Plus, Radio, Send, Trash2, Users } from 'lucide-react';
import { Artwork } from '../components/Artwork';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Track, formatDuration } from '../types';

interface Participant {
  clientId: string;
  name: string;
  avatar: string;
  joinedAt: string;
}

interface ChatMessage {
  id: string;
  clientId: string;
  senderName: string;
  text: string;
  sentAt: string;
}

interface RoomState {
  code: string;
  hostClientId: string;
  trackId: string;
  isPlaying: boolean;
  positionSeconds: number;
  updatedAt: number;
  queue: string[];
  participants: Participant[];
  messages: ChatMessage[];
}

export function ListeningPartyPage() {
  const { user } = useAuth();
  const { externalSyncSeekAndPlay } = usePlayer();
  const { showToast } = useToast();

  const [roomCode, setRoomCode] = useState('STUDIO-01');
  const [joinInput, setJoinInput] = useState('STUDIO-01');
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [catalog, setCatalog] = useState<Track[]>([]);
  const [chatText, setChatText] = useState('');
  const [selectedAddTrack, setSelectedAddTrack] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(
    sessionStorage.getItem('melody_party_client_id') ||
      (() => {
        const id = `cli-${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem('melody_party_client_id', id);
        return id;
      })()
  );

  useEffect(() => {
    api
      .get<{ tracks: Track[] }>('/api/songs')
      .then((res) => {
        setCatalog(res.tracks || []);
        if (res.tracks?.[0]) setSelectedAddTrack(res.tracks[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let closedByEffect = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const name = user?.username || 'Guest Listener';
      const avatar = user?.profilePicture || '';
      const wsUrl = `${protocol}//${window.location.host}/ws/party?room=${encodeURIComponent(
        roomCode
      )}&clientId=${encodeURIComponent(clientIdRef.current)}&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(
        avatar
      )}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'party:state') {
            const state = msg.payload as RoomState;
            setRoom(state);
            const t = catalog.find((item) => item.id === state.trackId);
            if (t) {
              externalSyncSeekAndPlay(t, state.positionSeconds, state.isPlaying);
            }
          } else if (msg.type === 'party:playback') {
            const { trackId, isPlaying, positionSeconds, updatedAt } = msg.payload;
            setRoom((prev) => (prev ? { ...prev, trackId, isPlaying, positionSeconds, updatedAt } : prev));
            const t = catalog.find((item) => item.id === trackId);
            if (t) {
              externalSyncSeekAndPlay(t, positionSeconds, isPlaying);
            }
          } else if (msg.type === 'party:queue') {
            setRoom((prev) => (prev ? { ...prev, queue: msg.payload.queue } : prev));
          } else if (msg.type === 'party:presence') {
            setRoom((prev) =>
              prev
                ? { ...prev, participants: msg.payload.participants, hostClientId: msg.payload.hostClientId }
                : prev
            );
          } else if (msg.type === 'party:chat') {
            const entry = msg.payload as ChatMessage;
            setRoom((prev) => {
              if (!prev) return prev;
              if (prev.messages.some((m) => m.id === entry.id)) return prev;
              return { ...prev, messages: [...prev.messages, entry] };
            });
          }
        } catch {
          // Ignore invalid socket frame
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!closedByEffect) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    };

    if (catalog.length > 0) {
      connect();
    }

    return () => {
      closedByEffect = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [roomCode, user?.username, catalog.length]);

  const sendEvent = (type: string, payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const activeTrack = catalog.find((t) => t.id === room?.trackId) || catalog[0];

  const handleTogglePartyPlay = () => {
    if (!room || !activeTrack) return;
    sendEvent('party:playback', {
      trackId: activeTrack.id,
      isPlaying: !room.isPlaying,
      positionSeconds: room.positionSeconds,
    });
  };

  const handleSelectTrack = (trackId: string) => {
    sendEvent('party:playback', {
      trackId,
      isPlaying: true,
      positionSeconds: 0,
    });
  };

  const handleAddQueue = () => {
    if (!selectedAddTrack) return;
    sendEvent('party:queue:add', { trackId: selectedAddTrack });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    sendEvent('party:chat', { id: `${Date.now()}-${Math.random()}`, text: chatText.trim() });
    setChatText('');
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      showToast(`Room code ${roomCode} copied`, 'success');
    } catch {
      showToast(`Room code: ${roomCode}`, 'info');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listening Party</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time synchronized playback room powered by WebSockets. Open two browser tabs with the same room code to listen together.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (joinInput.trim()) setRoomCode(joinInput.trim().toUpperCase());
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
            placeholder="Room code…"
            aria-label="Room code"
            className="w-36 px-3 py-2 text-xs font-mono-tabular rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 uppercase"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#FF3B5C] text-white text-xs font-semibold whitespace-nowrap"
          >
            Join Room
          </button>
          <button
            type="button"
            onClick={copyRoomCode}
            aria-label="Copy room code"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Copy className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Room Stage & Shared Queue */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Radio className={`w-4 h-4 ${connected ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <span>
                  Room <strong className="font-mono-tabular">{roomCode}</strong> ·{' '}
                  {connected ? 'Connected' : 'Connecting…'}
                </span>
              </div>
              <div className="text-xs text-zinc-500 flex items-center gap-1.5 tabular-nums">
                <Users className="w-3.5 h-3.5" />
                <span>{room?.participants.length || 0} listeners</span>
              </div>
            </div>

            {activeTrack && (
              <div className="flex items-center gap-4">
                <Artwork src={activeTrack.artwork} alt={activeTrack.title} className="w-20 h-20 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-500">Synchronized Track</div>
                  <div className="text-lg font-bold truncate">{activeTrack.title}</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{activeTrack.artistName}</div>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePartyPlay}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF3B5C] hover:bg-[#FF5270] text-white text-sm font-semibold shrink-0"
                >
                  {room?.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{room?.isPlaying ? 'Pause All' : 'Play All'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Shared Queue */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">Shared Room Queue</h2>
              <div className="flex items-center gap-2">
                <select
                  value={selectedAddTrack}
                  onChange={(e) => setSelectedAddTrack(e.target.value)}
                  aria-label="Select track to add to party queue"
                  className="px-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-[200px]"
                >
                  {catalog.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — {t.artistName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddQueue}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {(room?.queue || []).map((tid) => {
                const t = catalog.find((item) => item.id === tid);
                if (!t) return null;
                const isCurrent = room?.trackId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 p-2 rounded-xl ${
                      isCurrent ? 'bg-[#FF3B5C]/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTrack(t.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <Artwork src={t.artwork} alt={t.title} className="w-10 h-10 shrink-0" rounded="rounded" />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate ${isCurrent ? 'text-[#FF3B5C]' : ''}`}>
                          {t.title}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">{t.artistName}</div>
                      </div>
                      <span className="text-xs font-mono-tabular text-zinc-400">{formatDuration(t.duration)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => sendEvent('party:queue:remove', { trackId: t.id })}
                      aria-label={`Remove ${t.title}`}
                      className="p-1.5 text-zinc-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Listeners & Live Chat */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] space-y-3">
            <h2 className="text-base font-semibold">Connected Listeners</h2>
            <div className="flex flex-wrap gap-2">
              {(room?.participants || []).map((p) => (
                <div
                  key={p.clientId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-medium"
                >
                  <span>{p.name}</span>
                  {p.clientId === room?.hostClientId && (
                    <span className="text-[#FF3B5C]">· Host</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#131317] border border-zinc-200/80 dark:border-white/[0.07] flex flex-col h-80">
            <h2 className="text-base font-semibold mb-3">Room Chat</h2>
            <div className="flex-1 overflow-y-auto melody-scroll space-y-2 pr-1">
              {(room?.messages || []).length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">No messages yet. Say hello to the room.</p>
              ) : (
                room?.messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className="font-semibold text-[#FF3B5C] mr-2">{m.senderName}:</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{m.text}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendChat} className="pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Send a message…"
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-[#FF3B5C] text-white"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
