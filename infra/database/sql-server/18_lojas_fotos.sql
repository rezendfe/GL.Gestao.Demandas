-- Lojas do shopping, foto de cada pessoa da demonstração e anexos para abrir no portal.
-- Idempotente: pode ser reaplicado.

UPDATE app.Usuario
SET DS_Foto = fotos.Foto
FROM app.Usuario usuario
JOIN (VALUES
    (N'joao.silva@empresaexemplo.com.br', N'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=640&q=80'),
    (N'ana.costa@empresab.com.br', N'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=640&q=80'),
    (N'carla.dias@empresac.com.br', N'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=640&q=80'),
    (N'diego.alves@empresad.com.br', N'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80'),
    (N'marina.costa@empresaconecta.com.br', N'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=640&q=80'),
    (N'patricia.lima@gleventos.com.br', N'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=640&q=80'),
    (N'responsavel.01@gleventos.com.br', N'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=640&q=80'),
    (N'responsavel.02@gleventos.com.br', N'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=640&q=80'),
    (N'responsavel.03@gleventos.com.br', N'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=640&q=80')
) fotos(Email, Foto) ON fotos.Email = usuario.DS_Email
WHERE usuario.DS_Foto IS NULL OR usuario.DS_Foto <> fotos.Foto;

UPDATE app.Espaco
SET NM_Espaco = origem.Nome,
    DS_Localizacao = origem.Localizacao,
    DS_Descricao = origem.Descricao
FROM app.Espaco espaco
JOIN (VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', N'Loja 205', N'Shopping, 2º piso, loja 205', N'Loja de moda de 86 m² para locação, com vitrine para o corredor.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', N'Loja 118', N'Shopping, 1º piso, loja 118', N'Loja de vestuário de 42 m² para locação.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', N'Loja 102', N'Shopping, térreo, loja 102', N'Loja de café de 54 m² para locação, ao lado da praça de alimentação.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', N'Loja 014', N'Shopping, piso de serviço, loja 014', N'Loja de mercado de 32 m² para locação, com acesso de carga.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa05', N'Loja Norte', N'Shopping, praça de alimentação, loja norte', N'Loja de restaurante para locação, com salão e cozinha.'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa06', N'Loja 310', N'Shopping, 3º piso, loja 310', N'Loja de 70 m² para locação, com vitrine para o átrio.')
) origem(CD_Espaco, Nome, Localizacao, Descricao) ON origem.CD_Espaco = espaco.CD_Espaco;

INSERT INTO app.Anexo (CD_Anexo, ID_Demanda, NM_Arquivo, DS_Caminho, SG_Tipo_Midia, MD_Tamanho_Bytes, DT_Envio)
SELECT origem.CD_Anexo, demanda.ID_Demanda, origem.Nome, origem.Caminho, origem.Tipo, 1024, demanda.DT_Abertura
FROM (VALUES
    ('55555555-5555-4555-8555-555555555192', N'Vitrine_Loja.jpg', N'seed/Vitrine_Loja.jpg', N'image/jpeg'),
    ('55555555-5555-4555-8555-555555555193', N'Memorial_Loja.docx', N'seed/Memorial_Loja.docx', N'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    ('55555555-5555-4555-8555-555555555194', N'Planilha_Areas.xlsx', N'seed/Planilha_Areas.xlsx', N'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    ('55555555-5555-4555-8555-555555555195', N'Recado_Loja.wav', N'seed/Recado_Loja.wav', N'audio/wav')
) origem(CD_Anexo, Nome, Caminho, Tipo)
JOIN app.Demanda demanda ON demanda.CD_Protocolo = N'GL-2026-00131'
WHERE NOT EXISTS
(
    SELECT 1 FROM app.Anexo existente WHERE existente.CD_Anexo = origem.CD_Anexo
);
