-- Marca da etapa: enviar WhatsApp quando o chamado entra e quando sai.
IF COL_LENGTH(N'app.Etapa_Cadeia', N'FL_Enviar_Ao_Abrir') IS NULL
    ALTER TABLE app.Etapa_Cadeia ADD FL_Enviar_Ao_Abrir BIT NOT NULL
        CONSTRAINT DF_Etapa_Cadeia_Enviar_Ao_Abrir DEFAULT (0);
GO

IF COL_LENGTH(N'app.Etapa_Cadeia', N'FL_Enviar_Ao_Concluir') IS NULL
    ALTER TABLE app.Etapa_Cadeia ADD FL_Enviar_Ao_Concluir BIT NOT NULL
        CONSTRAINT DF_Etapa_Cadeia_Enviar_Ao_Concluir DEFAULT (0);
GO

-- Toda mudança de status avisa o demandante; as marcas da cadeia ficam ligadas por padrão.
UPDATE app.Etapa_Cadeia
SET FL_Enviar_Ao_Abrir = 1,
    FL_Enviar_Ao_Concluir = 1;
GO
