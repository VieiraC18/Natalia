import express from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../db';

const router = express.Router();

router.use(authenticateJWT);

// Get all workplaces for user
router.get('/', async (req: AuthRequest, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM workplaces WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user!.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workplaces:', error);
        res.status(500).json({ error: 'Failed to fetch workplaces' });
    }
});

// Create new workplace
router.post('/', async (req: AuthRequest, res) => {
    const { name, address, default_payment, tax_percentage } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO workplaces (user_id, name, address, default_payment, tax_percentage) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                req.user!.id, 
                name, 
                address || null, 
                default_payment ? parseFloat(default_payment) : 0,
                tax_percentage ? parseFloat(tax_percentage) : 0
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating workplace:', error);
        res.status(500).json({ error: 'Failed to create workplace' });
    }
});

// Delete workplace
router.delete('/', async (req: AuthRequest, res) => {
    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ error: 'Workplace ID is required' });
    }

    try {
        await pool.query('DELETE FROM workplaces WHERE id = $1 AND user_id = $2', [id, req.user!.id]);
        res.json({ message: 'Workplace deleted successfully' });
    } catch (error) {
        console.error('Error deleting workplace:', error);
        res.status(500).json({ error: 'Failed to delete workplace' });
    }
});

export default router;
