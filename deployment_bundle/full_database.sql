-- full_database.sql
-- Importe ESTE arquivo se você estiver começando do zero ou recriando o banco

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Plantões (Shifts)
CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_address VARCHAR(255),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    payment_amount DECIMAL(10, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) DEFAULT 0.00,
    shift_type VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- NOVO: Tabela de Locais de Trabalho (Workplaces)
CREATE TABLE IF NOT EXISTS workplaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    default_payment DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
