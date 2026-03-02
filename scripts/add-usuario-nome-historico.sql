-- Adicionar coluna usuario_nome na tabela historico_status_solicitacao
ALTER TABLE historico_status_solicitacao
ADD COLUMN IF NOT EXISTS usuario_nome TEXT;
