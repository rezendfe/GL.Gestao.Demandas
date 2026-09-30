-- Colunas e tabela que o modelo EF já usa e os scripts 02/12 ainda não criavam.
-- Idempotente. Roda depois de 12_espacos_locacoes.sql.

IF COL_LENGTH(N'app.Usuario', N'DS_Logo_Empresa') IS NULL
    ALTER TABLE app.Usuario ADD DS_Logo_Empresa NVARCHAR(300) NULL;
GO

IF COL_LENGTH(N'app.Usuario', N'DS_Foto') IS NULL
    ALTER TABLE app.Usuario ADD DS_Foto NVARCHAR(300) NULL;
GO

IF COL_LENGTH(N'app.Demanda', N'DT_Previsao_Atendimento') IS NULL
    ALTER TABLE app.Demanda ADD DT_Previsao_Atendimento DATETIME2 NULL;
GO

IF COL_LENGTH(N'app.Demanda', N'SG_Natureza') IS NULL
    ALTER TABLE app.Demanda ADD SG_Natureza NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Demanda_SG_Natureza DEFAULT (N'Serviço');
GO

IF COL_LENGTH(N'app.Demanda', N'NR_Nota_Avaliacao') IS NULL
    ALTER TABLE app.Demanda ADD NR_Nota_Avaliacao INT NULL;
GO

IF COL_LENGTH(N'app.Demanda', N'DS_Comentario_Avaliacao') IS NULL
    ALTER TABLE app.Demanda ADD DS_Comentario_Avaliacao NVARCHAR(500) NULL;
GO

IF COL_LENGTH(N'app.Demanda', N'DT_Avaliacao') IS NULL
    ALTER TABLE app.Demanda ADD DT_Avaliacao DATETIME2 NULL;
GO

IF COL_LENGTH(N'app.Mensagem', N'SG_Finalidade') IS NULL
    ALTER TABLE app.Mensagem ADD SG_Finalidade NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Mensagem_SG_Finalidade DEFAULT (N'mensagem');
GO

IF OBJECT_ID(N'app.Etapa_Cadeia', N'U') IS NULL
BEGIN
    CREATE TABLE app.Etapa_Cadeia
    (
        ID_Etapa_Cadeia BIGINT IDENTITY(1, 1) NOT NULL,
        ID_Subcategoria BIGINT NOT NULL,
        SG_Etapa NVARCHAR(40) NOT NULL,
        NM_Etapa NVARCHAR(80) NOT NULL,
        NR_Ordem INT NOT NULL,
        FL_Automatica BIT NOT NULL,
        DS_Campos NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_Etapa_Cadeia PRIMARY KEY (ID_Etapa_Cadeia),
        CONSTRAINT UK_Etapa_Cadeia_Tipo_Etapa UNIQUE (ID_Subcategoria, SG_Etapa),
        CONSTRAINT FK_Etapa_Cadeia_Subcategoria FOREIGN KEY (ID_Subcategoria) REFERENCES app.Subcategoria (ID_Subcategoria)
    );
END
GO
