IF OBJECT_ID(N'app.Area', N'U') IS NULL
BEGIN
    CREATE TABLE app.Area
    (
        ID_Area BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Area UNIQUEIDENTIFIER NOT NULL,
        NM_Area NVARCHAR(120) NOT NULL,
        SG_Status NVARCHAR(20) NOT NULL,
        CONSTRAINT PK_Area PRIMARY KEY (ID_Area),
        CONSTRAINT UK_Area_CD_Area UNIQUE (CD_Area)
    );
END
GO

IF OBJECT_ID(N'app.Categoria', N'U') IS NULL
BEGIN
    CREATE TABLE app.Categoria
    (
        ID_Categoria BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Categoria UNIQUEIDENTIFIER NOT NULL,
        NM_Categoria NVARCHAR(120) NOT NULL,
        NR_Prazo_Horas INT NULL,
        SG_Status NVARCHAR(20) NOT NULL,
        CONSTRAINT PK_Categoria PRIMARY KEY (ID_Categoria),
        CONSTRAINT UK_Categoria_CD_Categoria UNIQUE (CD_Categoria)
    );
END
GO

IF OBJECT_ID(N'app.Subcategoria', N'U') IS NULL
BEGIN
    CREATE TABLE app.Subcategoria
    (
        ID_Subcategoria BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Subcategoria UNIQUEIDENTIFIER NOT NULL,
        ID_Categoria BIGINT NOT NULL,
        ID_Area BIGINT NOT NULL,
        NM_Subcategoria NVARCHAR(120) NOT NULL,
        SG_Fluxo NVARCHAR(20) NOT NULL,
        SG_Status NVARCHAR(20) NOT NULL,
        CONSTRAINT PK_Subcategoria PRIMARY KEY (ID_Subcategoria),
        CONSTRAINT UK_Subcategoria_CD_Subcategoria UNIQUE (CD_Subcategoria),
        CONSTRAINT FK_Subcategoria_Categoria FOREIGN KEY (ID_Categoria) REFERENCES app.Categoria (ID_Categoria),
        CONSTRAINT FK_Subcategoria_Area FOREIGN KEY (ID_Area) REFERENCES app.Area (ID_Area)
    );
END
GO

IF OBJECT_ID(N'app.Usuario', N'U') IS NULL
BEGIN
    CREATE TABLE app.Usuario
    (
        ID_Usuario BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Usuario UNIQUEIDENTIFIER NOT NULL,
        NM_Usuario NVARCHAR(200) NOT NULL,
        DS_Email NVARCHAR(320) NOT NULL,
        DS_Senha_Hash CHAR(64) NULL,
        SG_Perfil NVARCHAR(40) NOT NULL,
        NM_Empresa NVARCHAR(200) NULL,
        DS_Sala NVARCHAR(80) NULL,
        ID_Area BIGINT NULL,
        SG_Status NVARCHAR(20) NOT NULL,
        CONSTRAINT PK_Usuario PRIMARY KEY (ID_Usuario),
        CONSTRAINT UK_Usuario_CD_Usuario UNIQUE (CD_Usuario),
        CONSTRAINT UK_Usuario_DS_Email UNIQUE (DS_Email),
        CONSTRAINT FK_Usuario_Area FOREIGN KEY (ID_Area) REFERENCES app.Area (ID_Area)
    );
END
GO

IF OBJECT_ID(N'app.Regra_Classificacao', N'U') IS NULL
BEGIN
    CREATE TABLE app.Regra_Classificacao
    (
        ID_Regra BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Regra UNIQUEIDENTIFIER NOT NULL,
        DS_Termo NVARCHAR(80) NOT NULL,
        ID_Subcategoria BIGINT NOT NULL,
        NM_Servico NVARCHAR(120) NOT NULL,
        DS_Destino NVARCHAR(120) NOT NULL,
        DS_Resumo NVARCHAR(200) NOT NULL,
        SG_Prioridade NVARCHAR(20) NOT NULL,
        NR_Prioridade INT NOT NULL,
        SG_Confianca NVARCHAR(20) NOT NULL,
        NR_Ordem INT NOT NULL,
        CONSTRAINT PK_Regra_Classificacao PRIMARY KEY (ID_Regra),
        CONSTRAINT UK_Regra_Classificacao_CD_Regra UNIQUE (CD_Regra),
        CONSTRAINT FK_Regra_Classificacao_Subcategoria FOREIGN KEY (ID_Subcategoria) REFERENCES app.Subcategoria (ID_Subcategoria)
    );
END
GO

IF OBJECT_ID(N'app.Demanda', N'U') IS NULL
BEGIN
    CREATE TABLE app.Demanda
    (
        ID_Demanda BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Demanda UNIQUEIDENTIFIER NOT NULL,
        CD_Protocolo NVARCHAR(20) NOT NULL,
        ID_Cessionario BIGINT NOT NULL,
        NM_Empresa NVARCHAR(200) NOT NULL,
        DS_Sala NVARCHAR(80) NOT NULL,
        DS_Descricao NVARCHAR(2000) NOT NULL,
        DS_Ponto NVARCHAR(200) NULL,
        ID_Categoria BIGINT NOT NULL,
        ID_Subcategoria BIGINT NOT NULL,
        ID_Area BIGINT NOT NULL,
        ID_Responsavel BIGINT NULL,
        NM_Servico NVARCHAR(120) NOT NULL,
        DS_Destino NVARCHAR(120) NOT NULL,
        SG_Situacao NVARCHAR(40) NOT NULL,
        SG_Prioridade NVARCHAR(20) NOT NULL,
        NR_Prioridade INT NOT NULL,
        SG_Confianca NVARCHAR(20) NOT NULL,
        SG_Classificacao NVARCHAR(20) NOT NULL,
        SG_Fluxo NVARCHAR(20) NOT NULL,
        DT_Abertura DATETIME2 NOT NULL,
        DT_Atualizacao DATETIME2 NOT NULL,
        CONSTRAINT PK_Demanda PRIMARY KEY (ID_Demanda),
        CONSTRAINT UK_Demanda_CD_Demanda UNIQUE (CD_Demanda),
        CONSTRAINT UK_Demanda_CD_Protocolo UNIQUE (CD_Protocolo),
        CONSTRAINT FK_Demanda_Cessionario FOREIGN KEY (ID_Cessionario) REFERENCES app.Usuario (ID_Usuario),
        CONSTRAINT FK_Demanda_Responsavel FOREIGN KEY (ID_Responsavel) REFERENCES app.Usuario (ID_Usuario),
        CONSTRAINT FK_Demanda_Categoria FOREIGN KEY (ID_Categoria) REFERENCES app.Categoria (ID_Categoria),
        CONSTRAINT FK_Demanda_Subcategoria FOREIGN KEY (ID_Subcategoria) REFERENCES app.Subcategoria (ID_Subcategoria),
        CONSTRAINT FK_Demanda_Area FOREIGN KEY (ID_Area) REFERENCES app.Area (ID_Area)
    );

    CREATE INDEX IX_Demanda_Situacao ON app.Demanda (SG_Situacao);
    CREATE INDEX IX_Demanda_Area ON app.Demanda (ID_Area);
    CREATE INDEX IX_Demanda_Cessionario ON app.Demanda (ID_Cessionario);
END
GO

IF OBJECT_ID(N'app.Mensagem', N'U') IS NULL
BEGIN
    CREATE TABLE app.Mensagem
    (
        ID_Mensagem BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Mensagem UNIQUEIDENTIFIER NOT NULL,
        ID_Demanda BIGINT NOT NULL,
        ID_Autor BIGINT NOT NULL,
        DS_Texto NVARCHAR(2000) NOT NULL,
        SG_Canal NVARCHAR(20) NOT NULL,
        DT_Envio DATETIME2 NOT NULL,
        CONSTRAINT PK_Mensagem PRIMARY KEY (ID_Mensagem),
        CONSTRAINT UK_Mensagem_CD_Mensagem UNIQUE (CD_Mensagem),
        CONSTRAINT FK_Mensagem_Demanda FOREIGN KEY (ID_Demanda) REFERENCES app.Demanda (ID_Demanda),
        CONSTRAINT FK_Mensagem_Usuario FOREIGN KEY (ID_Autor) REFERENCES app.Usuario (ID_Usuario)
    );
END
GO

IF OBJECT_ID(N'app.Anexo', N'U') IS NULL
BEGIN
    CREATE TABLE app.Anexo
    (
        ID_Anexo BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Anexo UNIQUEIDENTIFIER NOT NULL,
        ID_Demanda BIGINT NOT NULL,
        NM_Arquivo NVARCHAR(260) NOT NULL,
        DS_Caminho NVARCHAR(500) NOT NULL,
        SG_Tipo_Midia NVARCHAR(120) NOT NULL,
        MD_Tamanho_Bytes BIGINT NOT NULL,
        DT_Envio DATETIME2 NOT NULL,
        CONSTRAINT PK_Anexo PRIMARY KEY (ID_Anexo),
        CONSTRAINT UK_Anexo_CD_Anexo UNIQUE (CD_Anexo),
        CONSTRAINT FK_Anexo_Demanda FOREIGN KEY (ID_Demanda) REFERENCES app.Demanda (ID_Demanda)
    );
END
GO

IF OBJECT_ID(N'app.Historico_Demanda', N'U') IS NULL
BEGIN
    CREATE TABLE app.Historico_Demanda
    (
        ID_Historico BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Historico UNIQUEIDENTIFIER NOT NULL,
        ID_Demanda BIGINT NOT NULL,
        ID_Usuario BIGINT NOT NULL,
        SG_Status_Anterior NVARCHAR(40) NULL,
        SG_Status_Novo NVARCHAR(40) NOT NULL,
        DS_Comentario NVARCHAR(2000) NOT NULL,
        SG_Tipo_Evento NVARCHAR(40) NOT NULL,
        DT_Evento DATETIME2 NOT NULL,
        CONSTRAINT PK_Historico_Demanda PRIMARY KEY (ID_Historico),
        CONSTRAINT UK_Historico_Demanda_CD_Historico UNIQUE (CD_Historico),
        CONSTRAINT FK_Historico_Demanda_Demanda FOREIGN KEY (ID_Demanda) REFERENCES app.Demanda (ID_Demanda),
        CONSTRAINT FK_Historico_Demanda_Usuario FOREIGN KEY (ID_Usuario) REFERENCES app.Usuario (ID_Usuario)
    );
END
GO

IF OBJECT_ID(N'app.Decisao_Aprovacao', N'U') IS NULL
BEGIN
    CREATE TABLE app.Decisao_Aprovacao
    (
        ID_Decisao BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Decisao UNIQUEIDENTIFIER NOT NULL,
        ID_Demanda BIGINT NOT NULL,
        ID_Usuario BIGINT NOT NULL,
        SG_Decisao NVARCHAR(40) NOT NULL,
        DS_Motivo NVARCHAR(2000) NULL,
        DT_Decisao DATETIME2 NOT NULL,
        CONSTRAINT PK_Decisao_Aprovacao PRIMARY KEY (ID_Decisao),
        CONSTRAINT UK_Decisao_Aprovacao_CD_Decisao UNIQUE (CD_Decisao),
        CONSTRAINT FK_Decisao_Aprovacao_Demanda FOREIGN KEY (ID_Demanda) REFERENCES app.Demanda (ID_Demanda),
        CONSTRAINT FK_Decisao_Aprovacao_Usuario FOREIGN KEY (ID_Usuario) REFERENCES app.Usuario (ID_Usuario)
    );
END
GO

IF OBJECT_ID(N'app.Obra', N'U') IS NULL
BEGIN
    CREATE TABLE app.Obra
    (
        ID_Obra BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Obra UNIQUEIDENTIFIER NOT NULL,
        NM_Obra NVARCHAR(200) NOT NULL,
        DS_Local NVARCHAR(200) NOT NULL,
        DS_Descricao NVARCHAR(2000) NOT NULL,
        DT_Inicio_Previsto DATE NOT NULL,
        DT_Termino_Previsto DATE NOT NULL,
        NM_Empresa_Executora NVARCHAR(200) NOT NULL,
        NM_Responsavel NVARCHAR(200) NOT NULL,
        DS_Contato NVARCHAR(320) NOT NULL,
        SG_Etapa NVARCHAR(40) NOT NULL,
        CONSTRAINT PK_Obra PRIMARY KEY (ID_Obra),
        CONSTRAINT UK_Obra_CD_Obra UNIQUE (CD_Obra)
    );
END
GO

IF OBJECT_ID(N'app.Obra_Documento', N'U') IS NULL
BEGIN
    CREATE TABLE app.Obra_Documento
    (
        ID_Obra_Documento BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Obra_Documento UNIQUEIDENTIFIER NOT NULL,
        ID_Obra BIGINT NOT NULL,
        NM_Documento NVARCHAR(120) NOT NULL,
        SG_Situacao NVARCHAR(20) NOT NULL,
        NR_Ordem INT NOT NULL,
        CONSTRAINT PK_Obra_Documento PRIMARY KEY (ID_Obra_Documento),
        CONSTRAINT UK_Obra_Documento_CD_Obra_Documento UNIQUE (CD_Obra_Documento),
        CONSTRAINT FK_Obra_Documento_Obra FOREIGN KEY (ID_Obra) REFERENCES app.Obra (ID_Obra)
    );
END
GO

IF OBJECT_ID(N'app.Notificacao', N'U') IS NULL
BEGIN
    CREATE TABLE app.Notificacao
    (
        ID_Notificacao BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Notificacao UNIQUEIDENTIFIER NOT NULL,
        ID_Demanda BIGINT NOT NULL,
        ID_Usuario BIGINT NOT NULL,
        DS_Texto NVARCHAR(500) NOT NULL,
        SG_Leitura NVARCHAR(20) NOT NULL,
        DT_Criacao DATETIME2 NOT NULL,
        CONSTRAINT PK_Notificacao PRIMARY KEY (ID_Notificacao),
        CONSTRAINT UK_Notificacao_CD_Notificacao UNIQUE (CD_Notificacao),
        CONSTRAINT FK_Notificacao_Demanda FOREIGN KEY (ID_Demanda) REFERENCES app.Demanda (ID_Demanda),
        CONSTRAINT FK_Notificacao_Usuario FOREIGN KEY (ID_Usuario) REFERENCES app.Usuario (ID_Usuario)
    );
END
GO
