-- Create solicitacoes table
CREATE TABLE IF NOT EXISTS "solicitacoes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "protocolo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'recebida',
  "nome_empresa" TEXT NOT NULL,
  "cnpj" TEXT,
  "nome_contato" TEXT NOT NULL,
  "telefone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "uf" TEXT NOT NULL,
  "tipo_equipamento" TEXT NOT NULL,
  "fabricante" TEXT NOT NULL,
  "modelo" TEXT NOT NULL,
  "numero_serie" TEXT,
  "descricao_problema" TEXT NOT NULL,
  "urgencia" TEXT NOT NULL DEFAULT 'normal',
  "ordem_servico_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "solicitacoes_pkey" PRIMARY KEY ("id")
);

-- Create unique index on protocolo
CREATE UNIQUE INDEX IF NOT EXISTS "solicitacoes_protocolo_key" ON "solicitacoes"("protocolo");

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS "solicitacoes_status_idx" ON "solicitacoes"("status");

-- Create index on ordem_servico_id for lookups
CREATE INDEX IF NOT EXISTS "solicitacoes_ordem_servico_id_idx" ON "solicitacoes"("ordem_servico_id");
