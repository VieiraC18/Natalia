import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://fake:fake@fake/fake',
    ssl: {
        rejectUnauthorized: false
    }
});
