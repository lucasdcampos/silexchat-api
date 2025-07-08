import { Router, Request, Response, NextFunction } from 'express';
import { MessageController } from '../controllers/messageController';
import { IMessageRepository, InMemoryMessageRepository } from '../repositories/messageRepository';
import { authMiddleware } from '../middleware/authMiddleware';

export function createMessageRoutes(messageRepository: IMessageRepository) {
  const router = Router();
  const messageController = new MessageController(messageRepository);

  router.use(authMiddleware);
  router.get('/conversation/:otherUserId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await messageController.getConversation(req, res);
    } catch (err) {
      next(err);
    }
  });

  return router;
}