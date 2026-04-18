import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);

// 404 & error handling
app.use(notFound);
app.use(errorHandler);

export default app;
