import express from 'express';
import { pool } from '../db';
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
    const { 
        location_name, location_address, start_time, end_time, payment_amount, shift_type, notes,
        payment_type = 'fixed', hourly_rate = 0, worked_hours = 0, per_patient_rate = 0,
        estimated_patients = 0, attended_patients = 0, return_patients = 0, deduct_lunch = false,
        is_recurring = false, recurrence_end_date = ''
    } = req.body;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const groupId = is_recurring ? require('crypto').randomUUID() : null;
            let currentStart = new Date(start_time);
            let currentEnd = new Date(end_time);
            const endDate = is_recurring && recurrence_end_date ? new Date(recurrence_end_date) : currentStart;
            
            // Limit recurrence to 52 weeks max
            const maxDate = new Date(currentStart);
            maxDate.setDate(maxDate.getDate() + 365);
            const actualEndDate = endDate > maxDate ? maxDate : endDate;

            const insertedShifts = [];

            while (currentStart <= actualEndDate) {
                const result = await client.query(
                    `INSERT INTO shifts (
                        user_id, location_name, location_address, start_time, end_time, payment_amount, shift_type, notes,
                        payment_type, hourly_rate, worked_hours, per_patient_rate, estimated_patients, attended_patients, return_patients, deduct_lunch, recurrence_group_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
                    [
                        userId, location_name, location_address, currentStart.toISOString(), currentEnd.toISOString(), payment_amount, shift_type, notes,
                        payment_type, hourly_rate, worked_hours, per_patient_rate, estimated_patients, attended_patients, return_patients, deduct_lunch, groupId
                    ]
                );
                
                insertedShifts.push(result.rows[0]);

                if (!is_recurring) break;

                // add 7 days
                currentStart.setDate(currentStart.getDate() + 7);
                currentEnd.setDate(currentEnd.getDate() + 7);
            }

            // Audit Log
            await client.query(
                `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, 'CREATE_SHIFT', $2)`,
                [userId, JSON.stringify({ isRecurring: is_recurring, location: location_name })]
            );

            await client.query('COMMIT');
            res.status(201).json(is_recurring ? insertedShifts : insertedShifts[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /shifts/:id - Update a shift
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const shiftId = req.params.id;
    const { 
        location_name, location_address, start_time, end_time, payment_amount, shift_type, notes,
        payment_type = 'fixed', hourly_rate = 0, worked_hours = 0, per_patient_rate = 0,
        estimated_patients = 0, attended_patients = 0, return_patients = 0, deduct_lunch = false
    } = req.body;

    try {
        // Verify ownership
        const check = await pool.query('SELECT id FROM shifts WHERE id = $1 AND user_id = $2', [shiftId, userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        const result = await pool.query(
            `UPDATE shifts 
             SET location_name = $1, location_address = $2, start_time = $3, end_time = $4, payment_amount = $5, shift_type = $6, notes = $7, 
                 payment_type = $8, hourly_rate = $9, worked_hours = $10, per_patient_rate = $11, estimated_patients = $12, 
                 attended_patients = $13, return_patients = $14, deduct_lunch = $15, updated_at = NOW()
             WHERE id = $16 AND user_id = $17
             RETURNING *`,
            [
                location_name, location_address, start_time, end_time, payment_amount, shift_type, notes,
                payment_type, hourly_rate, worked_hours, per_patient_rate, estimated_patients, attended_patients, return_patients, deduct_lunch,
                shiftId, userId
            ]
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
