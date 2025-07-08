export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  publicKey: string;
  createdAt: Date;
}