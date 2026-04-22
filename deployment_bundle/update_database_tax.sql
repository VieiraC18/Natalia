-- Execute este comando no seu phpMyAdmin para atualizar a tabela shifts sem perder dados.

ALTER TABLE shifts 
ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0.00 AFTER payment_amount;
