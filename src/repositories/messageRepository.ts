import { prisma } from '../database';
import { Message } from '../models/message';

export interface IMessageRepository {
  create(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  findConversation(userId1: number, userId2: number): Promise<Message[]>;
}

export class PrismaMessageRepository implements IMessageRepository {
  async create(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    return prisma.message.create({ data });
  }

  async findConversation(userId1: number, userId2: number): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, recipientId: userId2 },
          { senderId: userId2, recipientId: userId1 },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}