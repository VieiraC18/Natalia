-- update_database.sql
-- Execute este script no phpMyAdmin para adicionar a funcionalidade de Locais de Trabalho

CREATE TABLE IF NOT EXISTS workplaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    default_payment DECIMAL(10, 2), -- Valor padrao da hora/plantao
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
