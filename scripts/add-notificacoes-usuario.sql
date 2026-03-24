-- Adiciona campos de notificacao para usuarios (admin e tecnico)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notif_email BOOLEAN DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notif_whatsapp BOOLEAN DEFAULT true;
