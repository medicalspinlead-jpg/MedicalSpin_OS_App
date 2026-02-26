-- Adiciona campos de preferencias de notificacao na tabela clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notif_email BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notif_whatsapp BOOLEAN DEFAULT false;
