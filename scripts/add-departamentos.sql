-- Criar tabela de departamentos
CREATE TABLE IF NOT EXISTS departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  cor VARCHAR(50) DEFAULT '#3b82f6',
  icone VARCHAR(100) DEFAULT 'Activity',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de relacionamento usuario-departamento
CREATE TABLE IF NOT EXISTS usuarios_departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  departamento_id UUID NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, departamento_id)
);

-- Criar tabela de relacionamento cliente-departamento
CREATE TABLE IF NOT EXISTS clientes_departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  departamento_id UUID NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id, departamento_id)
);

-- Inserir os 3 departamentos iniciais
INSERT INTO departamentos (nome, descricao, cor, icone) VALUES
  ('Ressonancia Magnetica', 'Equipamentos de ressonancia magnetica', '#8b5cf6', 'Magnet'),
  ('Ultrassom', 'Equipamentos de ultrassom e diagnostico por imagem', '#06b6d4', 'Radio'),
  ('Tomografia', 'Equipamentos de tomografia computadorizada', '#f59e0b', 'Scan')
ON CONFLICT (nome) DO NOTHING;

-- Criar indices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_departamentos_usuario ON usuarios_departamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_departamentos_departamento ON usuarios_departamentos(departamento_id);
CREATE INDEX IF NOT EXISTS idx_clientes_departamentos_cliente ON clientes_departamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_departamentos_departamento ON clientes_departamentos(departamento_id);
