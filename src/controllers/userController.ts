import { Request, Response } from 'express';
import { IUserRepository } from '../repositories/userRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class UserController {
  constructor(private userRepository: IUserRepository) {}

  public register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { username, email, password, publicKey, avatarUrl} = req.body;

      if (!username || !email || !password || !publicKey) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      const existingUserByUsername = await this.userRepository.findByUsername(username);
      if (existingUserByUsername) {
        return res.status(409).json({ message: 'Username already being used.' });
      }
      const existingUserByEmail = await this.userRepository.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({ message: 'Email already being used.' });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = await this.userRepository.create({
        username,
        email,
        passwordHash,
        publicKey,
        avatarUrl
      });

      console.log('New user registered:', { id: newUser.id, username: newUser.username, email: newUser.email });
      
      return res.status(201).json({ 
        message: 'User registered successfully.',
        user: { id: newUser.id, username: newUser.username }
      });

    } catch (error) {
      console.error('Error during registration:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  public login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        throw new Error('JWT_SECRET must be defined in .env file');
      }

      const tokenPayload = { 
        id: user.id, 
        username: user.username, 
        avatarUrl: user.avatarUrl 
      };

      const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
      jwt.verify(token, jwtSecret);
      
      return res.status(200).json({ message: 'Login successful.', token });

    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  public getAllUsers = async (req: Request, res: Response): Promise<Response> => {
    const users = await this.userRepository.findAll();
    const userList = users.map(u => ({ 
      id: u.id, 
      username: u.username, 
      email: u.email, 
      publicKey: u.publicKey, 
      createdAt: u.createdAt 
    }));
    return res.json(userList);
  }

  public getConversations = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const partners = await this.userRepository.findConversationPartners(userId);
      return res.status(200).json(partners);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  public hideConversation = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const partnerId = parseInt(req.params.partnerId, 10);

      if (isNaN(partnerId)) {
        return res.status(400).json({ message: 'Invalid partner ID.' });
      }

      await this.userRepository.hideConversation(userId, partnerId);
      return res.status(204).send();
    } catch (error) {
      console.error('Error hiding conversation:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  public updateProfile = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user.id;
      const { username, avatarUrl } = req.body;

      if (!username && !avatarUrl) {
        return res.status(400).json({ message: 'At least one field (username or avatarUrl) must be provided.' });
      }

      if (username) {
        const existingUser = await this.userRepository.findByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: 'This username is already taken.' });
        }
      }

      const updatedUser = await this.userRepository.update(userId, { username, avatarUrl });

      const jwtSecret = process.env.JWT_SECRET || 'your-default-secret';
      const tokenPayload = { 
        id: updatedUser.id, 
        username: updatedUser.username, 
        avatarUrl: updatedUser.avatarUrl 
      };
      const newToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });

      return res.status(200).json({
        message: 'Profile updated successfully.',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          avatarUrl: updatedUser.avatarUrl,
        },
        token: newToken,
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
}