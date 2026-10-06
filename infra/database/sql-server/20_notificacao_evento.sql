-- Liga a notificação do portal à mensagem da conversa, para abrir o evento correspondente.
IF COL_LENGTH(N'app.Notificacao', N'ID_Mensagem') IS NULL
BEGIN
    ALTER TABLE app.Notificacao ADD ID_Mensagem BIGINT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Notificacao_Mensagem')
BEGIN
    ALTER TABLE app.Notificacao ADD CONSTRAINT FK_Notificacao_Mensagem
        FOREIGN KEY (ID_Mensagem) REFERENCES app.Mensagem (ID_Mensagem);
END
GO

UPDATE n
SET ID_Mensagem = escolhida.ID_Mensagem
FROM app.Notificacao n
CROSS APPLY
(
    SELECT TOP 1 m.ID_Mensagem
    FROM app.Mensagem m
    WHERE m.ID_Demanda = n.ID_Demanda
      AND m.DS_Texto = n.DS_Texto
      AND LEN(m.DS_Texto) > 0
    ORDER BY ABS(DATEDIFF(SECOND, m.DT_Envio, n.DT_Criacao)), m.ID_Mensagem DESC
) escolhida
WHERE n.ID_Mensagem IS NULL;
GO

UPDATE n
SET ID_Mensagem = escolhida.ID_Mensagem
FROM app.Notificacao n
CROSS APPLY
(
    SELECT TOP 1 a.ID_Mensagem
    FROM app.Anexo a
    WHERE a.ID_Demanda = n.ID_Demanda
      AND a.ID_Mensagem IS NOT NULL
      AND
      (
          (n.DS_Texto = N'Áudio enviado.' AND a.SG_Tipo_Midia LIKE N'audio/%')
          OR (n.DS_Texto = N'Imagem enviada.' AND a.SG_Tipo_Midia LIKE N'image/%')
          OR
          (
              n.DS_Texto = N'Arquivo enviado.'
              AND a.SG_Tipo_Midia NOT LIKE N'audio/%'
              AND a.SG_Tipo_Midia NOT LIKE N'image/%'
          )
      )
    ORDER BY ABS(DATEDIFF(SECOND, a.DT_Envio, n.DT_Criacao)), a.ID_Mensagem DESC
) escolhida
WHERE n.ID_Mensagem IS NULL;
GO

UPDATE n
SET ID_Mensagem = escolhida.ID_Mensagem
FROM app.Notificacao n
CROSS APPLY
(
    SELECT TOP 1 m.ID_Mensagem
    FROM app.Mensagem m
    WHERE m.ID_Demanda = n.ID_Demanda
      AND m.SG_Canal = N'MENSAGERIA'
      AND ABS(DATEDIFF(SECOND, m.DT_Envio, n.DT_Criacao)) <= 120
    ORDER BY ABS(DATEDIFF(SECOND, m.DT_Envio, n.DT_Criacao)), m.ID_Mensagem DESC
) escolhida
WHERE n.ID_Mensagem IS NULL
  AND (n.DS_Texto LIKE N'%está em atendimento.%' OR n.DS_Texto LIKE N'%aguarda a sua validação.%');
GO
