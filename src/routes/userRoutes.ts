import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { IUserRepository } from '../repositories/userRepository';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils';

export function createUserRoutes(userRepository: IUserRepository) {
  const router = Router();
  const userController = new UserController(userRepository);

  router.post('/register', asyncHandler(userController.register.bind(userController)));
  router.post('/login', asyncHandler(userController.login.bind(userController)));
  router.get('/users', asyncHandler(userController.getAllUsers.bind(userController)));
  router.get('/conversations', authMiddleware, asyncHandler(userController.getConversations.bind(userController)));
  router.delete('/conversations/:partnerId', authMiddleware, asyncHandler(userController.hideConversation.bind(userController)));
  router.patch('/me', authMiddleware, asyncHandler(userController.updateProfile.bind(userController)));
  router.get('/:id', authMiddleware, asyncHandler(userController.getUserById.bind(userController)));

  return router;
}