import { Message } from '../models/message';
import sqlite3 from 'sqlite3';

export interface IMessageRepository {
  create(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  findConversation(userId1: number, userId2: number): Promise<Message[]>;
}

export class InMemoryMessageRepository implements IMessageRepository {
  private messages: Message[] = [];
  private currentId = 1;

  async create(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const newMessage: Message = {
      id: this.currentId++,
      senderId: data.senderId,
      recipientId: data.recipientId,
      content: data.content,
      createdAt: new Date(),
    };
    this.messages.push(newMessage);
    console.log(`Message saved: from ${data.senderId} to ${data.recipientId}`);
    return newMessage;
  }

  async findConversation(userId1: number, userId2: number): Promise<Message[]> {
    const conversation = this.messages.filter(
      (msg) =>
        (msg.senderId === userId1 && msg.recipientId === userId2) ||
        (msg.senderId === userId2 && msg.recipientId === userId1)
    );
    // Sort messages chronologically
    return conversation.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export class SqliteMessageRepository implements IMessageRepository {
  private db: sqlite3.Database;

  constructor(db: sqlite3.Database) {
    this.db = db;
  }

  public initDb(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        recipientId INTEGER NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `;
    this.db.run(sql, (err) => {
      if (err) {
        console.error('Error creating messages table', err);
      }
    });
  }

  create(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO messages (senderId, recipientId, content, createdAt) VALUES (?, ?, ?, ?)`;
      const createdAt = new Date().toISOString();
      
      const self = this;
      this.db.run(sql, [data.senderId, data.recipientId, data.content, createdAt], function (err) {
        if (err) {
          reject(err);
        } else {
          const newMessage: Message = {
            id: this.lastID,
            ...data,
            createdAt: new Date(createdAt),
          };
          resolve(newMessage);
        }
      });
    });
  }

  findConversation(userId1: number, userId2: number): Promise<Message[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM messages 
        WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?)
        ORDER BY createdAt ASC
      `;
      this.db.all(sql, [userId1, userId2, userId2, userId1], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const messages = rows.map((row: any) => ({
            ...row,
            createdAt: new Date(row.createdAt)
          }));
          resolve(messages as Message[]);
        }
      });
    });
  }
}