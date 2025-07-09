import { Router, Request, Response, NextFunction } from 'express';
import { MessageController } from '../controllers/messageController';
import { IMessageRepository } from '../repositories/messageRepository';
import { authMiddleware } from '../middleware/authMiddleware';

export function createMessageRoutes(messageRepository: IMessageRepository) {
  const router = Router();
  const messageController = new MessageController(messageRepository);

  router.use(authMiddleware);
  router.get('/conversation/:otherUserId', (req, res, next) => {
    messageController.getConversation(req, res).catch(next);
  });
  router.delete('/:id', (req, res, next) => {
    messageController.deleteMessage(req, res).catch(next);
  });
  router.post('/conversation/:partnerId/read', (req, res, next) => {
    messageController.markAsRead(req, res).catch(next);
  });

  return router;
}