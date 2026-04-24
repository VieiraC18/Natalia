import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { verifyGoogleToken, checkWhitelist, authenticateJWT, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// POST /auth/login (Email & Password)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
        
        const user = result.rows[0];

        if (user.status === 'pending') {
            return res.status(403).json({ error: 'Sua conta está em análise pelo administrador. Tente novamente mais tarde.' });
        }
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Sua conta foi suspensa.' });
        }
        
        // Simple mock comparison since we bypassed bcrypt for rapid prototyping
        if (password !== user.password_hash) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        const jwtToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            (process.env.JWT_SECRET || 'fallback_secret_123') as string,
            { expiresIn: '24h' }
        );

        res.json({ token: jwtToken, user });
    } catch (e) {
        console.error('Login Error', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /auth/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    try {
        // Simple manual creation
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Email já cadastrado' });

        await pool.query('INSERT INTO whitelist (email, role) VALUES ($1, $2) ON CONFLICT DO NOTHING', [email, 'user']);
        
        const result = await pool.query(
            'INSERT INTO users (email, name, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [email, name, password, 'user', 'pending'] // Set explicitly to pending
        );

        // Do not return token if pending
        return res.status(201).json({ message: 'Conta criada com sucesso. Aguarde a aprovação do administrador.' });
    } catch (e) {
        console.error('Register Error', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /auth/google
router.post('/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const googleUser = await verifyGoogleToken(token);

    if (!googleUser || !googleUser.email) {
        return res.status(401).json({ error: 'Invalid Google Token' });
    }

    // 1. Check Whitelist
    const { isAllowed, role } = await checkWhitelist(googleUser.email);

    if (!isAllowed) {
        return res.status(403).json({ error: 'Access denied. Email not whitelisted.' });
    }

    // 2. Find or Create User in DB
    try {
        // Check if user exists
        let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [googleUser.email]);

        if (userResult.rows.length === 0) {
            // Create new user
            userResult = await pool.query(
                `INSERT INTO users (google_id, email, name, avatar_url, role, status) 
                 VALUES ($1, $2, $3, $4, $5, 'pending') 
                 RETURNING *`,
                [googleUser.sub, googleUser.email, googleUser.name, googleUser.picture, role]
            );
        }

        const user = userResult.rows[0];

        if (user.status === 'pending') {
            return res.status(403).json({ error: 'Sua conta está em análise pelo administrador. Aguarde a aprovação.' });
        }
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Sua conta foi suspensa.' });
        }

        // 3. Generate JWT
        const jwtToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({ token: jwtToken, user });
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /auth/me
router.get('/me', authenticateJWT, async (req: AuthRequest, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, role, avatar_url FROM users WHERE id = $1', [req.user?.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
