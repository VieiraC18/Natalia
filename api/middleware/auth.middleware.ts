import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

// Middleware to verify JWT token
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user as any;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Helper: Verify Google Token
export async function verifyGoogleToken(token: string) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        console.error('Error verifying Google token:', error);
        return null;
    }
}

// Helper: Check Whitelist
export async function checkWhitelist(email: string): Promise<{ isAllowed: boolean; role: string }> {
    try {
        const result = await pool.query('SELECT role FROM whitelist WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            return { isAllowed: true, role: result.rows[0].role };
        }
        return { isAllowed: false, role: 'user' };
    } catch (error) {
        console.error('Error checking whitelist:', error);
        return { isAllowed: false, role: 'user' };
    }
}
