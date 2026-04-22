import express from 'express';
import { pool } from '../index';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// GET /shifts - Get all shifts for a user (optional date filter)
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const { start, end } = req.query;

    try {
        let query = 'SELECT * FROM shifts WHERE user_id = $1';
        const params: any[] = [userId];

        if (start && end) {
            query += ' AND start_time >= $2 AND end_time <= $3';
            params.push(start, end);
        }

        query += ' ORDER BY start_time ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /shifts - Create a new shift
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const { location_name, location_address, start_time, end_time, payment_amount, shift_type, notes } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO shifts (user_id, location_name, location_address, start_time, end_time, payment_amount, shift_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [userId, location_name, location_address, start_time, end_time, payment_amount, shift_type, notes]
        );

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, 'CREATE_SHIFT', $2)`,
            [userId, JSON.stringify({ shiftId: result.rows[0].id, location: location_name })]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /shifts/:id - Update a shift
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const shiftId = req.params.id;
    const { location_name, location_address, start_time, end_time, payment_amount, shift_type, notes } = req.body;

    try {
        // Verify ownership
        const check = await pool.query('SELECT id FROM shifts WHERE id = $1 AND user_id = $2', [shiftId, userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        const result = await pool.query(
            `UPDATE shifts 
       SET location_name = $1, location_address = $2, start_time = $3, end_time = $4, payment_amount = $5, shift_type = $6, notes = $7, updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
            [location_name, location_address, start_time, end_time, payment_amount, shift_type, notes, shiftId, userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /shifts/:id - Delete a shift
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const shiftId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM shifts WHERE id = $1 AND user_id = $2 RETURNING id', [shiftId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
