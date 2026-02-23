-- Add clienteId to usuarios table for client-user linking
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "cliente_id" TEXT;
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL;

-- Add clienteId to solicitacoes table for filtering by client
ALTER TABLE "solicitacoes" ADD COLUMN IF NOT EXISTS "cliente_id" TEXT;
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL;
