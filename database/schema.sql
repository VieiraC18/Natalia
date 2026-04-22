-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Whitelist Table (Security First)
CREATE TABLE whitelist (
    email VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES whitelist(email) -- Enforce whitelist at DB level implies stricter control, but typically we check whitelist before creation. Let's keep it flexible but safe.
);

-- 3. Shifts Table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    location_address TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid
    shift_type VARCHAR(50) DEFAULT 'plantão', -- plantão, extra, consulta
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_shifts_user_date ON shifts (user_id, start_time);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_audit_created_at ON audit_logs (created_at);

-- Initial Admin Seed (Replace with your email)
INSERT INTO whitelist (email, role) VALUES ('admin@example.com', 'admin') ON CONFLICT DO NOTHING;
