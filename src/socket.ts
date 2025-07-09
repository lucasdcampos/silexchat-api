import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { messageRepository, userRepository } from './database';

interface AuthenticatedUser {
  id: number;
  username: string;
}

const userSocketMap = new Map<number, string>();

function setupAuthMiddleware(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }
    try {
      const decoded = jwt.verify(token, config.jwtSecret!) as AuthenticatedUser;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token.'));
    }
  });
}

function setupConnectionEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    const connectedUser = (socket as any).user as AuthenticatedUser;
    userSocketMap.set(connectedUser.id, socket.id);

    socket.on('privateMessage', async ({ recipientId, content }) => {
      const senderId = connectedUser.id;
      
      await userRepository.unhideConversation(senderId, recipientId);
      await userRepository.unhideConversation(recipientId, senderId);
      const newMessage = await messageRepository.create({ senderId, recipientId, content });
      
      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('privateMessage', {
          ...newMessage,
          sender: { id: senderId, username: connectedUser.username },
        });
      }
    });

    socket.on('disconnect', () => {
      userSocketMap.delete(connectedUser.id);
    });
  });
}

export function setupSocketIO(io: Server) {
  setupAuthMiddleware(io);
  setupConnectionEvents(io);
}