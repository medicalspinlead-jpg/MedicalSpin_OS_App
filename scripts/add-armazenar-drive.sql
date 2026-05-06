-- Adiciona campo armazenar_no_drive na tabela configuracoes

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'configuracoes' 
        AND column_name = 'armazenar_no_drive'
    ) THEN
        ALTER TABLE configuracoes 
        ADD COLUMN armazenar_no_drive BOOLEAN DEFAULT true NOT NULL;
    END IF;
END $$;

-- Atualiza registros existentes para ter o campo habilitado por padrao
UPDATE configuracoes SET armazenar_no_drive = true WHERE armazenar_no_drive IS NULL;
