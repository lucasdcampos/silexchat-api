import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';

import { createUserRoutes } from './routes/userRoutes';
import { createMessageRoutes } from './routes/messageRoutes';
import { SqliteUserRepository } from './repositories/userRepository';
import { SqliteMessageRepository } from './repositories/messageRepository';
import rootRoutes from './routes/rootRoutes';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be defined in .env file');
}

const DB_SOURCE = 'silex.db';
const db = new sqlite3.Database(DB_SOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }
  console.log('Connected to the SQLite database.');
});

const userRepository = new SqliteUserRepository(db);
const messageRepository = new SqliteMessageRepository(db);

userRepository.initDb();
messageRepository.initDb();

app.use(cors());
app.use(bodyParser.json());

const userSocketMap = new Map<number, string>();

interface AuthenticatedUser {
  id: number;
  username: string;
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: Token not provided.'));
  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    (socket as any).user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token.'));
  }
});

io.on('connection', (socket) => {
  const connectedUser = (socket as any).user as AuthenticatedUser;
  console.log(`Client authenticated: ${connectedUser.username} (${socket.id})`);
  userSocketMap.set(connectedUser.id, socket.id);

  socket.on('privateMessage', async ({ recipientId, content }) => {
    const senderId = connectedUser.id;
    const newMessage = await messageRepository.create({ senderId, recipientId, content });
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('privateMessage', {
        senderId: senderId,
        content: content,
        createdAt: newMessage.createdAt.toISOString(),
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${connectedUser.username}`);
    userSocketMap.delete(connectedUser.id);
  });
});

app.use('/', rootRoutes);
app.use('/api/users', createUserRoutes(userRepository)); 
app.use('/api/messages', createMessageRoutes(messageRepository));

server.listen(PORT, () => {
  console.log(`Silex server running on port ${PORT}`);
});
