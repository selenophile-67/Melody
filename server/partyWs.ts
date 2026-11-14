import crypto from 'crypto';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { TRACKS, getTrackById } from './catalog';

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
  participants: Map<string, { info: Participant; ws: WebSocket }>;
  messages: ChatMessage[];
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(code: string, clientId: string): RoomState {
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12) || 'MELODY-1';
  let room = rooms.get(cleanCode);
  if (!room) {
    room = {
      code: cleanCode,
      hostClientId: clientId,
      trackId: TRACKS[0].id,
      isPlaying: false,
      positionSeconds: 0,
      updatedAt: Date.now(),
      queue: [TRACKS[0].id, TRACKS[3].id, TRACKS[6].id, TRACKS[9].id],
      participants: new Map(),
      messages: [],
    };
    rooms.set(cleanCode, room);
  }
  return room;
}

function computeLivePosition(room: RoomState): number {
  if (!room.isPlaying) return room.positionSeconds;
  const elapsed = (Date.now() - room.updatedAt) / 1000;
  const track = getTrackById(room.trackId);
  const maxDur = track ? track.duration : 180;
  return Math.min(maxDur, Math.max(0, room.positionSeconds + elapsed));
}

function serializeRoom(room: RoomState) {
  return {
    code: room.code,
    hostClientId: room.hostClientId,
    trackId: room.trackId,
    isPlaying: room.isPlaying,
    positionSeconds: computeLivePosition(room),
    updatedAt: Date.now(),
    queue: room.queue,
    participants: Array.from(room.participants.values()).map((p) => p.info),
    messages: room.messages.slice(-50),
  };
}

function broadcast(room: RoomState, payload: unknown) {
  const raw = JSON.stringify(payload);
  for (const { ws } of room.participants.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(raw);
    }
  }
}

export function attachListeningPartyWs(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const reqUrl = request.url || '';
    if (!reqUrl.startsWith('/ws/party')) {
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const urlObj = new URL(req.url || '/ws/party', 'http://localhost');
    const requestedCode = urlObj.searchParams.get('room') || 'STUDIO-01';
    const clientId = urlObj.searchParams.get('clientId') || crypto.randomUUID();
    const userName = (urlObj.searchParams.get('name') || 'Guest Listener').slice(0, 32);
    const avatar = urlObj.searchParams.get('avatar') || '';

    const room = getOrCreateRoom(requestedCode, clientId);
    const participant: Participant = {
      clientId,
      name: userName,
      avatar,
      joinedAt: new Date().toISOString(),
    };

    room.participants.set(clientId, { info: participant, ws });

    // Send initial authoritative room snapshot to joining client
    ws.send(JSON.stringify({ type: 'party:state', payload: serializeRoom(room) }));

    // Broadcast updated presence to room
    broadcast(room, {
      type: 'party:presence',
      payload: {
        participants: Array.from(room.participants.values()).map((p) => p.info),
        hostClientId: room.hostClientId,
      },
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (!msg || typeof msg.type !== 'string') return;

        switch (msg.type) {
          case 'party:sync:request': {
            ws.send(JSON.stringify({ type: 'party:state', payload: serializeRoom(room) }));
            break;
          }
          case 'party:playback': {
            const { trackId, isPlaying, positionSeconds } = msg.payload || {};
            if (typeof trackId === 'string' && getTrackById(trackId)) {
              room.trackId = trackId;
              if (!room.queue.includes(trackId)) {
                room.queue.push(trackId);
              }
            }
            if (typeof isPlaying === 'boolean') {
              room.isPlaying = isPlaying;
            }
            if (typeof positionSeconds === 'number' && Number.isFinite(positionSeconds)) {
              room.positionSeconds = Math.max(0, positionSeconds);
            }
            room.updatedAt = Date.now();
            broadcast(room, {
              type: 'party:playback',
              payload: {
                trackId: room.trackId,
                isPlaying: room.isPlaying,
                positionSeconds: room.positionSeconds,
                updatedAt: room.updatedAt,
                actorName: userName,
              },
            });
            break;
          }
          case 'party:queue:add': {
            const trackId = msg.payload?.trackId;
            if (typeof trackId === 'string' && getTrackById(trackId)) {
              if (!room.queue.includes(trackId)) {
                room.queue.push(trackId);
              }
              broadcast(room, {
                type: 'party:queue',
                payload: { queue: room.queue },
              });
            }
            break;
          }
          case 'party:queue:remove': {
            const trackId = msg.payload?.trackId;
            if (typeof trackId === 'string') {
              room.queue = room.queue.filter((id) => id !== trackId);
              broadcast(room, {
                type: 'party:queue',
                payload: { queue: room.queue },
              });
            }
            break;
          }
          case 'party:chat': {
            const rawText = String(msg.payload?.text || '').trim().slice(0, 300);
            const msgId = String(msg.payload?.id || crypto.randomUUID());
            if (!rawText) return;
            // Idempotent check against duplicate message IDs
            if (room.messages.some((m) => m.id === msgId)) return;
            const entry: ChatMessage = {
              id: msgId,
              clientId,
              senderName: userName,
              text: rawText,
              sentAt: new Date().toISOString(),
            };
            room.messages.push(entry);
            if (room.messages.length > 80) {
              room.messages = room.messages.slice(-80);
            }
            broadcast(room, { type: 'party:chat', payload: entry });
            break;
          }
        }
      } catch {
        // Ignore malformed JSON frames
      }
    });

    ws.on('close', () => {
      room.participants.delete(clientId);
      if (room.participants.size === 0) {
        // Keep room state warm for 5 minutes for quick reconnects, then clean up
        setTimeout(() => {
          const r = rooms.get(room.code);
          if (r && r.participants.size === 0) {
            rooms.delete(room.code);
          }
        }, 5 * 60 * 1000);
      } else {
        if (room.hostClientId === clientId) {
          const nextHost = room.participants.keys().next().value;
          if (nextHost) room.hostClientId = nextHost;
        }
        broadcast(room, {
          type: 'party:presence',
          payload: {
            participants: Array.from(room.participants.values()).map((p) => p.info),
            hostClientId: room.hostClientId,
          },
        });
      }
    });
  });
}
