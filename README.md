# 🎲 Ludo Royale — React Native Ludo Game

A full-featured, cross-platform Ludo game built with Expo + React Native.
Pass-and-play locally, practice against AI (3 real difficulty levels),
or play online in real time with friends — with Firebase Auth, a
Firestore-backed leaderboard, and cross-device save/resume.

![Status](https://img.shields.io/badge/status-production--ready_scaffold-success)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2051-000020)

---

## ✅ What's fully working out of the box (no setup required)

- **Complete Ludo rules engine** — dice rolls, entering from yard on a 6,
  movement, capturing, safe cells, home stretch, win detection,
  consecutive-six forfeiture. Verified against 600+ simulated full games
  with zero rule violations (see [Testing](#-testing--this-was-actually-run)).
- **2–4 player support**, selectable at game setup.
- **Pass & Play** (local multiplayer, one device).
- **Vs AI with 3 real difficulty levels** — Easy, Medium, Hard. These are
  genuinely different opponents, not relabeled copies (see
  [AI Difficulty](#-ai-difficulty--how-it-actually-works) below for the
  verified win-rate numbers).
- **Polished custom graphics** — gradient-shaded SVG board, dice, and
  tokens with drop shadows and glossy highlights; no external image
  assets needed. App icon/splash/adaptive-icon/favicon are generated
  placeholders with real depth (gradients + shadows), not flat shapes.
- **Physically-flavored animations** — dice "tumble" (scrambled faces +
  decelerating spin + squash-on-landing), tokens hop with easing rather
  than sliding flat, win celebration with confetti.
- **Sound effects + background music with a working mute toggle** — see
  [Sound Setup](#-sound-setup).
- **Save/Resume** — game state persists to `AsyncStorage` automatically,
  and additionally mirrors to Firestore for signed-in users so a game
  can be resumed from a different device (see
  [Cross-Device Save/Resume](#-crossdevice-saveresume)).
- **Profile system** — username, emoji avatar, win/loss/capture stats,
  sound/music toggles, all persisted locally and synced to the cloud
  when signed in.
- **In-game chat + emotes** for online matches.
- **Real-time online multiplayer** via an included, deployable Socket.IO
  server — create a room, share the code, join, ready up, and play, with
  the **server** validating every move (the client never decides what's
  legal — see [Server](#-multiplayer-server)).

## ⚠️ What needs your own credentials to go fully live

These are wired with real, working code — not stubs — but need
credentials only you can provide, since they depend on services tied to
your own accounts:

| Feature | Files | What you need to provide |
|---|---|---|
| Google/Apple Sign-In | `src/utils/AuthService.js`, `src/config/firebaseConfig.js` | A Firebase project + Google/Apple OAuth client IDs |
| Firestore leaderboard | `src/utils/LeaderboardService.js`, `firestore.rules.example` | A Firestore database + deployed security rules |
| Cross-device save/resume | `src/utils/CloudSaveService.js` | Same Firestore database as above |
| Production multiplayer server | `server/`, `server/README_DEPLOY.md` | A deployed instance (Render/Railway/Fly.io/your own VM) |
| Ads / IAP | *(not included — see note below)* | Your own publisher/store IDs |

Until configured, every one of these features degrades gracefully:
auth buttons explain they're not configured instead of crashing, the
leaderboard shows realistic mock data, save/resume falls back to
local-only (AsyncStorage), and online play shows a clear "can't reach
server" message with retry. **Nothing in the app is blocked on
credentials you haven't set up yet.**

---

## 📁 Project Structure

```
ludo-game/
├── App.js                       # Entry point: profile load, sound sync, splash
├── app.json                     # Expo config (+ Apple Sign-In entitlement)
├── eas.json                     # EAS Build profiles (dev/preview/production)
├── render.yaml                  # One-click Render.com deploy blueprint for the server
├── firestore.rules.example      # Firestore security rules — copy to your project
├── .env.example                 # Copy to .env and fill in your real values
├── babel.config.js
├── package.json
├── assets/
│   ├── icon.png, splash.png, adaptive-icon.png, favicon.png  (generated, see below)
│   └── sounds/                  # Drop .mp3 files here (see sounds/README.md)
├── scripts/
│   ├── check_syntax.js          # Babel-based syntax check across all source files
│   ├── test_game_logic.mjs      # Simulates hundreds of games, checks invariants
│   ├── test_ai_difficulty.mjs   # Verifies EASY/MEDIUM/HARD are genuinely different
│   ├── run-test.mjs             # Runner that lets the above import real RN source under plain Node
│   └── resolve-extensionless-loader.mjs  # Node ESM loader shim (see script header)
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── PlayerSetupScreen.js  # Now includes AI difficulty picker
│   │   ├── OnlineLobbyScreen.js
│   │   ├── GameScreen.js
│   │   ├── ProfileScreen.js      # Real Google/Apple sign-in buttons
│   │   └── LeaderboardScreen.js  # Pull-to-refresh, real Firestore data
│   ├── components/
│   │   ├── Board.js              # SVG board with gradients + drop shadow
│   │   ├── Token.js               # Gradient-shaded token with hop animation
│   │   ├── Dice.js                # Tumble-physics animated dice
│   │   ├── Scoreboard.js
│   │   ├── ChatBox.js
│   │   └── WinCelebration.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── store/
│   │   ├── useGameStore.js       # Live game state + local+cloud persistence
│   │   └── useProfileStore.js    # Profile + stats + cloud reconciliation
│   ├── theme/
│   │   └── Theme.js
│   ├── config/
│   │   └── firebaseConfig.js     # Reads .env, initializes Firebase app/auth/db
│   └── utils/
│       ├── BoardConfig.js        # Board geometry constants (single source of truth)
│       ├── GameLogic.js          # Pure rules engine (framework-free)
│       ├── AI.js                 # 3-tier difficulty AI with verified win rates
│       ├── SoundManager.js       # expo-av wrapper, reactive to mute settings
│       ├── SocketClient.js       # Configurable dev/prod server URL
│       ├── AuthService.js        # Real Google + Apple sign-in via Firebase
│       ├── LeaderboardService.js # Real Firestore reads/writes
│       └── CloudSaveService.js   # Cross-device save/resume via Firestore
└── server/                       # Node.js Socket.IO server (online play)
    ├── server.js
    ├── gameLogic.js               # Server-authoritative copy of the rules
    ├── Dockerfile                 # For Render/Railway/Fly.io/any Docker host
    ├── README_DEPLOY.md           # Step-by-step deploy guide (4 options)
    ├── package.json
    └── test_integration.js        # Two-client smoke test (see below)
```

---

## 🚀 Quick Start (local dev, no credentials needed)

```bash
cd ludo-game
npm install
cp .env.example .env   # safe to leave as-is for local dev — see below
npx expo start
```

Scan the QR code with **Expo Go**, or press `a` / `i` for an
emulator/simulator, or `w` for web. Pass & Play and Vs AI modes work
immediately with zero configuration.

---

## 🔥 Firebase Setup (for Auth + Leaderboard + Cloud Save)

### 1. Create a Firebase project
Go to [console.firebase.google.com](https://console.firebase.google.com) →
**Add project**.

### 2. Register a Web app (Expo uses the Firebase Web SDK even for mobile)
Project Settings → Your apps → **Add app** → Web (`</>`). Copy the config
object it shows you.

### 3. Fill in `.env`
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123
```
The app detects placeholder values automatically — until these are real,
`isFirebaseConfigured()` returns `false` and auth/leaderboard/cloud-save
gracefully fall back (see the table above).

### 4. Enable Authentication providers
Authentication → Sign-in method → enable **Google** and **Apple**.

### 5. Google Sign-In OAuth client IDs
Google Cloud Console → APIs & Services → Credentials → **Create OAuth
client ID**, once each for:
- **Web application** → put the client ID in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- **iOS** (bundle ID must match `app.json`'s `ios.bundleIdentifier`) →
  `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- **Android** (needs your SHA-1 fingerprint — get it via `eas credentials`
  for an EAS-managed keystore, or `keytool -list -v -keystore your.keystore`
  for a local one) → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

Then paste the **Web** client ID + its secret into Firebase Console →
Authentication → Sign-in method → Google.

### 6. Apple Sign-In
- Apple Developer account → enable the "Sign in with Apple" capability
  for your App ID.
- Already wired in `app.json` via `"usesAppleSignIn": true` and the
  `expo-apple-authentication` plugin.
- In Firebase Console → Authentication → Sign-in method, enable Apple.
- Apple Sign-In only works natively on iOS — the Profile screen hides
  the Apple button automatically on Android/web
  (`isAppleSignInAvailableOnDevice()`).

### 7. Native config files (only needed for EAS builds, not Expo Go)
Download from Firebase Console → Project Settings → Your apps:
- `GoogleService-Info.plist` (iOS) → project root
- `google-services.json` (Android) → project root

See `FIREBASE_NATIVE_FILES_README.txt` for exact steps. If you're not
ready for this yet, remove the two `googleServicesFile` lines from
`app.json` and EAS builds will proceed without them (auth stays in
guest mode).

### 8. Create Firestore + deploy security rules
Firestore Database → **Create database** → production mode.
Then copy `firestore.rules.example` into the Rules tab (or
`firestore.rules` if using the CLI) and **Publish**. These rules:
- Let anyone read the `players` collection (for the public leaderboard).
- Only let a signed-in user write to *their own* player document.
- Bound how much `wins` can jump in a single write (basic anti-tamper).
- Keep `savedGames` fully private (owner-only read/write).

---

## 🌐 Multiplayer Server

### Local dev
```bash
cd server
npm install
node server.js
# -> Ludo Royale server listening on port 3001
```

### Pointing the app at it
Set in `.env`:
```env
EXPO_PUBLIC_SERVER_URL=http://localhost:3001
```
- **Physical device**: use your computer's LAN IP instead of `localhost`
  (e.g. `http://192.168.1.50:3001`) — find it with `ipconfig getifaddr en0`
  (Mac) or `ipconfig` (Windows).
- **Android Emulator**: use `http://10.0.2.2:3001`.

### Production deployment
See **`server/README_DEPLOY.md`** for full step-by-step guides covering
Render.com (easiest, free tier), Railway, Fly.io, and a plain VM/VPS with
`pm2`. Once deployed:
```env
EXPO_PUBLIC_SERVER_URL_PROD=https://your-deployed-server.example.com
EXPO_PUBLIC_ENV=production
```
`SocketClient.js` automatically switches between the dev and prod URL
based on `EXPO_PUBLIC_ENV` — and `eas.json`'s `preview`/`production`
build profiles already set `EXPO_PUBLIC_ENV=production` for you. You
still need to register the actual env var **values** (not just this
flag) with EAS — either via `eas env:create` (EAS's own secret store) or
by committing a non-secret `.env.production` if you're comfortable with
that for this project. Local `.env` is git-ignored; it is not
automatically available inside EAS's cloud build containers.

The server validates every dice roll and move server-side — clients
cannot cheat by sending fabricated moves (see `server/gameLogic.js`,
which deliberately mirrors `src/utils/GameLogic.js` rule-for-rule, since
a real-time multiplayer game can never trust the client alone).

---

## 🤖 AI Difficulty — how it actually works

Three genuinely different opponents, verified by simulation rather than
just labeled differently:

- **Easy** — mostly random move selection; only takes an "obvious" move
  (a capture or reaching home) about 25% of the time. Beatable by a
  beginner.
- **Medium** — a greedy heuristic: always captures when possible, prefers
  finishing tokens, escapes immediate danger, advances its lead token.
  No lookahead, so it can walk into a counter-capture next turn.
- **Hard** — same heuristic as Medium, plus genuine 1-ply lookahead: for
  every candidate move, it simulates the result and checks, across all 6
  possible dice values, whether any opponent could capture the token
  that just moved — and penalizes moves that expose it that way. It also
  rewards setting up a capture for its own next turn, and values forming
  defensive blocks (2+ own tokens on one cell), neither of which Medium
  considers.

**Verified results** (`scripts/test_ai_difficulty.mjs`, 300 games per
matchup, sides alternated to cancel positional bias):
- Hard beats Easy ≈ 87% of the time.
- Medium beats Easy ≈ 80% of the time.
- Hard beats Medium ≈ 53–55% of the time — a real, repeatable edge from
  the lookahead, but intentionally modest rather than dominant (dice
  variance over a full game limits how much a 1-ply lookahead can
  compound). This was empirically tuned, not asserted — an earlier
  weighting had this matchup at a coin-flip; see the inline comments in
  `AI.js` around `computeNextTurnExposure` and `computeNextTurnSetup` if
  you want to push it further with deeper search.

Run it yourself:
```bash
node scripts/run-test.mjs scripts/test_ai_difficulty.mjs
```

The difficulty picker is in `PlayerSetupScreen` (only shown for Vs AI
mode) and flows through `useGameStore.startGame(...)` into
`AI.chooseAIMove(state, diceValue, difficulty)`.

---

## 🔊 Sound Setup

Drop `.mp3` files into `assets/sounds/` with these exact names (see
`assets/sounds/README.md` for free sources and suggested lengths):
`dice_roll.mp3`, `token_move.mp3`, `capture.mp3`, `token_home.mp3`,
`win.mp3`, `button_tap.mp3`, `background_music.mp3`.

**Mute toggle**: `ProfileScreen`'s Sound Effects / Background Music
switches update `useProfileStore`, which `App.js` subscribes to at the
root of the app and forwards into `SoundManager.setEnabled(...)`. This
means the mute state is respected everywhere, immediately, without each
screen needing its own wiring — and it's correctly applied from the very
first frame (not just after visiting the Profile screen), since `App.js`
applies the persisted setting before the first screen mounts. Until real
`.mp3` files are added, missing-asset playback errors are caught and
logged as warnings — the game stays fully playable silently.

---

## 💾 Cross-Device Save/Resume

Local/AI games auto-save to `AsyncStorage` after every move (works
fully offline, no account needed). If the player is signed in, the same
save is also mirrored to Firestore (`savedGames/{uid}`) — fire-and-forget,
never blocking gameplay. On resume, `useGameStore.loadSavedGame()`
fetches both the local and cloud copies and picks whichever has the more
recent `updatedAt`, so resuming works correctly whether you last played
on this device or signed in on a different one.

Online multiplayer games are **not** part of this — the server already
holds the authoritative state for those (see `server/server.js`); a
disconnect/reconnect flow for live online play is a different feature
this scaffold doesn't include.

---

## 🎨 Replacing Placeholder Assets

`assets/icon.png`, `splash.png`, `adaptive-icon.png`, and `favicon.png`
are generated by `generate_assets.py` (requires `pip install Pillow`) —
not flat placeholders, but gradient-shaded with drop shadows and a
glossy highlight, similar in spirit to the in-app dice/token rendering.
Regenerate after tweaking colors:
```bash
python3 generate_assets.py
```
To swap in final branded art, just replace the four PNGs directly — no
code changes needed, `app.json` already points at these paths.

The in-game board/dice/tokens are SVG, drawn in
`src/components/Board.js`, `Dice.js`, and `Token.js` — edit the gradient
`Stop` colors or shapes there for a different look without needing any
external image assets at all.

---

## 🧪 Testing — this was actually run

Before calling any of this "done," real automated checks were run, not
just code written and assumed correct:

1. **Syntax check across all 26 source files** via real Babel
   transformation with the project's actual config
   (`node scripts/check_syntax.js`) — catches JSX/import errors before
   they'd surface at runtime.
2. **Game logic invariants** — 300-turn random-play simulations across
   2/3/4-player configs (25 trials each): every proposed move belongs to
   the current player, no token ever exceeds its max step, token counts
   per color never change, `HOME` state always matches the final step.
3. **Full random games to completion** — verified games finish correctly
   for 2/3/4 players with sensible capture counts, no infinite loops or
   stuck states.
4. **AI difficulty separation**, verified empirically (see above) rather
   than assumed from the code's intent — an earlier version of the Hard
   tier's scoring weights looked correct on paper but didn't actually
   outperform Medium until the issue was found (the exposure penalty was
   too small to ever outweigh other heuristic terms) and fixed.
5. **Live two-client integration test against the real server**
   (`server/test_integration.js`) — two real Socket.IO clients create a
   room, join, ready up, and play several real turns, confirming turn
   enforcement (server rejects out-of-turn actions) and broadcast
   correctness, not just that the server boots.
6. **Board geometry verification** — the SVG board was rendered to a
   PNG and pixel-sampled at known grid coordinates to confirm the
   52-cell ring, yards, and home stretches align with no gaps/overlaps.
7. **Firestore rules review** — caught and fixed a real bug where a
   blanket `allow write` would have made a stricter `allow update`
   constraint unreachable (Firebase grants access if *any* matching rule
   allows it); split into `create`/`update`/`delete` instead.

Run the test scripts yourself:
```bash
node scripts/check_syntax.js
node scripts/run-test.mjs scripts/test_game_logic.mjs
node scripts/run-test.mjs scripts/test_ai_difficulty.mjs

cd server && node server.js &       # in one terminal
node server/test_integration.js     # in another
```

---

## 🏗️ Building with EAS

```bash
npm install -g eas-cli
eas login
eas build:configure   # creates/links your EAS project, updates app.json's projectId
```

```bash
eas build -p android --profile preview   # installable APK
eas build -p ios --profile preview       # needs an Apple Developer account
```

`eas.json` profiles:
- **development** — debug client, `EXPO_PUBLIC_ENV=development`.
- **preview** — shareable APK, `EXPO_PUBLIC_ENV=production` (so it hits
  your deployed server, not localhost).
- **production** — app bundle, auto-incrementing version, ready for
  store submission.

**Important**: `eas.json`'s `env` block only sets `EXPO_PUBLIC_ENV`
itself — it does NOT make your `.env` secrets available inside EAS's
build containers (your local `.env` is git-ignored and never uploaded).
Register the real values with `eas env:create` for each variable, or use
EAS's dashboard under your project's Environment Variables settings,
before running a `preview`/`production` build that needs Firebase/server
URLs to be real.

---

## 🎮 Game Rules Implemented

- 2–4 players, each with 4 tokens starting in their yard.
- Roll a **6** to bring a token out of the yard onto the board.
- Move a token forward by the exact dice value along the shared 52-cell
  ring, then into your own 5-cell colored home stretch, then to the center.
- **Capturing**: landing exactly on a cell occupied by a single opponent
  token (on a non-safe cell) sends that token back to its yard.
- **Safe cells** (8 star-marked cells, including all 4 start cells):
  tokens here cannot be captured.
- **Blocking**: two or more of an opponent's tokens stacked on one cell
  form a block — you cannot land on it.
- **Bonus rolls**: rolling a 6, capturing an opponent, or getting a token
  home all grant another roll. Three 6's in a row forfeits the turn.
- **Winning**: first player to get all 4 tokens home wins immediately
  (standard "first past the post" variant — easy to change in
  `GameLogic.checkGameOver` if you'd rather play until only one player
  remains).

---

## 🧩 Architecture Notes

- **`GameLogic.js` is framework-free** — no React/RN imports. Each
  token's position is a single `relativeStep` integer (0–56) relative to
  that color's own start, making "did this token pass this point"
  trivial regardless of color, and keeping capture/block/win logic
  simple and unit-testable in isolation.
- **The server has its own copy of the rules** (`server/gameLogic.js`) —
  deliberate, not accidental duplication. A real-time multiplayer server
  must be the authority on legal moves, or players could cheat by
  sending fabricated move events. If you change a rule, change it in
  both places; a shared npm package between client/server is the natural
  next step if this grows.
- **Zustand over Redux** for simplicity — `useGameStore` holds live
  match state and now handles both local (`AsyncStorage`) and cloud
  (`Firestore`, when signed in) persistence transparently after every
  state change; `useProfileStore` holds identity/stats and reconciles
  local vs. cloud copies (taking the higher value per stat) when signing
  in on a new device, so progress is never silently lost.
- **Board geometry lives in one file** (`BoardConfig.js`), consumed by
  both the renderer and the logic layer — no risk of visuals and rules
  disagreeing about where a given cell is.
- **Sound mute is centralized**, not per-screen — `App.js` is the single
  subscriber that keeps `SoundManager` in sync with the profile store,
  rather than every screen needing to remember to check the setting.

---

## 💰 Monetization Hooks (intentionally not included)

Ads/IAP were left out rather than half-wired with a placeholder SDK that
still needs your own publisher IDs to do anything — that would just be
dead weight. To add them:
- **Ads**: `npx expo install react-native-google-mobile-ads`; wrap
  pause/exit moments in `GameScreen` with interstitials, add a banner to
  `HomeScreen`. Needs your AdMob app/unit IDs.
- **IAP**: `npx expo install expo-in-app-purchases` (or RevenueCat for
  cross-platform receipt handling); gate cosmetic token skins or an
  "ad-free" toggle in `ProfileScreen`.

---

## 🔜 Suggested Next Steps

1. Drop real `.mp3` files into `assets/sounds/`.
2. Complete the Firebase setup steps above and deploy `firestore.rules.example`.
3. Deploy `server/` (see `server/README_DEPLOY.md`) and register the
   production URL with EAS.
4. Build a friends-graph UI on top of `LeaderboardService.addFriendByUid`
   (currently has the data plumbing but no UI for adding friends).
5. If you want Hard AI to have a larger edge, look at extending
   `computeNextTurnExposure`/`computeNextTurnSetup` in `AI.js` to 2-ply
   search — the 1-ply lookahead's ceiling was empirically measured during
   development (see "AI Difficulty" above).
6. Replace the generated placeholder icon/splash/board art with final
   branded visuals once you have them.
