-- Imagem enviada na conversa fica ligada à mensagem. Anexos anteriores permanecem sem mensagem.
IF COL_LENGTH(N'app.Anexo', N'ID_Mensagem') IS NULL
BEGIN
    ALTER TABLE app.Anexo ADD ID_Mensagem BIGINT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Anexo_Mensagem')
BEGIN
    ALTER TABLE app.Anexo ADD CONSTRAINT FK_Anexo_Mensagem
        FOREIGN KEY (ID_Mensagem) REFERENCES app.Mensagem (ID_Mensagem);
END
GO
