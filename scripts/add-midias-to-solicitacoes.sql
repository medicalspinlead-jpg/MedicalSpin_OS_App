-- Add midias column to solicitacoes table for storing images and videos
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS midias JSONB DEFAULT '{}';
