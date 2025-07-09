import { prisma } from '../database';
import { Message } from '../models/message';

export interface IMessageRepository {
  create(senderId: number, recipientId: number, content: string): Promise<Message>;
  findConversation(userId1: number, userId2: number): Promise<Message[]>;
  findById(id: number): Promise<Message | null>;
  delete(id: number): Promise<void>;
  markAsRead(recipientId: number, senderId: number): Promise<void>;
  
}

export class PrismaMessageRepository implements IMessageRepository {
  async create(senderId: number, recipientId: number, content: string): Promise<Message> {
    return prisma.message.create({
      data: {
        content: content,
        sender: {
          connect: { id: senderId }
        },
        recipient: {
          connect: { id: recipientId }
        }
      }
    });
  }

  async findConversation(userId1: number, userId2: number): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, recipientId: userId2 },
          { senderId: userId2, recipientId: userId1 },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: number): Promise<Message | null> {
    return prisma.message.findUnique({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await prisma.message.delete({ where: { id } });
  }

  async markAsRead(recipientId: number, senderId: number): Promise<void> {
    await prisma.message.updateMany({
      where: {
        recipientId: recipientId,
        senderId: senderId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}