import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';
import { verifyInitData } from './telegram/verify.js';
import { registerHandlers } from './ws/handlers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.use((socket, next) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return next();
  const initData = socket.handshake.auth?.initData;
  if (!initData || !verifyInitData(initData, token)) {
    return next(new Error('unauthorized'));
  }
  next();
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

registerHandlers(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
