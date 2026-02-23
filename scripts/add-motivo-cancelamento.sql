-- Adiciona coluna motivo_cancelamento na tabela solicitacoes
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;
