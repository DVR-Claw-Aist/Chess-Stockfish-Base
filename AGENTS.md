# AGENTS.md — Chess App

Общение на "ты", по-русски.

Real-time chess web app. Backend: Node.js (Express + Socket.IO). Stockfish via UCI child_process. Frontend: Vite + React. Telegram Mini App.

## Project structure

```
server/               — Node.js backend
  src/
    engine/           — Stockfish UCI wrapper (child_process)
    game/             — Game state, rooms, match logic
    telegram/         — Telegram initData HMAC verification
    ws/               — Socket.IO event handlers
    index.js          — Entrypoint: Express + Socket.IO
  .env                — PORT, CLIENT_ORIGIN, TELEGRAM_BOT_TOKEN
client/               — Vite + React frontend
  src/
    components/       — UI components
    hooks/            — Custom React hooks
    lib/              — chess.js wrapper, socket helpers, time utils
    App.jsx           — Root component (socket.io init)
    main.jsx          — Entrypoint
  vite.config.js      — Proxy /socket.io → localhost:3000
```

## Commands

| command             | description                        |
|---------------------|------------------------------------|
| `npm run dev`       | server (--watch) + client (Vite)   |
| `npm start`         | server only                        |
| `npm run dev:server`| server only (--watch)              |
| `npm run dev:client`| client only (Vite)                 |

## Conventions

- ES modules (`"type": "module"`)
- Stockfish runs as a child process per game (UCI protocol via stdin/stdout)
- Telegram `initData` **must** be verified server-side via HMAC-SHA256 + bot token

## Stockfish engine

- Binary: `server/bin/stockfish/stockfish-windows-x86-64-sse41-popcnt.exe`
- Wrapper: `server/src/engine/stockfish.js` (UCI via `child_process` + `readline`)
- API: `start()` → `getBestMove(fen, { depth })` → `quit()`
- Test: `node src/engine/test.mjs`

## Current status

- Backend scaffolded, Express + Socket.IO running on port 3000
- `GET /health` returns `{"status":"ok"}`
- Client scaffolded (Vite + React, socket.io-client, chess.js, @telegram-apps/sdk)
- Stockfish UCI wrapper done, not yet integrated with game/socket layer
- Game manager — implemented (GameRoom + GameManager)
- Telegram initData verification — implemented (Socket.IO middleware, skips when token empty)
- Socket.IO handlers — `join_game`, `make_move`, `start_game`, auto Stockfish response
- Chess clocks — time presets (bullet/blitz/rapid/classic), 100ms tick, increment
- Player color selection — play as white or black, board flips accordingly
