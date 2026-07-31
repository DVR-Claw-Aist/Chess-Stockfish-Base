<div align="center">

[English](README.md) · [Русский](README_RU.md)

# Chess + Stockfish

**Играй против Stockfish прямо в Telegram Mini App.**

[Демо](#живое-демо) · [Возможности](#возможности) · [Архитектура](#архитектура) · [Установка](#установка) · [Дорожная карта](#дорожная-карта)

[![License: GPL-3.0](https://img.shields.io/github/license/DVR-Claw-Aist/Chess-Stockfish-Base)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)
![Telegram Mini App](https://img.shields.io/badge/Telegram%20Mini%20App-2CA5E0?logo=telegram&logoColor=white)

</div>

![demo](screenshots/demo.gif)

## Почему этот проект?

> Создан для изучения WebSocket-архитектуры, серверной логики шахмат и интеграции Telegram Mini Apps.

## Живое демо

Приложение работает как [Telegram Mini App](https://core.telegram.org/bots/webapps). Чтобы попробовать:

1. Запусти туннель: `npx ngrok http 5173`
2. [@BotFather](https://t.me/BotFather) → твой бот → Bot Settings → Menu Button → вставь URL туннеля
3. Открой бота в Telegram и нажми кнопку меню

## Скриншоты

| | |
|---|---|
| ![start](screenshots/01_start.png) | ![game](screenshots/02_game.png) |
| ![check](screenshots/03_shah.png) | ![timeout](screenshots/04_time_of.png) |
| ![mate](screenshots/05_mate.png) | |

## Возможности

- Игра против Stockfish со сложностью **Easy / Medium / Hard**
- Таймконтроль: **Bullet** (1+0), **Blitz** (3+0), **Rapid** (5+3), **Classic** (15+10)
- Шахматные часы (тик сервера 100 мс, инкремент на каждом ходу)
- **Отмена хода** (undo, сохраняет полную историю)
- Подсветка легальных ходов — белые точки на пустых клетках, красная рамка для взятий
- Переворот доски при игре за чёрных
- Звуковые эффекты (move, capture, check, checkmate) с переключателем on/off
- Тема Telegram Mini App (адаптируется под цветовую схему Telegram)
- Визуальная индикация шаха и мата (подсветка клетки короля)

## Архитектура

```
┌─ Client (Vite + React) ──────────────────────┐
│  Board, ClockDisplay, GameInfo, MoveHistory   │
│  socket.io-client  ⇄  websocket               │
└───────────────────────────────────────────────┘
                      ↕
┌─ Server (Node.js + Express + Socket.IO) ──────┐
│  GameRoom (chess.js state + clocks + timer)   │
│  StockfishEngine (UCI via child_process)      │
│  Telegram initData HMAC auth middleware        │
└───────────────────────────────────────────────┘
```

- **chess.js на сервере** — единый источник истины для всей валидации и игровой логики.
- **chess.js на клиенте** используется только для отображения легальных ходов и отрисовки доски.
- **Stockfish** работает как дочерний процесс на каждую игру, ограниченный `MAX_ENGINES` (по умолчанию 4). Общение через UCI-протокол по stdin/stdout.
- **Часы** уменьшаются на сервере каждые 100 мс и рассылаются клиенту.

## Технологический стек

| Слой | Технология |
|---|---|
| Backend | Node.js, Express, Socket.IO, chess.js |
| Frontend | Vite, React, socket.io-client, chess.js, @telegram-apps/sdk |
| Engine | Stockfish (UCI, per-game child_process) |
| Auth | Telegram initData HMAC-SHA256 (опционально, скипается без TELEGRAM_BOT_TOKEN) |

## Как это работает

1. Игрок выбирает **цвет**, **сложность** и **таймконтроль** → нажимает *Start Game*.
2. Сервер создаёт `GameRoom` со свежим экземпляром `chess.js` и запускает процесс Stockfish.
3. Если ход Stockfish — сервер отправляет текущий FEN через UCI, парсит `bestmove` и применяет его.
4. Ходы игрока и Stockfish валидируются на сервере и рассылаются клиенту через Socket.IO.
5. Серверный интервал (100 мс) уменьшает активные часы, добавляет инкремент после каждого хода и шлёт события `time_update`.
6. При тайм-ауте, мате или ничьей игра заканчивается — таймер подсвечивается красным.

## Установка

Клонируй репозиторий и установи зависимости:

```bash
git clone https://github.com/DVR-Claw-Aist/Chess-Stockfish-Base.git
cd Chess-Stockfish-Base
npm install
```

Положи бинарник Stockfish в `server/bin/stockfish/stockfish-windows-x86-64-sse41-popcnt.exe` (или укажи свой путь в `stockfish.js`).

Создай `server/.env` (копия из `server/.env.example`):

```
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
TELEGRAM_BOT_TOKEN=your_bot_token  # optional — auth is skipped if empty
MAX_ENGINES=4                      # max concurrent Stockfish processes
```

Запусти сервер и клиент:

```bash
npm run dev
```

| Команда | Описание |
|---|---|
| `npm run dev` | Сервер + клиент (concurrently) |
| `npm start` | Только сервер |
| `npm run dev:server` | Только сервер (--watch) |
| `npm run dev:client` | Только клиент (Vite) |
| `npm test --workspace=server` | Смоук-тест движка (нужен бинарник Stockfish) |

## Тесты

`server/test/engine.test.mjs` запускает процесс Stockfish и запрашивает лучший ход из стартовой позиции. Требуется бинарник в `server/bin/stockfish/` (см. Установку).

## Дорожная карта

- [ ] Панель оценки позиции
- [ ] Список ходов в стандартной алгебраической нотации
- [ ] Экспорт / импорт PGN
- [ ] Предложение ничьей и сдача партии
- [ ] Мультиплеер (человек против человека)
- [ ] i18n (EN / RU)

## Лицензия

Распространяется под лицензией [GNU General Public License v3.0](LICENSE).

Встроенный движок [Stockfish](server/bin/stockfish/) распространяется под лицензией GPL-3.0 (см. `server/bin/stockfish/Copying.txt`).
