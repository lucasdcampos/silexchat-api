import { User } from '../models/user';
import { prisma } from '../database';

export type PublicUser = Omit<User, 'passwordHash'>;

export interface IUserRepository {
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAll(): Promise<PublicUser[]>;
  findConversationPartners(userId: number): Promise<User[]>;
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

  async findAll(): Promise<PublicUser[]> {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        publicKey: true,
        createdAt: true,
      }
    });
  }

  async findConversationPartners(userId: number): Promise<User[]> {
    const partners = await prisma.$queryRaw<User[]>`
      SELECT
          u.id,
          u.username,
          u.email,
          u."publicKey",
          u."createdAt"
      FROM
          "Message" m
      JOIN
          "User" u ON u.id = CASE WHEN m."senderId" = ${userId} THEN m."recipientId" ELSE m."senderId" END
      WHERE
          m."senderId" = ${userId} OR m."recipientId" = ${userId}
      GROUP BY
          u.id
      ORDER BY
          MAX(m."createdAt") DESC
    `;
    return partners;
  }
}