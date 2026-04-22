import express from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../db';

const router = express.Router();

// Middleware to check admin role
const isAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

router.use(authenticateJWT);
router.use(isAdmin);

// GET /admin/whitelist
router.get('/whitelist', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM whitelist ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /admin/whitelist
router.post('/whitelist', async (req, res) => {
    const { email, role } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO whitelist (email, role) VALUES ($1, $2) RETURNING *',
            [email, role]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to whitelist' });
    }
});

export default router;
