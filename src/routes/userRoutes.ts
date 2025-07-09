import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { IUserRepository } from '../repositories/userRepository';
import { authMiddleware } from '../middleware/authMiddleware';

export function createUserRoutes(userRepository: IUserRepository) {
  const router = Router();
  const userController = new UserController(userRepository);

  // Helper to wrap async route handlers and forward errors to Express error handler
  function asyncHandler(fn: any) {
    return function (req: any, res: any, next: any) {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  router.post('/register', asyncHandler(userController.register.bind(userController)));
  router.post('/login', asyncHandler(userController.login.bind(userController)));
  router.get('/users', asyncHandler(userController.getAllUsers.bind(userController)));
  router.get('/conversations', authMiddleware, asyncHandler(userController.getConversations.bind(userController)));
  router.delete('/conversations/:partnerId', authMiddleware, asyncHandler(userController.hideConversation.bind(userController)));
  
  return router;
}