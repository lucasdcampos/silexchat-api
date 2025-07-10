import { Chat } from '@prisma/client';
import { prisma } from '../database';
import { nanoid } from 'nanoid';

export interface IChatRepository {
  findOrCreateDM(userId1: number, userId2: number): Promise<Chat>;
  createGroup(ownerId: number, name: string, avatarUrl?: string): Promise<Chat>;
  findChatsByUserId(userId: number): Promise<any[]>;
  joinWithInviteCode(userId: number, inviteCode: string): Promise<Chat | null>;
  leave(userId: number, chatId: number): Promise<void>;
  hideChat(userId: number, chatId: number): Promise<void>;
  isUserParticipant(userId: number, chatId: number): Promise<boolean>;
}

export class ChatRepository implements IChatRepository {
  async findOrCreateDM(userId1: number, userId2: number): Promise<Chat> {
    const existingChat = await prisma.chat.findFirst({
      where: {
        type: 'DM',
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
    });

    if (existingChat) {
      await this.unhideChat(userId1, existingChat.id);
      return existingChat;
    }

    return prisma.chat.create({
      data: {
        type: 'DM',
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
    });
  }

  async createGroup(ownerId: number, name: string, avatarUrl?: string): Promise<Chat> {
    return prisma.chat.create({
      data: {
        type: 'GROUP',
        name,
        avatarUrl,
        inviteCode: nanoid(8),
        ownerId,
        participants: {
          create: { userId: ownerId },
        },
      },
    });
  }

  async findChatsByUserId(userId: number): Promise<any[]> {
    return prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
            isHidden: false,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true, status: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async joinWithInviteCode(userId: number, inviteCode: string): Promise<Chat | null> {
    const chat = await prisma.chat.findUnique({ where: { inviteCode } });
    if (!chat) return null;

    await prisma.chatParticipant.upsert({
      where: { userId_chatId: { userId, chatId: chat.id } },
      create: { userId, chatId: chat.id },
      update: { isHidden: false },
    });
    return chat;
  }

  async leave(userId: number, chatId: number): Promise<void> {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (chat?.ownerId === userId) {
      throw new Error('Owner cannot leave the group. Must delete it instead.');
    }
    await prisma.chatParticipant.delete({
      where: { userId_chatId: { userId, chatId } },
    });
  }

  async hideChat(userId: number, chatId: number): Promise<void> {
    await prisma.chatParticipant.update({
      where: { userId_chatId: { userId, chatId } },
      data: { isHidden: true },
    });
  }

  async unhideChat(userId: number, chatId: number): Promise<void> {
    await prisma.chatParticipant.updateMany({
        where: { userId: userId, chatId: chatId },
        data: { isHidden: false }
    });
  }

  async isUserParticipant(userId: number, chatId: number): Promise<boolean> {
    const participant = await prisma.chatParticipant.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });
    return !!participant;
  }
}