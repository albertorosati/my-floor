# ⚡ The Floor — 1v1 Voice Duel Showdown

<p align="center">
  <img src="https://img.shields.io/badge/Live%20Demo-Play%20Now-FF4D8D?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/WebRTC-PeerJS-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC" />
</p>

<p align="center">
  <strong>An adrenaline-fueled, single-screen 1v1 voice recognition party game inspired by <em>The Floor</em>.</strong><br>
  Play together locally on a single mic, or stream your screen on Discord while your opponent buzzes in from their phone via P2P WebRTC.
</p>

<p align="center">
  👉 <strong><a href="https://albertorosati.github.io/my-floor/">https://albertorosati.github.io/my-floor/</a></strong> 👈
</p>

---

## ✨ Highlights

- 🗣️ **Instant Voice Recognition (<100ms)**
  - Real-time continuous analysis of speech recognition streams.
  - Phonetic normalization engine with Damerau-Levenshtein fuzzy matching, singular/plural tolerance, accent stripping, Italian/English alias expansion, and automatic digit-to-word conversion.
  - Instant voice pass command (*"Passo!"*) with a 3-second penalty clock.
- 📸 **2,100+ Verified HD Photos across 56 Categories**
  - High-definition 960px imagery with automated aspect-ratio checks (`0.62 <= ratio <= 2.15`).
  - No title-spoiler posters or text-watermarked cards.
  - Studio light backdrop with radial illumination ensuring high contrast for both rectangular photography and transparent cutout PNGs.
- 🎴 **Alternating Category Draft**
  - Players alternate turns choosing from 4 illustrated category cards.
  - Includes a quick reroll button and a full searchable catalog modal.
- 🎙️ **Dual Play Modes (Local & Discord Remote)**
  1. **Local Party (Single Shared Mic)**: Pass the mic back and forth on the couch.
  2. **Discord Screen Share + P2P Remote Mic**: Host streams the browser on Discord; Player 2 scans a QR code or opens `?room=CODE` on their phone or second PC. Transcripts and mic activity sync in real-time over WebRTC data channels with zero server bottlenecks.
- 🎨 **Warm & Tactile Party Game Aesthetics**
  - Custom design system with chunky 3D borders, playful avatars, bounce animations, and warm cream cards.
- 🧱 **Decoupled Modular Architecture**
  - Game options, audio parameters, and voice thresholds live in external JSON configurations (`src/config/`, `public/config/`).
  - All 56 categories are served as standalone JSON files in `public/categories/*.json` and fetched on demand via `CategoryRepository`.
- 🔊 **Copyright-Safe Procedural Audio**
  - 100% synthesized procedural sound effects built with the browser's native Web Audio API (countdown beeps, victory fanfares, clock urgency ticks, and streak chimes), plus optional speech synthesizer announcements.
- 🛠️ **Built-in Category Editor**
  - Create and tweak custom decks directly in the browser, upload local images or external URLs, and export/import `.json` packs.

---

## 🎮 How to Play

1. **Pick Match Settings**: Choose your target score (Best of 3, 5, 7, or Endless) and duel timer (30s, 45s, 60s).
2. **Draft a Category**: On each round, the active player picks 1 of the 4 category cards on screen.
3. **The Voice Duel**:
   - Both timers start counting down.
   - Say what you see on the screen! When recognized, your clock pauses, a point registers, and the turn instantly passes to your opponent with a new image.
   - Don't know the answer? Say **"Passo"** (or hit **Space**) to reveal the answer and take a 3-second countdown penalty.
   - The first player whose clock hits zero loses the round!

### Keyboard Shortcuts
| Key | Action |
| :--- | :--- |
| `Space` | Pass / Skip current photo (-3s penalty) |
| `Enter` | Manual judge override (marks answer as correct) |
| `P` | Pause / Resume timer |

---

## 🗂️ 56 Visual Categories

- **Pop Culture & Stars**: Global Pop Stars, Italian Singers & Rappers, Hollywood Actors, Italian Actors, Music Icons (70s-90s), Movie Directors.
- **Cinema & TV**: Cult Movies, Famous TV Series, YouTubers & Streamers, Disney Characters, Cartoons & Animated Films, Viral Memes & TikTok Trends, Gen Z Starter Pack, 90s & 2000s Nostalgia, Italian TV Celebrities.
- **Gaming & Fiction**: Iconic Video Games, Pokémon, Anime & Manga, Superheroes & Villains, Board Games, Myths & Legendary Creatures.
- **Nature & Animals**: Dog Breeds, Cat Breeds, Wild Animals, Birds of the World, Reptiles & Deep Sea, Insects & Butterflies, Flowers & Plants, Natural Wonders, Space & Science.
- **Food & Drinks**: Italian Cuisine, Street Food & World Dishes, Desserts & Pastry, Cheeses & Cold Cuts, Cocktails & Wine, Snacks & Sodas, Fruits & Vegetables.
- **World & Society**: World Flags, Historic Monuments, Famous Cities, Bridges & Towers, Historical Figures & Geniuses, Art Masterpieces, Musical Instruments, Household Items, Work & Emergency Vehicles, Extreme & Winter Sports, Elite Footballers, Sports Legends, Sports Disciplines, Scientific & Medical Instruments, Minerals & Gemstones, Fashion & Sneakers, World Masks & Costumes, Jobs & Trades.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (Node 20 or 24 recommended)
- npm or pnpm

### Setup
```bash
# Clone the repository
git clone https://github.com/albertorosati/my-floor.git
cd my-floor

# Install dependencies
npm install

# Start development server
npm run dev
```

### Unit Tests
```bash
# Run Vitest test suite
npm test
```

### Production Build
```bash
# Build production bundle into /dist
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Project Structure

```
my-floor/
├── public/
│   ├── categories/            # 56 modular category JSON files + index.json
│   └── config/                # Runtime game configuration JSON
├── scripts/
│   ├── build-catalog.mjs      # Image fetcher, aspect ratio validator & builder
│   ├── seed-part1.mjs         # Category metadata definitions (1-36)
│   └── seed-part4.mjs         # Expanded categories (37-56)
├── src/
│   ├── components/            # React screen components (Lobby, Draft, Duel, RemoteMic, etc.)
│   ├── config/                # Modular game & voice configuration sources
│   ├── data/                  # Category catalog & fallback bindings
│   ├── engine/                # Speech recognition, fuzzy voice matcher, WebRTC sync & audio synth
│   ├── services/              # ConfigService & async CategoryRepository
│   ├── types/                 # TypeScript interfaces and game types
│   ├── App.tsx                # Main state controller
│   └── main.tsx               # App entrypoint
├── .github/workflows/         # Automated GitHub Pages CI/CD workflow
└── package.json
```

---

## 🌐 Deployment

The project is preconfigured for automatic continuous deployment to **GitHub Pages** via GitHub Actions:
- Workflow file: `.github/workflows/deploy.yml`
- Base URL configured in `vite.config.ts`: `./`
- Live deployment: **[https://albertorosati.github.io/my-floor/](https://albertorosati.github.io/my-floor/)**

---

## 📄 License

MIT License. Designed and built with ❤️ for party games, couch challenges, and Discord hangouts.
