-- update_users_status.sql
-- Executar no phpMyAdmin para adicionar o sistema de aprovação

-- Adicionar coluna status se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Aprovar todos os usuários que já existem (para ninguém ficar bloqueado)
UPDATE users SET status = 'approved' WHERE status = 'pending';
