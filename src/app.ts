import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rootRoutes from './routes/rootRoutes';
import { createUserRoutes } from './routes/userRoutes';
import { createMessageRoutes } from './routes/messageRoutes';
import { userRepository, messageRepository } from './database';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/', rootRoutes);
app.use('/api/users', createUserRoutes(userRepository));
app.use('/api/messages', createMessageRoutes(messageRepository));

export { app };