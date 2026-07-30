# Chess

Real-time chess web app. Play vs Stockfish inside Telegram Mini App.

## Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: Vite + React
- **Engine**: Stockfish (UCI via `child_process`)
- **Telegram**: `@telegram-apps/sdk` (theme, initData auth)

## Commands

| command | description |
|---|---|
| `npm run dev` | server (--watch) + client (Vite) |
| `npm start` | server only |
| `npm run dev:server` | server only (--watch) |
| `npm run dev:client` | client only (Vite) |

## Structure

```
server/
  src/
    engine/       — Stockfish UCI wrapper
    game/         — GameRoom, GameManager, chess clocks
    telegram/     — initData HMAC verification
    ws/           — Socket.IO event handlers
    index.js      — entrypoint (Express + Socket.IO)
client/
  src/
    components/   — Board, ClockDisplay, GameInfo, etc.
    lib/          — chess.js wrapper, socket helper, time utils
    App.jsx       — root component
    main.jsx      — entrypoint
```

## Features

- Play vs Stockfish (Easy / Medium / Hard)
- Time controls: Bullet, Blitz, Rapid, Classic (with increment)
- Chess clocks (100ms tick, auto-start, increment on move)
- Undo move (preserves move history)
- Telegram Mini App theme colors (fallbacks in browser)
- Board flip when playing black
- Legal move highlight (dot for empty squares, red outline for captures)

## Telegram setup

1. Start a tunnel: `npx ngrok http 5173` or `npx localtunnel --port 5173`
2. [@BotFather](https://t.me/BotFather) → `/mybots` → your bot → Bot Settings → Menu Button → set tunnel URL
3. `TELEGRAM_BOT_TOKEN` in `server/.env` (optional — auth middleware skips when empty)

## Status

Working prototype.
