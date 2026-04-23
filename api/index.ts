import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();



// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Routes
import authRoutes from './routes/auth.routes';
import shiftsRoutes from './routes/shifts.routes';
import statsRoutes from './routes/stats.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import workplacesRoutes from './routes/workplaces.routes';

app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workplaces', workplacesRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export Serverless Function
module.exports = app;
