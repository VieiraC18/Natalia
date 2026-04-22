import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const connectionString = 'postgresql://neondb_owner:npg_aAxJbYU2SDm8@ep-delicate-thunder-acrhy0mr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("Starting Migration...");
    
    const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Whitelist Table (Security First)
CREATE TABLE IF NOT EXISTS whitelist (
    email VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES whitelist(email)
);

-- 3. Shifts Table
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    location_address TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_amount DECIMAL(10, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending',
    shift_type VARCHAR(50) DEFAULT 'plantão',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance (IF NOT EXISTS is not standard for INDEX in postgres without dropping, but we execute this once)
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts (user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at);

-- Initial Admin Seed (Using the User's likely Google email if needed, but generic admin for now)
INSERT INTO whitelist (email, role) VALUES ('admin@example.com', 'admin') ON CONFLICT DO NOTHING;
    `;
    
    await client.query(schema);
    console.log("Migration successful: Tables created including tax_percentage!");
    
  } catch(e) {
    console.error("Migration Error:", e);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
