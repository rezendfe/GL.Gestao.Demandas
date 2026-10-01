-- Conteúdo de demonstração equivalente ao DemoSeed.
-- Idempotente: completa permissões, chamados, histórico, notificações e cadeia
-- sem duplicar o que 11_seed.sql / 12_espacos_locacoes.sql já gravaram.

DECLARE @Agora DATETIME2 = SYSUTCDATETIME();
DECLARE @Amanha14 DATETIME2 = DATEADD(HOUR, 14, DATEADD(DAY, 1, CAST(CAST(@Agora AS date) AS datetime2)));
DECLARE @Amanha10 DATETIME2 = DATEADD(HOUR, 10, DATEADD(DAY, 1, CAST(CAST(@Agora AS date) AS datetime2)));
DECLARE @Depois9 DATETIME2 = DATEADD(HOUR, 9, DATEADD(DAY, 2, CAST(CAST(@Agora AS date) AS datetime2)));

UPDATE app.Empresa_Cessionaria
SET DS_Logo = marcas.Logo
FROM app.Empresa_Cessionaria empresa
JOIN (VALUES
    (N'Empresa Exemplo', N'/marcas/empresa-exemplo.svg'),
    (N'Empresa B', N'/marcas/empresa-b.svg'),
    (N'Empresa C', N'/marcas/empresa-c.svg'),
    (N'Empresa D', N'/marcas/empresa-d.svg'),
    (N'Empresa Conecta', N'/marcas/empresa-conecta.svg')
) marcas(Nome, Logo) ON marcas.Nome = empresa.NM_Empresa
WHERE empresa.DS_Logo IS NULL;

UPDATE app.Usuario
SET DS_Logo_Empresa = marcas.Logo,
    DS_Foto = marcas.Foto
FROM app.Usuario usuario
JOIN (VALUES
    (N'joao.silva@empresaexemplo.com.br', N'/marcas/empresa-exemplo.svg', N'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=640&q=80'),
    (N'ana.costa@empresab.com.br', N'/marcas/empresa-b.svg', N'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=640&q=80'),
    (N'carla.dias@empresac.com.br', N'/marcas/empresa-c.svg', N'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=640&q=80'),
    (N'diego.alves@empresad.com.br', N'/marcas/empresa-d.svg', N'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80'),
    (N'marina.costa@empresaconecta.com.br', N'/marcas/empresa-conecta.svg', N'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=640&q=80')
) marcas(Email, Logo, Foto) ON marcas.Email = usuario.DS_Email
WHERE usuario.DS_Logo_Empresa IS NULL
  AND usuario.DS_Foto IS NULL;

INSERT INTO app.Funcao_Cessionario (CD_Funcao_Cessionario, ID_Empresa_Cessionaria, NM_Funcao, SG_Status)
SELECT origem.CD_Funcao, empresa.ID_Empresa_Cessionaria, N'Representante demonstrativo', N'ATIVO'
FROM (VALUES
    ('cccccccc-cccc-4ccc-8ccc-cccccccccc01', N'Empresa Exemplo'),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccc02', N'Empresa B'),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccc03', N'Empresa C'),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccc04', N'Empresa D'),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccc05', N'Empresa Conecta')
) origem(CD_Funcao, NM_Empresa)
JOIN app.Empresa_Cessionaria empresa ON empresa.NM_Empresa = origem.NM_Empresa
WHERE NOT EXISTS
(
    SELECT 1
    FROM app.Funcao_Cessionario existente
    WHERE existente.ID_Empresa_Cessionaria = empresa.ID_Empresa_Cessionaria
      AND existente.NM_Funcao = N'Representante demonstrativo'
);

INSERT INTO app.Funcao_Cessionario_Permissao (ID_Funcao_Cessionario, SG_Permissao)
SELECT funcao.ID_Funcao_Cessionario, permissao.SG_Permissao
FROM app.Funcao_Cessionario funcao
CROSS JOIN (VALUES
    (N'CONSULTAR_EMPRESA'),
    (N'ABRIR_DEMANDA'),
    (N'RESPONDER_COMPLEMENTAR'),
    (N'ANEXAR_DOCUMENTO'),
    (N'VALIDAR_SERVICO'),
    (N'AVALIAR_ATENDIMENTO')
) permissao(SG_Permissao)
WHERE funcao.NM_Funcao = N'Representante demonstrativo'
  AND funcao.SG_Status = N'ATIVO'
  AND NOT EXISTS
  (
      SELECT 1
      FROM app.Funcao_Cessionario_Permissao existente
      WHERE existente.ID_Funcao_Cessionario = funcao.ID_Funcao_Cessionario
        AND existente.SG_Permissao = permissao.SG_Permissao
  );

INSERT INTO app.Representante_Funcao (ID_Usuario, ID_Funcao_Cessionario)
SELECT usuario.ID_Usuario, funcao.ID_Funcao_Cessionario
FROM (VALUES
    (N'joao.silva@empresaexemplo.com.br', N'Empresa Exemplo'),
    (N'ana.costa@empresab.com.br', N'Empresa B'),
    (N'carla.dias@empresac.com.br', N'Empresa C'),
    (N'diego.alves@empresad.com.br', N'Empresa D'),
    (N'marina.costa@empresaconecta.com.br', N'Empresa Conecta')
) origem(Email, NM_Empresa)
JOIN app.Usuario usuario ON usuario.DS_Email = origem.Email
JOIN app.Empresa_Cessionaria empresa ON empresa.NM_Empresa = origem.NM_Empresa
JOIN app.Funcao_Cessionario funcao
  ON funcao.ID_Empresa_Cessionaria = empresa.ID_Empresa_Cessionaria
 AND funcao.NM_Funcao = N'Representante demonstrativo'
WHERE usuario.SG_Perfil = N'CESSIONARIO'
  AND NOT EXISTS
  (
      SELECT 1
      FROM app.Representante_Funcao vinculo
      WHERE vinculo.ID_Usuario = usuario.ID_Usuario
        AND vinculo.ID_Funcao_Cessionario = funcao.ID_Funcao_Cessionario
  );

INSERT INTO app.Demanda (
    CD_Demanda, CD_Protocolo, ID_Cessionario, ID_Empresa_Cessionaria, NM_Empresa, DS_Sala, DS_Descricao,
    ID_Categoria, ID_Subcategoria, ID_Area, ID_Responsavel, NM_Servico, DS_Destino,
    SG_Situacao, SG_Prioridade, NR_Prioridade, SG_Confianca, SG_Classificacao, SG_Fluxo, SG_Natureza,
    DT_Abertura, DT_Atualizacao, DT_Previsao_Atendimento, NR_Nota_Avaliacao, DS_Comentario_Avaliacao, DT_Avaliacao)
SELECT
    v.CD_Demanda, v.Protocolo, cess.ID_Usuario, cess.ID_Empresa_Cessionaria, v.Empresa, v.Sala, v.Descricao,
    cat.ID_Categoria, sub.ID_Subcategoria, area.ID_Area, resp.ID_Usuario, v.Servico, v.Destino,
    v.Situacao, v.Prioridade, v.OrdemPrioridade, N'Alta', N'Confirmada', v.Fluxo, v.Natureza,
    v.AbertoEm, DATEADD(MINUTE, 20, v.AbertoEm), v.Previsao, v.Nota, v.ComentarioNps,
    CASE WHEN v.Nota IS NULL THEN NULL ELSE DATEADD(HOUR, 3, v.AbertoEm) END
FROM (VALUES
    ('55555555-5555-4555-8555-555555555120', N'GL-2026-00120', N'joao.silva@empresaexemplo.com.br', N'Empresa Exemplo', N'Sala 205', N'Infiltração no teto, próxima à janela da sala 205.', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222201', N'responsavel.01@gleventos.com.br', N'Civil / Infiltração', N'Manutenção Civil', N'Em andamento', N'Alta', 1, N'ATENDIMENTO', N'Serviço', DATEADD(DAY, -2, @Agora), @Amanha14, NULL, NULL),
    ('55555555-5555-4555-8555-555555555123', N'GL-2026-00123', N'joao.silva@empresaexemplo.com.br', N'Empresa Exemplo', N'Sala 205', N'Ar-condicionado da sala de reunião parou de gelar.', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444403', '22222222-2222-4222-8222-222222222201', N'responsavel.01@gleventos.com.br', N'Refrigeração', N'Manutenção Refrigeração', N'Recebido', N'Média', 2, N'ATENDIMENTO', N'Serviço', DATEADD(HOUR, -6, @Agora), @Amanha10, NULL, NULL),
    ('55555555-5555-4555-8555-555555555119', N'GL-2026-00119', N'joao.silva@empresaexemplo.com.br', N'Empresa Exemplo', N'Sala 205', N'Correspondência do contrato retida na recepção.', '33333333-3333-4333-8333-333333333302', '44444444-4444-4444-8444-444444444406', '22222222-2222-4222-8222-222222222202', N'responsavel.02@gleventos.com.br', N'Recepção', N'Recepção', N'Em andamento', N'Normal', 3, N'ATENDIMENTO', N'Serviço', DATEADD(HOUR, -26, @Agora), @Depois9, NULL, NULL),
    ('55555555-5555-4555-8555-555555555118', N'GL-2026-00118', N'joao.silva@empresaexemplo.com.br', N'Empresa Exemplo', N'Sala 205', N'Credencial de visitante para a sala 205.', '33333333-3333-4333-8333-333333333303', '44444444-4444-4444-8444-444444444407', '22222222-2222-4222-8222-222222222203', N'responsavel.03@gleventos.com.br', N'Estacionamento', N'Estacionamento', N'Concluído', N'Normal', 3, N'ATENDIMENTO', N'Serviço', DATEADD(DAY, -8, @Agora), NULL, NULL, NULL),
    ('55555555-5555-4555-8555-555555555130', N'GL-2026-00130', N'ana.costa@empresab.com.br', N'Empresa B', N'Sala 102', N'Sala 102 sem refrigeração desde a manhã.', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444403', '22222222-2222-4222-8222-222222222201', N'responsavel.01@gleventos.com.br', N'Refrigeração', N'Manutenção Refrigeração', N'Recebido', N'Média', 2, N'ATENDIMENTO', N'Serviço', DATEADD(HOUR, -10, @Agora), NULL, NULL, NULL),
    ('55555555-5555-4555-8555-555555555121', N'GL-2026-00121', N'carla.dias@empresac.com.br', N'Empresa C', N'Sala 014', N'A infiltração voltou depois do conserto. Quero registrar a reclamação.', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222201', N'responsavel.01@gleventos.com.br', N'Civil / Infiltração', N'Manutenção Civil', N'Em andamento', N'Alta', 1, N'ATENDIMENTO', N'Reclamação', DATEADD(HOUR, -30, @Agora), DATEADD(HOUR, -8, @Agora), NULL, NULL),
    ('55555555-5555-4555-8555-555555555122', N'GL-2026-00122', N'ana.costa@empresab.com.br', N'Empresa B', N'Sala 102', N'O ar-condicionado foi religado e parou de novo no dia seguinte.', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444403', '22222222-2222-4222-8222-222222222201', N'responsavel.01@gleventos.com.br', N'Refrigeração', N'Manutenção Refrigeração', N'Concluído', N'Alta', 1, N'ATENDIMENTO', N'Reclamação', DATEADD(DAY, -4, @Agora), NULL, 3, N'O reparo voltou no dia seguinte.'),
    ('55555555-5555-4555-8555-555555555124', N'GL-2026-00124', N'diego.alves@empresad.com.br', N'Empresa D', N'Acesso norte', N'Troca do disjuntor do acesso norte.', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444402', '22222222-2222-4222-8222-222222222201', N'responsavel.01@gleventos.com.br', N'Elétrica', N'Manutenção Elétrica', N'Concluído', N'Normal', 3, N'ATENDIMENTO', N'Serviço', DATEADD(DAY, -3, @Agora), NULL, 10, N'Resolveu no mesmo dia.')
) v(CD_Demanda, Protocolo, EmailCess, Empresa, Sala, Descricao, Cat, Sub, Area, EmailResp, Servico, Destino, Situacao, Prioridade, OrdemPrioridade, Fluxo, Natureza, AbertoEm, Previsao, Nota, ComentarioNps)
JOIN app.Usuario cess ON cess.DS_Email = v.EmailCess
JOIN app.Categoria cat ON cat.CD_Categoria = v.Cat
JOIN app.Subcategoria sub ON sub.CD_Subcategoria = v.Sub
JOIN app.Area area ON area.CD_Area = v.Area
LEFT JOIN app.Usuario resp ON resp.DS_Email = v.EmailResp
WHERE NOT EXISTS (SELECT 1 FROM app.Demanda existente WHERE existente.CD_Demanda = v.CD_Demanda OR existente.CD_Protocolo = v.Protocolo);

UPDATE app.Demanda
SET DT_Previsao_Atendimento = CASE CD_Protocolo
        WHEN N'GL-2026-00127' THEN DATEADD(HOUR, -4, @Agora)
        WHEN N'GL-2026-00126' THEN DATEADD(HOUR, -3, @Agora)
    END
WHERE CD_Protocolo IN (N'GL-2026-00127', N'GL-2026-00126')
  AND DT_Previsao_Atendimento IS NULL;

UPDATE app.Demanda
SET NR_Nota_Avaliacao = 10,
    DS_Comentario_Avaliacao = N'A vaga ficou disponível no mesmo dia.',
    DT_Avaliacao = DATEADD(HOUR, 3, DT_Abertura)
WHERE CD_Protocolo = N'GL-2026-00125'
  AND NR_Nota_Avaliacao IS NULL;

INSERT INTO app.Mensagem (CD_Mensagem, ID_Demanda, ID_Autor, DS_Texto, SG_Canal, SG_Finalidade, DT_Envio)
SELECT v.CD_Mensagem, d.ID_Demanda, d.ID_Cessionario, d.DS_Descricao, N'PORTAL', N'mensagem', d.DT_Abertura
FROM (VALUES
    ('88888888-8888-4888-8118-000000000010', '55555555-5555-4555-8555-555555555118'),
    ('88888888-8888-4888-8119-000000000010', '55555555-5555-4555-8555-555555555119'),
    ('88888888-8888-4888-8120-000000000010', '55555555-5555-4555-8555-555555555120'),
    ('88888888-8888-4888-8121-000000000010', '55555555-5555-4555-8555-555555555121'),
    ('88888888-8888-4888-8122-000000000010', '55555555-5555-4555-8555-555555555122'),
    ('88888888-8888-4888-8123-000000000010', '55555555-5555-4555-8555-555555555123'),
    ('88888888-8888-4888-8124-000000000010', '55555555-5555-4555-8555-555555555124'),
    ('88888888-8888-4888-8125-000000000010', '55555555-5555-4555-8555-555555555125'),
    ('88888888-8888-4888-8126-000000000010', '55555555-5555-4555-8555-555555555126'),
    ('88888888-8888-4888-8127-000000000010', '55555555-5555-4555-8555-555555555127'),
    ('88888888-8888-4888-8130-000000000010', '55555555-5555-4555-8555-555555555130'),
    ('88888888-8888-4888-8131-000000000010', '55555555-5555-4555-8555-555555555131')
) v(CD_Mensagem, CD_Demanda)
JOIN app.Demanda d ON d.CD_Demanda = v.CD_Demanda
WHERE NOT EXISTS (SELECT 1 FROM app.Mensagem existente WHERE existente.CD_Mensagem = v.CD_Mensagem)
  AND NOT EXISTS
  (
      SELECT 1
      FROM app.Mensagem existente
      WHERE existente.ID_Demanda = d.ID_Demanda
        AND existente.SG_Canal = N'PORTAL'
        AND existente.DS_Texto = d.DS_Descricao
  );

INSERT INTO app.Mensagem (CD_Mensagem, ID_Demanda, ID_Autor, DS_Texto, SG_Canal, SG_Finalidade, DT_Envio)
SELECT '88888888-8888-4888-8888-888888888812', d.ID_Demanda, resp.ID_Usuario,
    N'Envie uma foto do ponto da infiltração para complementar o chamado.',
    N'PORTAL', N'complemento', DATEADD(HOUR, -1, @Agora)
FROM app.Demanda d
JOIN app.Usuario resp ON resp.DS_Email = N'responsavel.01@gleventos.com.br'
WHERE d.CD_Protocolo = N'GL-2026-00120'
  AND NOT EXISTS (SELECT 1 FROM app.Mensagem existente WHERE existente.CD_Mensagem = '88888888-8888-4888-8888-888888888812');

INSERT INTO app.Historico_Demanda (CD_Historico, ID_Demanda, ID_Usuario, SG_Status_Anterior, SG_Status_Novo, DS_Comentario, SG_Tipo_Evento, DT_Evento)
SELECT v.CD_Historico, d.ID_Demanda, u.ID_Usuario, v.Anterior, v.Novo, v.Comentario, v.Tipo, DATEADD(MINUTE, v.Minutos, d.DT_Abertura)
FROM (VALUES
    ('88888888-8888-4888-8118-000000000001', '55555555-5555-4555-8555-555555555118', N'joao.silva@empresaexemplo.com.br', NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', 0),
    ('88888888-8888-4888-8118-000000000003', '55555555-5555-4555-8555-555555555118', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Estacionamento.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8118-000000000004', '55555555-5555-4555-8555-555555555118', N'responsavel.03@gleventos.com.br', N'Recebido', N'Em andamento', N'Atendimento iniciado.', N'ANDAMENTO', 20),
    ('88888888-8888-4888-8118-000000000005', '55555555-5555-4555-8555-555555555118', N'responsavel.03@gleventos.com.br', N'Em andamento', N'Concluído', N'Credencial emitida e entregue na recepção.', N'ANDAMENTO', 120),

    ('88888888-8888-4888-8119-000000000001', '55555555-5555-4555-8555-555555555119', N'joao.silva@empresaexemplo.com.br', NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', 0),
    ('88888888-8888-4888-8119-000000000003', '55555555-5555-4555-8555-555555555119', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Recepção.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8119-000000000004', '55555555-5555-4555-8555-555555555119', N'responsavel.02@gleventos.com.br', N'Recebido', N'Em andamento', N'Envelope localizado. Aguardando a retirada na recepção.', N'ANDAMENTO', 20),

    ('88888888-8888-4888-8120-000000000001', '55555555-5555-4555-8555-555555555120', N'joao.silva@empresaexemplo.com.br', NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', 0),
    ('88888888-8888-4888-8120-000000000003', '55555555-5555-4555-8555-555555555120', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Manutenção.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8120-000000000004', '55555555-5555-4555-8555-555555555120', N'responsavel.01@gleventos.com.br', N'Recebido', N'Em andamento', N'Vistoria conferida com a foto da última inspeção. Aguardando a intervenção hidráulica.', N'ANDAMENTO', 20),

    ('88888888-8888-4888-8121-000000000001', '55555555-5555-4555-8555-555555555121', N'carla.dias@empresac.com.br', NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', 0),
    ('88888888-8888-4888-8121-000000000002', '55555555-5555-4555-8555-555555555121', N'carla.dias@empresac.com.br', N'Novo', N'Novo', N'Chamado aberto como reclamação.', N'RECLAMACAO', 0),
    ('88888888-8888-4888-8121-000000000003', '55555555-5555-4555-8555-555555555121', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Manutenção.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8121-000000000004', '55555555-5555-4555-8555-555555555121', N'responsavel.01@gleventos.com.br', N'Recebido', N'Em andamento', N'Retorno aberto como reclamação. A equipe voltou ao ponto.', N'ANDAMENTO', 20),

    ('88888888-8888-4888-8122-000000000001', '55555555-5555-4555-8555-555555555122', N'ana.costa@empresab.com.br', NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', 0),
    ('88888888-8888-4888-8122-000000000002', '55555555-5555-4555-8555-555555555122', N'ana.costa@empresab.com.br', N'Novo', N'Novo', N'Chamado aberto como reclamação.', N'RECLAMACAO', 0),
    ('88888888-8888-4888-8122-000000000003', '55555555-5555-4555-8555-555555555122', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Manutenção.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8122-000000000004', '55555555-5555-4555-8555-555555555122', N'responsavel.01@gleventos.com.br', N'Recebido', N'Em andamento', N'Atendimento iniciado.', N'ANDAMENTO', 20),
    ('88888888-8888-4888-8122-000000000005', '55555555-5555-4555-8555-555555555122', N'responsavel.01@gleventos.com.br', N'Em andamento', N'Concluído', N'Segundo atendimento concluído.', N'ANDAMENTO', 120),
    ('88888888-8888-4888-8122-000000000006', '55555555-5555-4555-8555-555555555122', N'ana.costa@empresab.com.br', N'Concluído', N'Concluído', N'Avaliação do atendimento: 3. O reparo voltou no dia seguinte.', N'AVALIACAO', 180),

    ('88888888-8888-4888-8123-000000000001', '55555555-5555-4555-8555-555555555123', N'joao.silva@empresaexemplo.com.br', NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', 0),
    ('88888888-8888-4888-8123-000000000003', '55555555-5555-4555-8555-555555555123', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Manutenção.', N'REDIRECIONAMENTO', 5),

    ('88888888-8888-4888-8124-000000000001', '55555555-5555-4555-8555-555555555124', N'diego.alves@empresad.com.br', NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', 0),
    ('88888888-8888-4888-8124-000000000003', '55555555-5555-4555-8555-555555555124', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Manutenção.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8124-000000000004', '55555555-5555-4555-8555-555555555124', N'responsavel.01@gleventos.com.br', N'Recebido', N'Em andamento', N'Atendimento iniciado.', N'ANDAMENTO', 20),
    ('88888888-8888-4888-8124-000000000005', '55555555-5555-4555-8555-555555555124', N'responsavel.01@gleventos.com.br', N'Em andamento', N'Concluído', N'Disjuntor substituído.', N'ANDAMENTO', 120),
    ('88888888-8888-4888-8124-000000000006', '55555555-5555-4555-8555-555555555124', N'diego.alves@empresad.com.br', N'Concluído', N'Concluído', N'Avaliação do atendimento: 10. Resolveu no mesmo dia.', N'AVALIACAO', 180),

    ('88888888-8888-4888-8125-000000000003', '55555555-5555-4555-8555-555555555125', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Estacionamento.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8125-000000000004', '55555555-5555-4555-8555-555555555125', N'responsavel.03@gleventos.com.br', N'Recebido', N'Em andamento', N'Atendimento iniciado.', N'ANDAMENTO', 20),
    ('88888888-8888-4888-8125-000000000005', '55555555-5555-4555-8555-555555555125', N'responsavel.03@gleventos.com.br', N'Em andamento', N'Concluído', N'Cadastro concluído.', N'ANDAMENTO', 120),
    ('88888888-8888-4888-8125-000000000006', '55555555-5555-4555-8555-555555555125', N'diego.alves@empresad.com.br', N'Concluído', N'Concluído', N'Avaliação do atendimento: 10. A vaga ficou disponível no mesmo dia.', N'AVALIACAO', 180),

    ('88888888-8888-4888-8126-000000000003', '55555555-5555-4555-8555-555555555126', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Recepção.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8126-000000000004', '55555555-5555-4555-8555-555555555126', N'responsavel.02@gleventos.com.br', N'Recebido', N'Em andamento', N'Documento localizado, aguardando retirada.', N'ANDAMENTO', 20),

    ('88888888-8888-4888-8127-000000000003', '55555555-5555-4555-8555-555555555127', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Manutenção.', N'REDIRECIONAMENTO', 5),
    ('88888888-8888-4888-8127-000000000004', '55555555-5555-4555-8555-555555555127', N'responsavel.01@gleventos.com.br', N'Recebido', N'Em andamento', N'Em atendimento pela área.', N'ANDAMENTO', 20),

    ('88888888-8888-4888-8130-000000000001', '55555555-5555-4555-8555-555555555130', N'ana.costa@empresab.com.br', NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', 0),
    ('88888888-8888-4888-8130-000000000003', '55555555-5555-4555-8555-555555555130', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Manutenção.', N'REDIRECIONAMENTO', 5),

    ('88888888-8888-4888-8131-000000000003', '55555555-5555-4555-8555-555555555131', N'patricia.lima@gleventos.com.br', N'Novo', N'Recebido', N'Demanda direcionada para Infraestrutura.', N'REDIRECIONAMENTO', 5)
) v(CD_Historico, CD_Demanda, Email, Anterior, Novo, Comentario, Tipo, Minutos)
JOIN app.Demanda d ON d.CD_Demanda = v.CD_Demanda
JOIN app.Usuario u ON u.DS_Email = v.Email
WHERE NOT EXISTS (SELECT 1 FROM app.Historico_Demanda existente WHERE existente.CD_Historico = v.CD_Historico)
  AND NOT EXISTS
  (
      SELECT 1
      FROM app.Historico_Demanda existente
      WHERE existente.ID_Demanda = d.ID_Demanda
        AND existente.SG_Tipo_Evento = v.Tipo
        AND existente.DS_Comentario = v.Comentario
  );

INSERT INTO app.Notificacao (CD_Notificacao, ID_Demanda, ID_Usuario, DS_Texto, SG_Leitura, DT_Criacao)
SELECT v.CD_Notificacao, d.ID_Demanda, u.ID_Usuario, v.Texto, N'NAO_LIDA', v.CriadaEm
FROM (VALUES
    ('88888888-8888-4888-8888-888888888801', N'GL-2026-00120', N'joao.silva@empresaexemplo.com.br', N'Sua solicitação GL-2026-00120 está em atendimento.', DATEADD(HOUR, -2, @Agora)),
    ('88888888-8888-4888-8888-888888888802', N'GL-2026-00120', N'joao.silva@empresaexemplo.com.br', N'Envie uma foto do ponto da infiltração para complementar o chamado.', DATEADD(HOUR, -1, @Agora))
) v(CD_Notificacao, Protocolo, Email, Texto, CriadaEm)
JOIN app.Demanda d ON d.CD_Protocolo = v.Protocolo
JOIN app.Usuario u ON u.DS_Email = v.Email
WHERE NOT EXISTS (SELECT 1 FROM app.Notificacao existente WHERE existente.CD_Notificacao = v.CD_Notificacao);

INSERT INTO app.Etapa_Cadeia (ID_Subcategoria, SG_Etapa, NM_Etapa, NR_Ordem, FL_Automatica, DS_Campos)
SELECT sub.ID_Subcategoria, etapa.Codigo, etapa.Nome, etapa.Ordem,
    CASE WHEN etapa.Codigo = N'aprovacao' AND sub.CD_Subcategoria = '44444444-4444-4444-8444-444444444403' THEN 1 ELSE 0 END,
    etapa.Campos
FROM app.Subcategoria sub
CROSS JOIN (VALUES
    (N'solicitacao', N'Solicitação', 1, N''),
    (N'aprovacao', N'Aprovação', 2, N'comentario:1'),
    (N'atendimento', N'Atendimento', 3, N'comentario:1,previsao:1'),
    (N'validacao', N'Validação do cliente', 4, N'comentario:1'),
    (N'conclusao', N'Conclusão', 5, N'')
) etapa(Codigo, Nome, Ordem, Campos)
WHERE NOT EXISTS
(
    SELECT 1
    FROM app.Etapa_Cadeia existente
    WHERE existente.ID_Subcategoria = sub.ID_Subcategoria
);
GO
