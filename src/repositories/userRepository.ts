import sqlite3 from 'sqlite3';
import { User } from '../models/user';

export interface IUserRepository {
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];
  private currentId = 1;

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      id: this.currentId++,
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      publicKey: data.publicKey,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email);
    return user || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = this.users.find(u => u.username === username);
    return user || null;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }
}

export class SqliteUserRepository implements IUserRepository {
  constructor(private db: sqlite3.Database) {}

  public initDb(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        publicKey TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `;
    this.db.run(sql, (err) => {
      if (err) {
        console.error('Error creating users table', err);
      }
    });
  }

  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO users (username, email, passwordHash, publicKey, createdAt) VALUES (?, ?, ?, ?, ?)`;
      const createdAt = new Date().toISOString();
      
      this.db.run(sql, [data.username, data.email, data.passwordHash, data.publicKey, createdAt], function (err) {
        if (err) {
          reject(err);
        } else {
          const newUser: User = {
            id: this.lastID,
            createdAt: new Date(createdAt),
            ...data,
          };
          resolve(newUser);
        }
      });
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`;
      this.db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? (row as User) : null);
        }
      });
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE username = ?`;
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? (row as User) : null);
        }
      });
    });
  }

  findAll(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, username, email, publicKey, createdAt FROM users`;
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as User[]);
        }
      });
    });
  }
}