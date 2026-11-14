# Melody — Every Mood Has a Melody

Melody is a full-stack music streaming web application built with React, TypeScript, Tailwind CSS, Express, WebSockets, and MongoDB/Mongoose (with automatic local atomic persistence when `MONGODB_URI` is not set).

## Features

- **Personalized Home Feed**: Time-of-day greetings, featured collection hero, and 10 horizontal scrollable shelves (*Made for You*, *Quick Picks*, *Trending Now*, *Popular Albums*, *New Releases*, *Top Artists*, *Recommended Playlists*, *Recently Played*, *Your Daily Mix*, and *Mood-Based Music*).
- **Music Discovery (`/explore`)**: Filter across 12 genres (Pop, Hip-Hop, Rock, Classical, Jazz, Electronic, Indie, Bollywood, Punjabi, Lo-fi, Devotional, Instrumental), 10 moods, and Regional/International catalogs, plus Top Charts.
- **Instant Search (`/search`)**: Live search suggestions, search history with clear option, trending searches, and category tabs for songs, artists, albums, and playlists.
- **Persistent HTML5 & Web Audio Player**:
  - Play/pause, next/previous, shuffle, repeat (off / all / one), seek, volume & mute.
  - 5-band Web Audio API Equalizer (`Normal`, `Bass Boost`, `Treble Boost`, `Pop`, `Rock`, `Classical`, plus custom dB sliders).
  - Real-time FFT frequency spectrum visualizer (`AnalyserNode`).
  - Configurable crossfade transitions (`0–10s`) and Sleep Timer (`15m`–`60m` or end of track).
  - Slide-over Queue manager (reorder, remove, clear, play next) & Lyrics panel (synchronized jump-to-line lyrics, static lyrics, or instrumental indicator).
  - Offline caching via browser Cache API (`Downloads` tab in `/library`).
  - Keyboard shortcuts: `Space` (Play/Pause), `ArrowLeft` / `ArrowRight` (Seek ±10s), `N` / `P` (Next/Prev), `Cmd/Ctrl + K` (Focus search).
- **Playlists & Library**: Create, edit, upload custom covers, add/remove/reorder songs, save albums, follow artists, and sort library tabs.
- **Listening History & Insights (`/history`)**: Interactive 7-day listening activity chart, favorite genres breakdown, top artists, and total time streamed.
- **Live Listening Party (`/party`)**: WebSocket-powered shared rooms with synchronized playback, shared queue, listener presence, and live room chat.
- **Authentication & Demo Mode**: Instant Demo Listener session, Email/Password registration & login with `scrypt` salted password hashing, password reset flow, and optional Google Sign-In.

## Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router, Lucide React, Motion
- **Backend**: Node.js, Express, `ws` WebSockets, JWT (`jsonwebtoken`), HTML5 Range-capable WAV Audio Synthesizer
- **Database**: MongoDB with Mongoose (`server/models.ts`) + atomic local file fallback (`data/melody-db.json`)

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```env
PORT=3000
MONGODB_URI=               # Optional: MongoDB connection string. Uses local persistence when blank.
JWT_SECRET=change-me       # Secret used to sign JWT sessions
VITE_GOOGLE_CLIENT_ID=     # Optional: Google OAuth 2.0 Web Client ID for Google Sign-In
```

## Installation & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server (Express + Vite + WebSocket server on port 3000)
npm run dev

# 3. Typecheck and build for production
npm run lint
npm run build
npm start
```
