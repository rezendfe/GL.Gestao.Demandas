-- Inscrição do celular para receber notificação do portal com a tela fechada.
-- Idempotente. Roda depois de 13_alinhamento_modelo.sql.

IF OBJECT_ID(N'app.Inscricao_Push', N'U') IS NULL
BEGIN
    CREATE TABLE app.Inscricao_Push
    (
        ID_Inscricao_Push BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Inscricao_Push UNIQUEIDENTIFIER NOT NULL,
        ID_Usuario BIGINT NOT NULL,
        DS_Endpoint NVARCHAR(2000) NOT NULL,
        DS_Endpoint_Hash CHAR(64) NOT NULL,
        DS_Chave_P256dh NVARCHAR(200) NOT NULL,
        DS_Segredo_Auth NVARCHAR(200) NOT NULL,
        DT_Criacao DATETIME2 NOT NULL,
        CONSTRAINT PK_Inscricao_Push PRIMARY KEY (ID_Inscricao_Push),
        CONSTRAINT UK_Inscricao_Push_CD UNIQUE (CD_Inscricao_Push),
        CONSTRAINT UK_Inscricao_Push_Endpoint UNIQUE (DS_Endpoint_Hash),
        CONSTRAINT FK_Inscricao_Push_Usuario FOREIGN KEY (ID_Usuario) REFERENCES app.Usuario (ID_Usuario)
    );
END
GO
