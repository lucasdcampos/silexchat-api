import { Request, Response } from 'express';
import { IMessageRepository } from '../repositories/messageRepository';
import { Server } from 'socket.io';

export class MessageController {
  constructor(private messageRepository: IMessageRepository) {}

  public getConversation = async (req: Request, res: Response): Promise<Response> => {
    try {
      const currentUserId = (req as any).user.id;
      const otherUserId = parseInt(req.params.otherUserId, 10);

      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
      }

      const messages = await this.messageRepository.findConversation(currentUserId, otherUserId);
      return res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  public deleteMessage = async (req: Request, res: Response): Promise<Response> => {
    try {
      const io = req.app.get('io') as Server;
      const userSocketMap = req.app.get('userSocketMap') as Map<number, string>;
      const userId = (req as any).user.id;
      const messageId = parseInt(req.params.id, 10);

      const message = await this.messageRepository.findById(messageId);

      if (!message) {
        return res.status(404).json({ message: 'Message not found.' });
      }

      if (message.senderId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own messages.' });
      }

      await this.messageRepository.delete(messageId);

      const partnerId = message.recipientId;
      const partnerSocketId = userSocketMap.get(partnerId);
      if (partnerSocketId) {
        io.to(partnerSocketId).emit('messageDeleted', { messageId });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  public markAsRead = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const partnerId = parseInt(req.params.partnerId, 10);

      await this.messageRepository.markAsRead(userId, partnerId);
      return res.status(204).send();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
}