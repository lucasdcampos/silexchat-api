import { User } from '../models/user';
import { prisma } from '../database';

export type PublicUser = Omit<User, 'passwordHash'>;

export interface IUserRepository {
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findAll(): Promise<PublicUser[]>;
  findConversationPartners(userId: number): Promise<User[]>;
  hideConversation(userId: number, partnerId: number): Promise<void>;
  unhideConversation(userId: number, partnerId: number): Promise<void>
  update(id: number, data: { username?: string; avatarUrl?: string }): Promise<User>;
}

export class PrismaUserRepository implements IUserRepository {
  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async update(id: number, data: { username?: string; avatarUrl?: string }): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async findAll(): Promise<PublicUser[]> {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        publicKey: true,
        createdAt: true,
        avatarUrl: true,
      }
    });
  }

  async hideConversation(userId: number, partnerId: number): Promise<void> {
    await prisma.hiddenConversation.upsert({
      where: { hidingUserId_partnerId: { hidingUserId: userId, partnerId } },
      create: { hidingUserId: userId, partnerId },
      update: {},
    });
  }

  async unhideConversation(userId: number, partnerId: number): Promise<void> {
    await prisma.hiddenConversation.deleteMany({
      where: { hidingUserId: userId, partnerId: partnerId },
    });
  }

  async findConversationPartners(userId: number): Promise<any[]> { 
    const partners = await prisma.$queryRaw<any[]>`
      SELECT
          u.id,
          u.username,
          u."avatarUrl",
          CAST(COUNT(CASE WHEN m."recipientId" = ${userId} AND m."isRead" = false THEN 1 END) AS INTEGER) as "unreadCount"
      FROM
          "User" u
      JOIN
          "Message" m ON u.id = CASE WHEN m."senderId" = ${userId} THEN m."recipientId" ELSE m."senderId" END
      LEFT JOIN
          "HiddenConversation" hc ON hc."hidingUserId" = ${userId} AND hc."partnerId" = u.id
      WHERE
          (m."senderId" = ${userId} OR m."recipientId" = ${userId}) AND hc."hidingUserId" IS NULL
      GROUP BY
          u.id
      ORDER BY
          MAX(m."createdAt") DESC
    `;
    return partners;
  }
}