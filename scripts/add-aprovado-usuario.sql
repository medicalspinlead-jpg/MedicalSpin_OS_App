-- Adiciona campo aprovado na tabela usuarios
-- Usuarios do tipo cliente precisam de aprovacao do admin

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT true;

-- Usuarios tipo cliente criados depois dessa migration precisam de aprovacao
-- Usuarios existentes ja estao aprovados por padrao

COMMENT ON COLUMN usuarios.aprovado IS 'Indica se a conta do usuario foi aprovada pelo admin. Clientes precisam de aprovacao.';
