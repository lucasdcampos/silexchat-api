import { Request, Response } from 'express';
import { IMessageRepository } from '../repositories/messageRepository';

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
}