import express from 'express';
import { pool } from '../server';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// GET /stats/dashboard - All-in-one stats for the dashboard
router.get('/dashboard', authenticateJWT, async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const { year, month } = req.query; // Optional filters

    try {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // 1. Total Earnings (Lifetime)
        const totalEarningsRes = await pool.query(
            'SELECT SUM(payment_amount) as total FROM shifts WHERE user_id = $1',
            [userId]
        );

        // 2. Earnings by Month (for charts) in current year
        const monthlyEarningsRes = await pool.query(
            `SELECT EXTRACT(MONTH FROM start_time) as month, SUM(payment_amount) as total 
       FROM shifts 
       WHERE user_id = $1 AND EXTRACT(YEAR FROM start_time) = $2
       GROUP BY month
       ORDER BY month`,
            [userId, year || currentYear]
        );

        // 3. Stats by Location (Where user worked most/earned most)
        const locationStatsRes = await pool.query(
            `SELECT location_name, count(*) as shift_count, SUM(payment_amount) as total_earned
       FROM shifts
       WHERE user_id = $1
       GROUP BY location_name
       ORDER BY total_earned DESC`,
            [userId]
        );

        // 4. Daily Earnings (for calendar view details or line chart) - Last 30 days
        const dailyEarningsRes = await pool.query(
            `SELECT DATE(start_time) as day, SUM(payment_amount) as total
         FROM shifts
         WHERE user_id = $1 AND start_time > NOW() - INTERVAL '30 days'
         GROUP BY day
         ORDER BY day`
        );

        res.json({
            totalEarnings: totalEarningsRes.rows[0]?.total || 0,
            monthlyEarnings: monthlyEarningsRes.rows,
            locationStats: locationStatsRes.rows,
            dailyEarnings: dailyEarningsRes.rows
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
