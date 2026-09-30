IF NOT EXISTS (SELECT 1 FROM app.Usuario)
BEGIN
DECLARE @Agora DATETIME2 = SYSUTCDATETIME();
DECLARE @Senha CHAR(64) = '6269bdc44514c668efb1ee9442d68ac81c662367fa36c1883e3027ee197f4036';

INSERT INTO app.Area (CD_Area, NM_Area, SG_Status) VALUES
('22222222-2222-4222-8222-222222222201', N'Manutenção', N'ATIVO'),
('22222222-2222-4222-8222-222222222202', N'Recepção', N'ATIVO'),
('22222222-2222-4222-8222-222222222203', N'Estacionamento', N'ATIVO'),
('22222222-2222-4222-8222-222222222204', N'Obras', N'ATIVO'),
('22222222-2222-4222-8222-222222222205', N'Infraestrutura', N'ATIVO');

INSERT INTO app.Categoria (CD_Categoria, NM_Categoria, SG_Status) VALUES
('33333333-3333-4333-8333-333333333301', N'Manutenção', N'ATIVO'),
('33333333-3333-4333-8333-333333333302', N'Recepção', N'ATIVO'),
('33333333-3333-4333-8333-333333333303', N'Estacionamento', N'ATIVO'),
('33333333-3333-4333-8333-333333333304', N'Infraestrutura', N'ATIVO');

INSERT INTO app.Subcategoria (CD_Subcategoria, ID_Categoria, ID_Area, NM_Subcategoria, SG_Fluxo, SG_Status)
SELECT v.CD, c.ID_Categoria, a.ID_Area, v.NM, v.Fluxo, N'ATIVO'
FROM (VALUES
    ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', N'Civil', N'ATENDIMENTO'),
    ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', N'Elétrica', N'ATENDIMENTO'),
    ('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', N'Refrigeração', N'ATENDIMENTO'),
    ('44444444-4444-4444-8444-444444444404', '33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222204', N'Obras', N'OBRA'),
    ('44444444-4444-4444-8444-444444444405', '33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222205', N'Fibra', N'APROVACAO'),
    ('44444444-4444-4444-8444-444444444406', '33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', N'Correspondências', N'ATENDIMENTO'),
    ('44444444-4444-4444-8444-444444444407', '33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222203', N'Vagas', N'ATENDIMENTO')
) v(CD, Cat, Area, NM, Fluxo)
JOIN app.Categoria c ON c.CD_Categoria = v.Cat
JOIN app.Area a ON a.CD_Area = v.Area;

INSERT INTO app.Usuario (CD_Usuario, NM_Usuario, DS_Email, DS_Senha_Hash, SG_Perfil, NM_Empresa, DS_Sala, ID_Area, SG_Status)
SELECT v.CD, v.NM, v.Email, @Senha, v.Perfil, v.Empresa, v.Sala, a.ID_Area, N'ATIVO'
FROM (VALUES
    ('11111111-1111-4111-8111-111111111101', N'João Silva', N'joao.silva@empresaexemplo.com.br', N'CESSIONARIO', N'Empresa Exemplo', N'Sala 205', NULL),
    ('11111111-1111-4111-8111-111111111102', N'Patrícia Lima', N'patricia.lima@gleventos.com.br', N'GL_ADMINISTRADOR', N'GL events', NULL, NULL),
    ('11111111-1111-4111-8111-111111111103', N'Responsável 01', N'responsavel.01@gleventos.com.br', N'RESPONSAVEL_AREA', N'GL events', NULL, '22222222-2222-4222-8222-222222222201'),
    ('11111111-1111-4111-8111-111111111104', N'Responsável 02', N'responsavel.02@gleventos.com.br', N'RESPONSAVEL_AREA', N'GL events', NULL, '22222222-2222-4222-8222-222222222202'),
    ('11111111-1111-4111-8111-111111111105', N'Responsável 03', N'responsavel.03@gleventos.com.br', N'RESPONSAVEL_AREA', N'GL events', NULL, '22222222-2222-4222-8222-222222222203'),
    ('11111111-1111-4111-8111-111111111106', N'Ana Costa', N'ana.costa@empresab.com.br', N'CESSIONARIO', N'Empresa B', N'Sala 102', NULL),
    ('11111111-1111-4111-8111-111111111107', N'Carla Dias', N'carla.dias@empresac.com.br', N'CESSIONARIO', N'Empresa C', N'Sala 014', NULL),
    ('11111111-1111-4111-8111-111111111108', N'Diego Alves', N'diego.alves@empresad.com.br', N'CESSIONARIO', N'Empresa D', N'Acesso norte', NULL),
    ('11111111-1111-4111-8111-111111111109', N'Marina Costa', N'marina.costa@empresaconecta.com.br', N'CESSIONARIO', N'Empresa Conecta', N'Sala 310', NULL)
) v(CD, NM, Email, Perfil, Empresa, Sala, Area)
LEFT JOIN app.Area a ON a.CD_Area = v.Area;

INSERT INTO app.Regra_Classificacao (CD_Regra, DS_Termo, ID_Subcategoria, NM_Servico, DS_Destino, DS_Resumo, SG_Prioridade, NR_Prioridade, SG_Confianca, NR_Ordem)
SELECT v.CD, v.Termo, s.ID_Subcategoria, v.Servico, v.Destino, v.Resumo, v.Prioridade, v.OrdemPrioridade, N'Alta', v.Ordem
FROM (VALUES
    ('77777777-7777-4777-8777-777777777701', N'infiltracao', '44444444-4444-4444-8444-444444444401', N'Civil / Infiltração', N'Manutenção Civil', N'Manutenção > Civil > Infiltração', N'Alta', 1, 1),
    ('77777777-7777-4777-8777-777777777702', N'teto', '44444444-4444-4444-8444-444444444401', N'Civil / Infiltração', N'Manutenção Civil', N'Manutenção > Civil > Infiltração', N'Alta', 1, 2),
    ('77777777-7777-4777-8777-777777777703', N'agua', '44444444-4444-4444-8444-444444444401', N'Civil / Infiltração', N'Manutenção Civil', N'Manutenção > Civil > Infiltração', N'Alta', 1, 3),
    ('77777777-7777-4777-8777-777777777704', N'ar-condicionado', '44444444-4444-4444-8444-444444444403', N'Refrigeração', N'Manutenção Refrigeração', N'Manutenção > Refrigeração', N'Média', 2, 4),
    ('77777777-7777-4777-8777-777777777705', N'ar condicionado', '44444444-4444-4444-8444-444444444403', N'Refrigeração', N'Manutenção Refrigeração', N'Manutenção > Refrigeração', N'Média', 2, 5),
    ('77777777-7777-4777-8777-777777777706', N'refrigeracao', '44444444-4444-4444-8444-444444444403', N'Refrigeração', N'Manutenção Refrigeração', N'Manutenção > Refrigeração', N'Média', 2, 6),
    ('77777777-7777-4777-8777-777777777707', N'fibra', '44444444-4444-4444-8444-444444444405', N'Fibra', N'Aprovação GL', N'Solicitação sujeita à aprovação GL', N'Normal', 3, 7)
) v(CD, Termo, Sub, Servico, Destino, Resumo, Prioridade, OrdemPrioridade, Ordem)
JOIN app.Subcategoria s ON s.CD_Subcategoria = v.Sub;

INSERT INTO app.Demanda (
    CD_Demanda, CD_Protocolo, ID_Cessionario, NM_Empresa, DS_Sala, DS_Descricao,
    ID_Categoria, ID_Subcategoria, ID_Area, ID_Responsavel, NM_Servico, DS_Destino,
    SG_Situacao, SG_Prioridade, NR_Prioridade, SG_Confianca, SG_Classificacao, SG_Fluxo,
    DT_Abertura, DT_Atualizacao)
SELECT v.CD, v.Protocolo, cess.ID_Usuario, v.Empresa, v.Sala, v.Descricao,
    cat.ID_Categoria, sub.ID_Subcategoria, area.ID_Area, resp.ID_Usuario, v.Servico, v.Destino,
    v.Situacao, v.Prioridade, v.OrdemPrioridade, N'Alta', N'Confirmada', v.Fluxo,
    v.AbertoEm, DATEADD(MINUTE, 20, v.AbertoEm)
FROM (VALUES
    ('55555555-5555-4555-8555-555555555127', N'GL-2026-00127', '11111111-1111-4111-8111-111111111106', N'Empresa B', N'Sala 102', N'Quadro elétrico com disjuntor desarmando.', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444402', '22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111103', N'Elétrica', N'Manutenção Elétrica', N'Em andamento', N'Média', 2, N'ATENDIMENTO', DATEADD(MINUTE, -75, @Agora)),
    ('55555555-5555-4555-8555-555555555126', N'GL-2026-00126', '11111111-1111-4111-8111-111111111107', N'Empresa C', N'Sala 014', N'Correspondência retida na recepção.', '33333333-3333-4333-8333-333333333302', '44444444-4444-4444-8444-444444444406', '22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111104', N'Recepção', N'Recepção', N'Em andamento', N'Normal', 3, N'ATENDIMENTO', DATEADD(HOUR, -3, @Agora)),
    ('55555555-5555-4555-8555-555555555125', N'GL-2026-00125', '11111111-1111-4111-8111-111111111108', N'Empresa D', N'Acesso norte', N'Cadastro de vaga adicional.', '33333333-3333-4333-8333-333333333303', '44444444-4444-4444-8444-444444444407', '22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111105', N'Estacionamento', N'Estacionamento', N'Concluído', N'Normal', 3, N'ATENDIMENTO', DATEADD(DAY, -1, @Agora)),
    ('55555555-5555-4555-8555-555555555131', N'GL-2026-00131', '11111111-1111-4111-8111-111111111109', N'Empresa Conecta', N'Sala 310', N'Instalação de fibra de internet.', '33333333-3333-4333-8333-333333333304', '44444444-4444-4444-8444-444444444405', '22222222-2222-4222-8222-222222222205', NULL, N'Fibra', N'Aprovação GL', N'Aguardando aprovação', N'Normal', 3, N'APROVACAO', DATEADD(HOUR, -5, @Agora))
) v(CD, Protocolo, Cess, Empresa, Sala, Descricao, Cat, Sub, Area, Resp, Servico, Destino, Situacao, Prioridade, OrdemPrioridade, Fluxo, AbertoEm)
JOIN app.Usuario cess ON cess.CD_Usuario = v.Cess
JOIN app.Categoria cat ON cat.CD_Categoria = v.Cat
JOIN app.Subcategoria sub ON sub.CD_Subcategoria = v.Sub
JOIN app.Area area ON area.CD_Area = v.Area
LEFT JOIN app.Usuario resp ON resp.CD_Usuario = v.Resp;

INSERT INTO app.Mensagem (CD_Mensagem, ID_Demanda, ID_Autor, DS_Texto, SG_Canal, DT_Envio)
SELECT NEWID(), d.ID_Demanda, d.ID_Cessionario, d.DS_Descricao, N'PORTAL', d.DT_Abertura
FROM app.Demanda d;

INSERT INTO app.Anexo (CD_Anexo, ID_Demanda, NM_Arquivo, DS_Caminho, SG_Tipo_Midia, MD_Tamanho_Bytes, DT_Envio)
SELECT '55555555-5555-4555-8555-555555555191', d.ID_Demanda, N'Projeto_Fibra.pdf', N'seed/Projeto_Fibra.pdf', N'application/pdf', 1024, d.DT_Abertura
FROM app.Demanda d
WHERE d.CD_Protocolo = N'GL-2026-00131';

INSERT INTO app.Historico_Demanda (CD_Historico, ID_Demanda, ID_Usuario, SG_Status_Anterior, SG_Status_Novo, DS_Comentario, SG_Tipo_Evento, DT_Evento)
SELECT NEWID(), d.ID_Demanda, d.ID_Cessionario, NULL, N'Novo', N'Chamado aberto.', N'ABERTURA', d.DT_Abertura
FROM app.Demanda d;

INSERT INTO app.Obra (CD_Obra, NM_Obra, DS_Local, DS_Descricao, DT_Inicio_Previsto, DT_Termino_Previsto, NM_Empresa_Executora, NM_Responsavel, DS_Contato, SG_Etapa)
VALUES (
    '66666666-6666-4666-8666-666666666601',
    N'Modernização do foyer',
    N'Pavilhão 2',
    N'Intervenção civil no foyer, com adequação de piso e forro.',
    '2026-10-06',
    '2026-12-18',
    N'Construtora Exemplo',
    N'Carlos Mendes',
    N'carlos.mendes@construtoraexemplo.com.br',
    N'Análise');

INSERT INTO app.Obra_Documento (CD_Obra_Documento, ID_Obra, NM_Documento, SG_Situacao, NR_Ordem)
SELECT v.CD, o.ID_Obra, v.NM, v.Situacao, v.Ordem
FROM (VALUES
    ('66666666-6666-4666-8666-666666666611', N'Projeto Executivo', N'Recebido', 1),
    ('66666666-6666-4666-8666-666666666612', N'ART', N'Pendente', 2),
    ('66666666-6666-4666-8666-666666666613', N'Seguro da Obra', N'Pendente', 3),
    ('66666666-6666-4666-8666-666666666614', N'Cronograma', N'Pendente', 4)
) v(CD, NM, Situacao, Ordem)
JOIN app.Obra o ON o.CD_Obra = '66666666-6666-4666-8666-666666666601';
END
GO
