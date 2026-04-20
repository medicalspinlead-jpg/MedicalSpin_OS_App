-- Adiciona campo usuario_id à tabela ordens_servico
-- para identificar o usuário que criou a OS/rascunho

ALTER TABLE ordens_servico
ADD COLUMN IF NOT EXISTS usuario_id TEXT;

-- Adiciona indice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_ordens_servico_usuario_id ON ordens_servico(usuario_id);
