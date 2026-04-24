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

// GET /api/admin
router.get('/', async (req, res) => {
    const { type } = req.query; // 'pending' or 'all'
    
    try {
        let query = 'SELECT id, name, email, role, status, created_at FROM users';
        if (type === 'pending') {
            query += " WHERE status = 'pending'";
        }
        query += " ORDER BY created_at DESC";

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Admin GET Error', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin (Execute action on user)
router.post('/', async (req: AuthRequest, res) => {
    const { user_id, action } = req.body;
    
    // Safety check against self-modification
    if (req.user?.id === user_id) {
        return res.status(400).json({ error: 'Você não pode modificar sua própria conta.' });
    }

    try {
        if (action === 'delete') {
            await pool.query('DELETE FROM users WHERE id = $1', [user_id]);
            return res.json({ message: 'User deleted' });
        }

        let newStatus = '';
        switch(action) {
            case 'approve': case 'reactivate': newStatus = 'approved'; break;
            case 'reject': newStatus = 'rejected'; break; // wait, if rejected maybe delete them? Or just set to rejected.
            case 'suspend': newStatus = 'suspended'; break;
        }

        if(action === 'reject') {
            await pool.query('DELETE FROM users WHERE id = $1', [user_id]);
        } else {
            await pool.query('UPDATE users SET status = $1 WHERE id = $2', [newStatus, user_id]);
        }

        res.json({ message: 'Action sorted' });
    } catch (error) {
        console.error('Admin POST Error', error);
        res.status(500).json({ error: 'Failed to execute action' });
    }
});

// GET /admin/whitelist (Legacy fallback if needed elsewhere)
router.get('/whitelist', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM whitelist ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
