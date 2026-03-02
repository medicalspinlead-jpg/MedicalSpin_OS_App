-- Tabela para registrar historico de mudancas de status das solicitacoes
CREATE TABLE IF NOT EXISTS historico_status_solicitacao (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id TEXT NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index para busca por solicitacao
CREATE INDEX IF NOT EXISTS idx_historico_status_solicitacao_id ON historico_status_solicitacao(solicitacao_id);

-- Inserir registro inicial "recebida" para todas as solicitacoes existentes que nao possuem historico
INSERT INTO historico_status_solicitacao (solicitacao_id, status, observacao, criado_em)
SELECT id, 'recebida', 'Solicitacao criada', created_at
FROM solicitacoes
WHERE id NOT IN (SELECT DISTINCT solicitacao_id FROM historico_status_solicitacao);

-- Para solicitacoes que ja estao em outro status, inserir o status atual tambem
INSERT INTO historico_status_solicitacao (solicitacao_id, status, observacao, criado_em)
SELECT id, status, 'Status registrado retroativamente', updated_at
FROM solicitacoes
WHERE status != 'recebida'
AND id NOT IN (
  SELECT solicitacao_id FROM historico_status_solicitacao WHERE status = solicitacoes.status
);
