-- Comunicado do GL / Administrador lido pelo Cessionário.
-- Idempotente. Roda depois de 14_conteudo_demonstracao.sql.

IF OBJECT_ID(N'app.Comunicado', N'U') IS NULL
BEGIN
    CREATE TABLE app.Comunicado
    (
        ID_Comunicado BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Comunicado UNIQUEIDENTIFIER NOT NULL,
        ID_Autor BIGINT NOT NULL,
        DS_Titulo NVARCHAR(120) NOT NULL,
        DS_Texto NVARCHAR(2000) NOT NULL,
        FL_Vigente BIT NOT NULL,
        DT_Publicacao DATETIME2 NOT NULL,
        DT_Encerramento DATETIME2 NULL,
        CONSTRAINT PK_Comunicado PRIMARY KEY (ID_Comunicado),
        CONSTRAINT UK_Comunicado_CD UNIQUE (CD_Comunicado),
        CONSTRAINT FK_Comunicado_Autor FOREIGN KEY (ID_Autor) REFERENCES app.Usuario (ID_Usuario)
    );
END
GO

IF OBJECT_ID(N'app.Comunicado_Evento', N'U') IS NULL
BEGIN
    CREATE TABLE app.Comunicado_Evento
    (
        ID_Comunicado_Evento BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Comunicado_Evento UNIQUEIDENTIFIER NOT NULL,
        ID_Comunicado BIGINT NOT NULL,
        ID_Usuario BIGINT NOT NULL,
        SG_Tipo NVARCHAR(40) NOT NULL,
        DS_Comentario NVARCHAR(200) NOT NULL,
        DT_Evento DATETIME2 NOT NULL,
        CONSTRAINT PK_Comunicado_Evento PRIMARY KEY (ID_Comunicado_Evento),
        CONSTRAINT UK_Comunicado_Evento_CD UNIQUE (CD_Comunicado_Evento),
        CONSTRAINT FK_Comunicado_Evento_Comunicado FOREIGN KEY (ID_Comunicado) REFERENCES app.Comunicado (ID_Comunicado),
        CONSTRAINT FK_Comunicado_Evento_Usuario FOREIGN KEY (ID_Usuario) REFERENCES app.Usuario (ID_Usuario)
    );
END
GO

IF OBJECT_ID(N'app.Comunicado_Leitura', N'U') IS NULL
BEGIN
    CREATE TABLE app.Comunicado_Leitura
    (
        ID_Comunicado_Leitura BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Comunicado_Leitura UNIQUEIDENTIFIER NOT NULL,
        ID_Comunicado BIGINT NOT NULL,
        ID_Usuario BIGINT NOT NULL,
        DT_Leitura DATETIME2 NOT NULL,
        CONSTRAINT PK_Comunicado_Leitura PRIMARY KEY (ID_Comunicado_Leitura),
        CONSTRAINT UK_Comunicado_Leitura_CD UNIQUE (CD_Comunicado_Leitura),
        CONSTRAINT UK_Comunicado_Leitura_Usuario UNIQUE (ID_Comunicado, ID_Usuario),
        CONSTRAINT FK_Comunicado_Leitura_Comunicado FOREIGN KEY (ID_Comunicado) REFERENCES app.Comunicado (ID_Comunicado),
        CONSTRAINT FK_Comunicado_Leitura_Usuario FOREIGN KEY (ID_Usuario) REFERENCES app.Usuario (ID_Usuario)
    );
END
GO
