-- Modelo de abertura da categoria. Idempotente. Roda depois de 16_comunicados.sql.

IF COL_LENGTH(N'app.Categoria', N'DS_Assunto_Sugerido') IS NULL
    ALTER TABLE app.Categoria ADD DS_Assunto_Sugerido NVARCHAR(120) NULL;
GO

IF COL_LENGTH(N'app.Categoria', N'DS_Ponto_Sugerido') IS NULL
    ALTER TABLE app.Categoria ADD DS_Ponto_Sugerido NVARCHAR(200) NULL;
GO

IF COL_LENGTH(N'app.Categoria', N'SG_Periodo_Sugerido') IS NULL
    ALTER TABLE app.Categoria ADD SG_Periodo_Sugerido NVARCHAR(40) NULL;
GO

IF COL_LENGTH(N'app.Categoria', N'DS_Itens_Sugeridos') IS NULL
    ALTER TABLE app.Categoria ADD DS_Itens_Sugeridos NVARCHAR(2000) NULL;
GO
