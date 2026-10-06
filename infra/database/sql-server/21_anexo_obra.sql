-- Foto da obra executada fica marcada no anexo. Anexos anteriores permanecem documento.
IF COL_LENGTH(N'app.Anexo', N'SG_Finalidade') IS NULL
BEGIN
    ALTER TABLE app.Anexo ADD SG_Finalidade NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Anexo_SG_Finalidade DEFAULT N'documento';
END
GO
