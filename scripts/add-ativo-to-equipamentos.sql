-- Adiciona coluna ativo à tabela equipamentos
-- Se o equipamento estiver vinculado a uma OS ou solicitação, não pode ser excluído, apenas inativado

ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;
