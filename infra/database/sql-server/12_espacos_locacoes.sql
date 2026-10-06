IF OBJECT_ID(N'app.Empresa_Cessionaria', N'U') IS NULL
BEGIN
    CREATE TABLE app.Empresa_Cessionaria
    (
        ID_Empresa_Cessionaria BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Empresa_Cessionaria UNIQUEIDENTIFIER NOT NULL,
        NM_Empresa NVARCHAR(200) NOT NULL,
        SG_Status NVARCHAR(20) NOT NULL,
        DS_Logo NVARCHAR(300) NULL,
        CONSTRAINT PK_Empresa_Cessionaria PRIMARY KEY (ID_Empresa_Cessionaria),
        CONSTRAINT UK_Empresa_Cessionaria_CD UNIQUE (CD_Empresa_Cessionaria),
        CONSTRAINT UK_Empresa_Cessionaria_NM UNIQUE (NM_Empresa)
    );
END
GO

IF OBJECT_ID(N'app.Espaco', N'U') IS NULL
BEGIN
    CREATE TABLE app.Espaco
    (
        ID_Espaco BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Espaco UNIQUEIDENTIFIER NOT NULL,
        CD_Identificacao NVARCHAR(40) NOT NULL,
        NM_Espaco NVARCHAR(120) NOT NULL,
        DS_Localizacao NVARCHAR(240) NOT NULL,
        DS_Descricao NVARCHAR(1000) NOT NULL,
        SG_Status NVARCHAR(20) NOT NULL,
        CONSTRAINT PK_Espaco PRIMARY KEY (ID_Espaco),
        CONSTRAINT UK_Espaco_CD UNIQUE (CD_Espaco),
        CONSTRAINT UK_Espaco_Identificacao UNIQUE (CD_Identificacao),
        CONSTRAINT CK_Espaco_Status CHECK (SG_Status IN (N'ATIVO', N'INATIVO'))
    );
END
GO

IF OBJECT_ID(N'app.Locacao', N'U') IS NULL
BEGIN
    CREATE TABLE app.Locacao
    (
        ID_Locacao BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Locacao UNIQUEIDENTIFIER NOT NULL,
        ID_Espaco BIGINT NOT NULL,
        ID_Empresa_Cessionaria BIGINT NOT NULL,
        DT_Inicio DATE NOT NULL,
        DT_Termino DATE NULL,
        CONSTRAINT PK_Locacao PRIMARY KEY (ID_Locacao),
        CONSTRAINT UK_Locacao_CD UNIQUE (CD_Locacao),
        CONSTRAINT CK_Locacao_Periodo CHECK (DT_Termino IS NULL OR DT_Termino >= DT_Inicio),
        CONSTRAINT FK_Locacao_Espaco FOREIGN KEY (ID_Espaco) REFERENCES app.Espaco (ID_Espaco),
        CONSTRAINT FK_Locacao_Empresa FOREIGN KEY (ID_Empresa_Cessionaria) REFERENCES app.Empresa_Cessionaria (ID_Empresa_Cessionaria)
    );
    CREATE UNIQUE INDEX UK_Locacao_Espaco_Vigente ON app.Locacao (ID_Espaco) WHERE DT_Termino IS NULL;
    CREATE INDEX IX_Locacao_Empresa_Historico ON app.Locacao (ID_Empresa_Cessionaria, DT_Inicio DESC);
END
GO

IF COL_LENGTH(N'app.Usuario', N'ID_Empresa_Cessionaria') IS NULL
    ALTER TABLE app.Usuario ADD ID_Empresa_Cessionaria BIGINT NULL;
GO

IF COL_LENGTH(N'app.Usuario', N'DS_Identidade_Entra') IS NULL
    ALTER TABLE app.Usuario ADD DS_Identidade_Entra NVARCHAR(200) NULL;
GO

IF COL_LENGTH(N'app.Demanda', N'ID_Empresa_Cessionaria') IS NULL
    ALTER TABLE app.Demanda ADD ID_Empresa_Cessionaria BIGINT NULL;
GO

INSERT INTO app.Empresa_Cessionaria (CD_Empresa_Cessionaria, NM_Empresa, SG_Status)
SELECT NEWID(), nomes.NM_Empresa, N'ATIVO'
FROM
(
    SELECT DISTINCT NULLIF(LTRIM(RTRIM(NM_Empresa)), N'') AS NM_Empresa
    FROM app.Usuario
    WHERE SG_Perfil = N'CESSIONARIO'
) nomes
WHERE nomes.NM_Empresa IS NOT NULL
  AND NOT EXISTS
  (
      SELECT 1
      FROM app.Empresa_Cessionaria empresa
      WHERE empresa.NM_Empresa = nomes.NM_Empresa
  );
GO

UPDATE usuario
SET ID_Empresa_Cessionaria = empresa.ID_Empresa_Cessionaria
FROM app.Usuario usuario
JOIN app.Empresa_Cessionaria empresa
  ON empresa.NM_Empresa = LTRIM(RTRIM(usuario.NM_Empresa))
WHERE usuario.SG_Perfil = N'CESSIONARIO'
  AND usuario.ID_Empresa_Cessionaria IS NULL;
GO

UPDATE demanda
SET ID_Empresa_Cessionaria = usuario.ID_Empresa_Cessionaria
FROM app.Demanda demanda
JOIN app.Usuario usuario ON usuario.ID_Usuario = demanda.ID_Cessionario
WHERE demanda.ID_Empresa_Cessionaria IS NULL;
GO

IF EXISTS
(
    SELECT 1
    FROM app.Usuario
    WHERE SG_Perfil = N'CESSIONARIO'
      AND ID_Empresa_Cessionaria IS NULL
)
BEGIN
    ;THROW 51001, 'Migracao interrompida: ha Cessionario sem empresa resolvida.', 1;
END;

IF EXISTS (SELECT 1 FROM app.Demanda WHERE ID_Empresa_Cessionaria IS NULL)
BEGIN
    ;THROW 51002, 'Migracao interrompida: ha demanda sem empresa proprietaria resolvida.', 1;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Usuario_Empresa_Cessionaria')
    ALTER TABLE app.Usuario ADD CONSTRAINT FK_Usuario_Empresa_Cessionaria
        FOREIGN KEY (ID_Empresa_Cessionaria) REFERENCES app.Empresa_Cessionaria (ID_Empresa_Cessionaria);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Demanda_Empresa_Cessionaria')
    ALTER TABLE app.Demanda ADD CONSTRAINT FK_Demanda_Empresa_Cessionaria
        FOREIGN KEY (ID_Empresa_Cessionaria) REFERENCES app.Empresa_Cessionaria (ID_Empresa_Cessionaria);
GO

IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'app.Demanda')
      AND name = N'ID_Empresa_Cessionaria'
      AND is_nullable = 1
)
    ALTER TABLE app.Demanda ALTER COLUMN ID_Empresa_Cessionaria BIGINT NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_Usuario_Identidade_Entra' AND object_id = OBJECT_ID(N'app.Usuario'))
    CREATE UNIQUE INDEX UK_Usuario_Identidade_Entra ON app.Usuario (DS_Identidade_Entra)
        WHERE DS_Identidade_Entra IS NOT NULL;
GO

IF OBJECT_ID(N'app.Representante_Contato', N'U') IS NULL
BEGIN
    CREATE TABLE app.Representante_Contato
    (
        ID_Representante_Contato BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Representante_Contato UNIQUEIDENTIFIER NOT NULL,
        ID_Usuario BIGINT NOT NULL,
        SG_Canal NVARCHAR(20) NOT NULL,
        DS_Valor NVARCHAR(320) NOT NULL,
        FL_Principal BIT NOT NULL,
        CONSTRAINT PK_Representante_Contato PRIMARY KEY (ID_Representante_Contato),
        CONSTRAINT UK_Representante_Contato_CD UNIQUE (CD_Representante_Contato),
        CONSTRAINT CK_Representante_Contato_Canal CHECK (SG_Canal IN (N'EMAIL', N'TELEFONE', N'WHATSAPP')),
        CONSTRAINT FK_Representante_Contato_Usuario FOREIGN KEY (ID_Usuario) REFERENCES app.Usuario (ID_Usuario)
    );
    CREATE UNIQUE INDEX UK_Representante_Contato_Principal
        ON app.Representante_Contato (ID_Usuario, SG_Canal) WHERE FL_Principal = 1;
END
GO

IF OBJECT_ID(N'app.Funcao_Cessionario', N'U') IS NULL
BEGIN
    CREATE TABLE app.Funcao_Cessionario
    (
        ID_Funcao_Cessionario BIGINT IDENTITY(1, 1) NOT NULL,
        CD_Funcao_Cessionario UNIQUEIDENTIFIER NOT NULL,
        ID_Empresa_Cessionaria BIGINT NOT NULL,
        NM_Funcao NVARCHAR(100) NOT NULL,
        SG_Status NVARCHAR(20) NOT NULL,
        CONSTRAINT PK_Funcao_Cessionario PRIMARY KEY (ID_Funcao_Cessionario),
        CONSTRAINT UK_Funcao_Cessionario_CD UNIQUE (CD_Funcao_Cessionario),
        CONSTRAINT UK_Funcao_Cessionario_Empresa_Nome UNIQUE (ID_Empresa_Cessionaria, NM_Funcao),
        CONSTRAINT FK_Funcao_Cessionario_Empresa FOREIGN KEY (ID_Empresa_Cessionaria) REFERENCES app.Empresa_Cessionaria (ID_Empresa_Cessionaria)
    );
END
GO

IF OBJECT_ID(N'app.Funcao_Cessionario_Permissao', N'U') IS NULL
BEGIN
    CREATE TABLE app.Funcao_Cessionario_Permissao
    (
        ID_Funcao_Cessionario BIGINT NOT NULL,
        SG_Permissao NVARCHAR(40) NOT NULL,
        CONSTRAINT PK_Funcao_Cessionario_Permissao PRIMARY KEY (ID_Funcao_Cessionario, SG_Permissao),
        CONSTRAINT CK_Funcao_Cessionario_Permissao CHECK (SG_Permissao IN (N'CONSULTAR_EMPRESA', N'ABRIR_DEMANDA', N'RESPONDER_COMPLEMENTAR', N'ANEXAR_DOCUMENTO', N'VALIDAR_SERVICO', N'AVALIAR_ATENDIMENTO')),
        CONSTRAINT FK_Funcao_Cessionario_Permissao_Funcao FOREIGN KEY (ID_Funcao_Cessionario) REFERENCES app.Funcao_Cessionario (ID_Funcao_Cessionario)
    );
END
GO

IF OBJECT_ID(N'app.Representante_Funcao', N'U') IS NULL
BEGIN
    CREATE TABLE app.Representante_Funcao
    (
        ID_Usuario BIGINT NOT NULL,
        ID_Funcao_Cessionario BIGINT NOT NULL,
        CONSTRAINT PK_Representante_Funcao PRIMARY KEY (ID_Usuario, ID_Funcao_Cessionario),
        CONSTRAINT FK_Representante_Funcao_Usuario FOREIGN KEY (ID_Usuario) REFERENCES app.Usuario (ID_Usuario),
        CONSTRAINT FK_Representante_Funcao_Funcao FOREIGN KEY (ID_Funcao_Cessionario) REFERENCES app.Funcao_Cessionario (ID_Funcao_Cessionario)
    );
END
GO

INSERT INTO app.Espaco (CD_Espaco, CD_Identificacao, NM_Espaco, DS_Localizacao, DS_Descricao, SG_Status)
SELECT origem.CD_Espaco, origem.CD_Identificacao, origem.NM_Espaco, origem.DS_Localizacao, origem.DS_Descricao, N'ATIVO'
FROM (VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', N'SALA-205', N'Loja 205', N'Shopping, 2º piso, loja 205', N'Loja de moda de 86 m² para locação, com vitrine para o corredor.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', N'SALA-118', N'Loja 118', N'Shopping, 1º piso, loja 118', N'Loja de vestuário de 42 m² para locação.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', N'SALA-102', N'Loja 102', N'Shopping, térreo, loja 102', N'Loja de café de 54 m² para locação, ao lado da praça de alimentação.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', N'SALA-014', N'Loja 014', N'Shopping, piso de serviço, loja 014', N'Loja de mercado de 32 m² para locação, com acesso de carga.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa05', N'ACESSO-NORTE', N'Loja Norte', N'Shopping, praça de alimentação, loja norte', N'Loja de restaurante para locação, com salão e cozinha.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa06', N'SALA-310', N'Loja 310', N'Shopping, 3º piso, loja 310', N'Loja de 70 m² para locação, com vitrine para o átrio.')
) origem(CD_Espaco, CD_Identificacao, NM_Espaco, DS_Localizacao, DS_Descricao)
WHERE NOT EXISTS
(
    SELECT 1 FROM app.Espaco existente
    WHERE existente.CD_Espaco = origem.CD_Espaco OR existente.CD_Identificacao = origem.CD_Identificacao
);
GO

INSERT INTO app.Locacao (CD_Locacao, ID_Espaco, ID_Empresa_Cessionaria, DT_Inicio)
SELECT origem.CD_Locacao, espaco.ID_Espaco, empresa.ID_Empresa_Cessionaria, origem.DT_Inicio
FROM (VALUES
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', N'Empresa Exemplo', CONVERT(date, '20240312', 112)),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', N'Empresa Exemplo', CONVERT(date, '20250803', 112)),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', N'Empresa B', CONVERT(date, '20230602', 112)),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb04', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', N'Empresa C', CONVERT(date, '20241119', 112)),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb05', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa05', N'Empresa D', CONVERT(date, '20250108', 112)),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb06', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa06', N'Empresa Conecta', CONVERT(date, '20250427', 112))
) origem(CD_Locacao, CD_Espaco, NM_Empresa, DT_Inicio)
JOIN app.Espaco espaco ON espaco.CD_Espaco = origem.CD_Espaco
JOIN app.Empresa_Cessionaria empresa ON empresa.NM_Empresa = origem.NM_Empresa
WHERE NOT EXISTS (SELECT 1 FROM app.Locacao existente WHERE existente.CD_Locacao = origem.CD_Locacao);
GO
