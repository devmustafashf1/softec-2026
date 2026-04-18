import express from 'express';
import cors from 'cors';
import healthRouter    from './routes/health.js';
import authRouter      from './routes/auth.js';
import usersRouter     from './routes/users.js';
import accountsRouter  from './routes/accounts.js';
import clientRouter    from './routes/client.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health',    healthRouter);
app.use('/api/auth',      authRouter);
app.use('/api/users',     usersRouter);
app.use('/api/accounts',  accountsRouter);
app.use('/api/client',    clientRouter);

// 404 & error handling
app.use(notFound);
app.use(errorHandler);

export default app;
