# Deploying the Ludo Royale Multiplayer Server

This server (`server/server.js`) needs to run somewhere with a stable,
public URL for online multiplayer to work outside of local dev. Below are
three solid options, easiest first.

---

## Option A — Render.com (easiest, free tier available)

1. Push this project to a GitHub repo (the whole `ludo-game` folder, or
   just `server/` — either works, see step 3).
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Point it at your repo. Render will detect `render.yaml` at the repo
   root automatically and configure everything (Docker build, health
   check, port) — just confirm and deploy.
   - If you'd rather configure manually: **New > Web Service**, select
     **Docker** as the runtime, set **Root Directory** to `server`.
4. Wait for the build to finish. Render gives you a URL like
   `https://ludo-royale-server.onrender.com`.
5. Put that URL into your `.env`:
   ```
   EXPO_PUBLIC_SERVER_URL_PROD=https://ludo-royale-server.onrender.com
   EXPO_PUBLIC_ENV=production
   ```

**Free tier note**: Render's free web services spin down after ~15
minutes of inactivity and take 30-60s to wake on the next request. The
client's socket timeout is set to 10s (see `SocketClient.js`) — on a cold
start the first connection attempt may fail and need a retry. Fine for
testing/demos; upgrade to a paid instance for production.

---

## Option B — Railway.app

1. [railway.app](https://railway.app) → **New Project** → **Deploy from
   GitHub repo**.
2. Set the **root directory** to `server` in the service settings.
3. Railway auto-detects the `Dockerfile` and builds it. If it instead
   tries to use Nixpacks, that's fine too — it'll find `package.json`
   and run `npm start`.
4. Under **Variables**, no extra env vars are required (PORT is
   injected automatically by Railway and `server.js` already reads
   `process.env.PORT`).
5. Generate a public domain under **Settings > Networking > Generate
   Domain**. Use that URL in `.env` as shown above.

---

## Option C — Fly.io

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. `cd server && fly launch` — it'll detect the Dockerfile and ask a few
   questions (app name, region). Decline the Postgres/Redis prompts,
   this server doesn't need them.
3. `fly deploy`
4. Your URL will be `https://<app-name>.fly.dev`. Add it to `.env`.

---

## Option D — Your own VM / VPS

```bash
# On the server:
git clone <your-repo>
cd ludo-game/server
npm install --omit=dev
PORT=3001 node server.js
# Better: run it under pm2 or systemd so it survives reboots/crashes:
npm install -g pm2
pm2 start server.js --name ludo-server
pm2 save
```

Put a reverse proxy (nginx, Caddy) in front for HTTPS/WSS if you want
the client to connect over `wss://` rather than plain `ws://` — most
app stores and some networks are stricter about insecure WebSocket
connections in production.

---

## After deploying: scaling notes

The current server keeps all room/game state **in memory** (a single
`Map`). This is intentionally simple and fine for:
- Demos, playtesting, small-to-medium concurrent player counts on a
  single instance.

It will **not** survive:
- A server restart (all active games are lost — players would need to
  start a new room).
- Multiple instances behind a load balancer (player A's room would only
  exist on whichever instance they connected to; player B connecting to
  a different instance couldn't find it).

If you need either of those, the next step is moving room state into
Redis (or another shared store) and using the
[`socket.io-redis` adapter](https://socket.io/docs/v4/redis-adapter/) so
multiple server instances can share room/event state. That's a bigger
change than this scaffold covers, but the room/game logic in
`gameLogic.js` is already pure-function-based and would port over with
minimal changes — only `server.js`'s in-memory `rooms` Map would need to
become Redis-backed.
