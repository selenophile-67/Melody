# 🎵 Melody — Every Mood Has a Melody

**Melody** is a modern, full-stack music streaming web application designed to deliver a personalized and immersive music-listening experience. Discover music, explore artists and albums, create playlists, manage your library and enjoy synchronized listening sessions with friends — all through a sleek, responsive interface.

Built with **React, TypeScript, Vite, Express, MongoDB, and WebSockets**, Melody combines music discovery, personalization and interactive playback in one platform.

---

## ✨ Features

### 🏠 Personalized Home Dashboard
- Personalized music recommendations.
- Featured playlists and albums.
- Trending tracks and popular artists.
- Recently played songs.
- Daily mixes and mood-based recommendations.
- Quick access to frequently played music.

### 🔎 Music Discovery & Search
- Explore music across multiple genres.
- Discover tracks based on moods.
- Browse regional and international music.
- Search for songs, artists, albums and playlists.
- Live search suggestions.
- Trending searches and search history.

### 🎧 Advanced Music Player
- Play and pause music.
- Next and previous track controls.
- Shuffle and repeat modes.
- Interactive progress bar and track seeking.
- Volume control and mute functionality.
- Persistent playback while navigating the application.
- Real-time audio spectrum visualizer.
- Five-band audio equalizer.
- Configurable crossfade transitions.
- Sleep timer.
- Lyrics panel with synchronized lyrics where available.
- Queue management with reorder, remove and play-next options.
- Keyboard shortcuts for convenient playback control.

### 📚 Personal Music Library
- Like and save songs.
- Create and manage custom playlists.
- Add and remove tracks from playlists.
- Reorder playlist tracks.
- Upload custom playlist cover images.
- Save albums.
- Follow artists.
- Organize and sort your music library.
- Offline caching through the browser Cache API.

### 📊 Listening History & Insights
- Track listening activity.
- View recently played songs.
- Explore listening history.
- View seven-day listening activity.
- Discover favorite genres and top artists.
- Monitor total listening time.

### 🎉 Live Listening Party
- Create and join shared listening rooms.
- Synchronize playback between participants.
- Share and manage the listening queue.
- View listener presence.
- Communicate through live room chat.
- WebSocket-powered real-time interaction.

### 🔐 Authentication & User Accounts
- Email and password registration.
- Secure password hashing using Node.js `scrypt`.
- JWT-based authentication.
- Demo listener mode.
- Optional Google Sign-In.
- User profile management.
- Personalized preferences and settings.

### 🎨 Modern User Interface
- Sleek dark-themed music interface.
- Responsive design for different screen sizes.
- Smooth animations and transitions.
- Interactive music cards and artwork.
- Dedicated pages for artists, albums, playlists and tracks.
- Modern navigation and persistent music player.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Frontend user interface |
| TypeScript | Type-safe development |
| Vite | Development server and build tool |
| Tailwind CSS v4 | Styling and responsive design |
| React Router | Application navigation |
| Lucide React | Icons |
| Motion | Animations and transitions |
| Node.js | Backend runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| JSON Web Token | Authentication |
| WebSockets | Real-time listening parties |
| Web Audio API | Audio processing and visualization |
| HTML5 Audio | Music playback |

---

## 📁 Project Structure

```text
Melody/
│
├── public/
│
├── src/
│   ├── assets/
│   │   └── images/
│   │
│   ├── components/
│   │   ├── AddToPlaylistModal.tsx
│   │   ├── Artwork.tsx
│   │   ├── AudioVisualizer.tsx
│   │   ├── HorizontalShelf.tsx
│   │   ├── Layout.tsx
│   │   ├── LyricsView.tsx
│   │   ├── MediaCards.tsx
│   │   ├── PlayerBar.tsx
│   │   ├── QueuePanel.tsx
│   │   └── TrackMenu.tsx
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── PlayerContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   │
│   ├── lib/
│   │   └── api.ts
│   │
│   ├── pages/
│   │   ├── AlbumPage.tsx
│   │   ├── ArtistPage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LibraryPage.tsx
│   │   ├── LikedSongsPage.tsx
│   │   ├── ListeningPartyPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NowPlayingPage.tsx
│   │   ├── PlaylistDetailPage.tsx
│   │   ├── PlaylistsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── SearchPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── server/
│   ├── artworkSvg.ts
│   ├── audioSynth.ts
│   ├── auth.ts
│   ├── catalog.ts
│   ├── db.ts
│   ├── models.ts
│   ├── partyWs.ts
│   ├── routes.ts
│   └── types.ts
│
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run Melody on your local machine.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) (a version compatible with the project's Vite and TypeScript dependencies)
- npm
- [MongoDB](https://www.mongodb.com/) (optional, if you want to use MongoDB instead of local persistence)
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Melody.git
```

Navigate into the project directory:

```bash
cd Melody
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`.

```bash
cp .env.example .env
```

On Windows Command Prompt, you can use:

```cmd
copy .env.example .env
```

Configure the environment variables:

```env
PORT=3000

APP_URL=http://localhost:3000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secure_random_secret

VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

GEMINI_API_KEY=your_gemini_api_key
```

**Environment variable details:**

| Variable | Description |
|---|---|
| `PORT` | Port on which the application runs |
| `APP_URL` | Application base URL |
| `MONGODB_URI` | MongoDB connection string; optional |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `VITE_GOOGLE_CLIENT_ID` | Optional Google OAuth client ID |
| `GEMINI_API_KEY` | Optional Gemini API key |

**Important:**
- Use a strong, randomly generated JWT secret.
- Do not upload your `.env` file to GitHub.
- Keep all private API keys and database credentials secret.
- MongoDB is optional. When `MONGODB_URI` is not configured or MongoDB is unavailable, the application falls back to local JSON persistence in `data/melody-db.json`.

### 4. Start the Application

Run the following command:

```bash
npm run dev
```

The application starts with the Express backend and Vite development middleware.

Open your browser and visit:

```text
http://localhost:3000
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start the development server |
| `npm start` | Start the application server |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the Vite production build |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove generated build output |

### Production Build

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Set the environment variable:

```env
NODE_ENV=production
```

The production server serves the generated frontend from the `dist` directory.

---

## 🔌 API Overview

The backend exposes REST API endpoints under `/api`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/demo` | Start a demo session |
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/forgot-password` | Password recovery endpoint |
| POST | `/api/auth/google` | Google authentication |
| GET | `/api/auth/me` | Get authenticated user |

### Music & Discovery

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/home` | Get personalized home content |
| GET | `/api/explore` | Explore music |
| GET | `/api/search` | Search music and creators |
| GET | `/api/songs` | Get songs |
| GET | `/api/songs/:id` | Get a specific song |
| GET | `/api/artists/:id` | Get artist details |
| GET | `/api/albums/:id` | Get album details |
| GET | `/api/radio` | Get radio recommendations |
| GET | `/api/audio/:trackId` | Stream track audio |
| GET | `/api/artwork/:seed` | Generate artwork |

### Playlists

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/playlists` | Get playlists |
| GET | `/api/playlists/:id` | Get playlist details |
| POST | `/api/playlists` | Create a playlist |
| PATCH | `/api/playlists/:id` | Update a playlist |
| DELETE | `/api/playlists/:id` | Delete a playlist |
| POST | `/api/playlists/:id/tracks` | Add a track |
| DELETE | `/api/playlists/:id/tracks/:trackId` | Remove a track |
| PUT | `/api/playlists/:id/reorder` | Reorder playlist tracks |
| POST | `/api/playlists/:id/save` | Save a playlist |

### Library & Listening History

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/library` | Get user library |
| POST | `/api/library/like/:trackId` | Like a song |
| POST | `/api/library/album/:albumId` | Save an album |
| POST | `/api/library/follow/:artistId` | Follow an artist |
| POST | `/api/history` | Record listening activity |
| GET | `/api/history` | Get listening history |
| DELETE | `/api/history` | Clear listening history |

### User Settings

| Method | Endpoint | Description |
|---|---|---|
| PATCH | `/api/user/profile` | Update user profile |
| PATCH | `/api/user/preferences` | Update preferences |

### Health Check

```http
GET /api/health
```

The API uses JWT authentication for protected operations. Include the token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🗄️ Database

Melody supports MongoDB through Mongoose.

The database layer includes models and persistence for:

- User accounts
- User preferences
- Liked songs
- Saved albums and playlists
- Followed artists
- Listening history
- Playlists

If MongoDB is not configured, Melody uses local atomic JSON-file persistence.

---

## 🎼 Demo Mode

You can explore Melody without creating an account by using the built-in Demo Listener option.

Demo credentials:

```text
Email: demo@melody.app
Password: melodydemo
```

Demo mode allows you to explore the music interface and sample library without setting up a personal account.

---

## 🎨 Screens & Pages

Melody includes dedicated pages for:

- Home
- Explore
- Search
- Library
- Liked Songs
- Playlists
- Playlist Details
- Artist Details
- Album Details
- Now Playing
- Listening History
- Listening Party
- User Profile
- Login & Registration
- Settings

---

## 🔒 Security & Privacy

- Passwords are hashed using Node.js `scrypt` with a random salt.
- Authentication sessions use JWT.
- Protected API routes require valid authentication.
- Environment variables are used for private configuration.
- User-specific data is associated with authenticated accounts.

Never commit database credentials, private API keys or production secrets to the repository.

---

## 🗺️ Future Improvements

Potential areas for future development include:

- Integration with licensed music providers.
- Expanded music recommendation algorithms.
- More advanced listening analytics.
- Improved mobile experience.
- Enhanced accessibility.
- Additional social listening features.
- Improved offline listening support.
- Automated backend and frontend testing.
- Production deployment and monitoring.

---

## ⚠️ Important Notes

- The bundled catalogue contains sample/demo music metadata and artwork.
- The audio synthesizer provides generated demo audio; it should not be mistaken for a licensed commercial music catalogue.
- Use properly licensed recordings, artwork and lyrics before making the platform publicly available.
- Google Sign-In requires valid OAuth configuration.
- MongoDB persistence requires a valid database connection.
- Local JSON persistence is intended as a fallback, not a replacement for a production database.

---

## 🤝 Contributing

Contributions, suggestions and improvements are welcome!

1. Fork this repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add: your feature description"
   ```

4. Push your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a Pull Request.

---

## 📄 License

No license has been specified for this repository yet. All rights are reserved by default unless a license is added by the project owner.

---

## 💜 Acknowledgements

Melody is built with the help of the open-source ecosystem and the technologies that make modern web development possible.

Special thanks to the developers and communities behind React, TypeScript, Vite, Express, MongoDB, Tailwind CSS and the other tools used in this project.

---

<p align="center">

**🎵 Melody — Every Mood Has a Melody.**

*Discover. Listen. Feel. Repeat.*

</p>
