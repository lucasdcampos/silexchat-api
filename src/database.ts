import { PrismaUserRepository } from './repositories/userRepository';
import { PrismaMessageRepository } from './repositories/messageRepository';
import { PrismaClient } from '@prisma/client';

console.log("Initializing Prisma Client");
export const prisma = new PrismaClient();

export const userRepository = new PrismaUserRepository();
export const messageRepository = new PrismaMessageRepository();