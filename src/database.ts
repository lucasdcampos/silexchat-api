import sqlite3 from 'sqlite3';
import { config } from './config';
import { SqliteUserRepository } from './repositories/userRepository';
import { SqliteMessageRepository } from './repositories/messageRepository';

const db = new sqlite3.Database(config.dbSource, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }
  console.log('Connected to the SQLite database.');
});

export const userRepository = new SqliteUserRepository(db);
export const messageRepository = new SqliteMessageRepository(db);

userRepository.initDb();
messageRepository.initDb();