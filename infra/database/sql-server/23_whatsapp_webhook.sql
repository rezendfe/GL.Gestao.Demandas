-- Eventos recebidos do webhook da Meta (mensagem do cliente e status de entrega).
IF OBJECT_ID(N'app.WhatsApp_Evento', N'U') IS NULL
BEGIN
    CREATE TABLE app.WhatsApp_Evento
    (
        ID_WhatsApp_Evento BIGINT IDENTITY(1, 1) NOT NULL,
        CD_WhatsApp_Evento UNIQUEIDENTIFIER NOT NULL,
        SG_Tipo NVARCHAR(20) NOT NULL,
        DS_Id_Mensagem NVARCHAR(180) NULL,
        DS_Telefone NVARCHAR(20) NULL,
        NM_Contato NVARCHAR(200) NULL,
        DS_Texto NVARCHAR(4000) NULL,
        SG_Status NVARCHAR(20) NOT NULL CONSTRAINT DF_WhatsApp_Evento_Status DEFAULT (N''),
        DS_Phone_Number_Id NVARCHAR(40) NULL,
        DT_Evento DATETIME2 NULL,
        DT_Recebido DATETIME2 NOT NULL,
        DS_Payload NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_WhatsApp_Evento PRIMARY KEY (ID_WhatsApp_Evento),
        CONSTRAINT UK_WhatsApp_Evento_CD UNIQUE (CD_WhatsApp_Evento)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_WhatsApp_Evento_Chave' AND object_id = OBJECT_ID(N'app.WhatsApp_Evento'))
    CREATE UNIQUE INDEX UK_WhatsApp_Evento_Chave
        ON app.WhatsApp_Evento (DS_Id_Mensagem, SG_Tipo, SG_Status)
        WHERE DS_Id_Mensagem IS NOT NULL;
GO
