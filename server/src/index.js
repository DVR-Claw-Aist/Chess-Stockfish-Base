import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';
import { verifyInitData } from './telegram/verify.js';
import { registerHandlers } from './ws/handlers.js';

config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
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

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

registerHandlers(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
