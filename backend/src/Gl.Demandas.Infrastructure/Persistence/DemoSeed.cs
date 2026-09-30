using Gl.Demandas.Domain;

namespace Gl.Demandas.Infrastructure.Persistence;

public static class DemoSeed
{
    public const string SenhaHash = "6269bdc44514c668efb1ee9442d68ac81c662367fa36c1883e3027ee197f4036";

    public static void Aplicar(AppDbContext db, DateTime agora)
    {
        if (db.Usuarios.Any())
            return;

        var manutencao = Area(DemoIds.AreaManutencao, "Manutenção");
        var recepcao = Area(DemoIds.AreaRecepcao, "Recepção");
        var estacionamento = Area(DemoIds.AreaEstacionamento, "Estacionamento");
        var obras = Area(DemoIds.AreaObras, "Obras");
        var infra = Area(DemoIds.AreaInfra, "Infraestrutura");
        db.Areas.AddRange(manutencao, recepcao, estacionamento, obras, infra);

        var catManut = Categoria(DemoIds.CatManutencao, "Manutenção");
        var catRecep = Categoria(DemoIds.CatRecepcao, "Recepção");
        var catEst = Categoria(DemoIds.CatEstacionamento, "Estacionamento");
        var catInfra = Categoria(DemoIds.CatInfra, "Infraestrutura");
        db.Categorias.AddRange(catManut, catRecep, catEst, catInfra);
        db.SaveChanges();

        var civil = Sub(DemoIds.SubCivil, catManut, manutencao, "Civil", "ATENDIMENTO");
        var eletrica = Sub(DemoIds.SubEletrica, catManut, manutencao, "Elétrica", "ATENDIMENTO");
        var refrigeracao = Sub(DemoIds.SubRefrigeracao, catManut, manutencao, "Refrigeração", "ATENDIMENTO");
        var subObras = Sub(DemoIds.SubObras, catManut, obras, "Obras", "OBRA");
        var fibra = Sub(DemoIds.SubFibra, catInfra, infra, "Fibra", "APROVACAO");
        var subRecep = Sub(DemoIds.SubRecepcao, catRecep, recepcao, "Correspondências", "ATENDIMENTO");
        var subEst = Sub(DemoIds.SubEstacionamento, catEst, estacionamento, "Vagas", "ATENDIMENTO");
        db.Subcategorias.AddRange(civil, eletrica, refrigeracao, subObras, fibra, subRecep, subEst);
        
        var empresas = new[]
        {
            Empresa(DemoIds.EmpresaExemplo, "Empresa Exemplo", "/marcas/empresa-exemplo.svg"),
            Empresa(DemoIds.EmpresaBId, "Empresa B", "/marcas/empresa-b.svg"),
            Empresa(DemoIds.EmpresaCId, "Empresa C", "/marcas/empresa-c.svg"),
            Empresa(DemoIds.EmpresaDId, "Empresa D", "/marcas/empresa-d.svg"),
            Empresa(DemoIds.EmpresaConecta, "Empresa Conecta", "/marcas/empresa-conecta.svg")
        };
        db.EmpresasCessionarias.AddRange(empresas);
        db.SaveChanges();

        var joao = Usuario(DemoIds.Joao, "João Silva", "joao.silva@empresaexemplo.com.br", "CESSIONARIO", "Empresa Exemplo", "Sala 205", null, "/marcas/empresa-exemplo.svg", Foto("photo-1472099645785-5658abf4ff4e"));
        var gl = Usuario(DemoIds.Gl, "Patrícia Lima", "patricia.lima@gleventos.com.br", "GL_ADMINISTRADOR", "GL events", null, null);
        var resp01 = Usuario(DemoIds.Resp01, "Responsável 01", "responsavel.01@gleventos.com.br", "RESPONSAVEL_AREA", "GL events", null, manutencao);
        var resp02 = Usuario(DemoIds.Resp02, "Responsável 02", "responsavel.02@gleventos.com.br", "RESPONSAVEL_AREA", "GL events", null, recepcao);
        var resp03 = Usuario(DemoIds.Resp03, "Responsável 03", "responsavel.03@gleventos.com.br", "RESPONSAVEL_AREA", "GL events", null, estacionamento);
        var empresaB = Usuario(DemoIds.EmpresaB, "Ana Costa", "ana.costa@empresab.com.br", "CESSIONARIO", "Empresa B", "Sala 102", null, "/marcas/empresa-b.svg", Foto("photo-1438761681033-6461ffad8d80"));
        var empresaC = Usuario(DemoIds.EmpresaC, "Carla Dias", "carla.dias@empresac.com.br", "CESSIONARIO", "Empresa C", "Sala 014", null, "/marcas/empresa-c.svg", Foto("photo-1544005313-94ddf0286df2"));
        var empresaD = Usuario(DemoIds.EmpresaD, "Diego Alves", "diego.alves@empresad.com.br", "CESSIONARIO", "Empresa D", "Acesso norte", null, "/marcas/empresa-d.svg", Foto("photo-1507003211169-0a1dd7228f2d"));
        var marina = Usuario(DemoIds.Marina, "Marina Costa", "marina.costa@empresaconecta.com.br", "CESSIONARIO", "Empresa Conecta", "Sala 310", null, "/marcas/empresa-conecta.svg", Foto("photo-1580489944761-15a19d654956"));
        db.Usuarios.AddRange(joao, gl, resp01, resp02, resp03, empresaB, empresaC, empresaD, marina);
        db.SaveChanges();

        AssociarEmpresa(db, DemoIds.Joao, DemoIds.EmpresaExemplo);
        AssociarEmpresa(db, DemoIds.EmpresaB, DemoIds.EmpresaBId);
        AssociarEmpresa(db, DemoIds.EmpresaC, DemoIds.EmpresaCId);
        AssociarEmpresa(db, DemoIds.EmpresaD, DemoIds.EmpresaDId);
        AssociarEmpresa(db, DemoIds.Marina, DemoIds.EmpresaConecta);
        SemeiarFuncaoRepresentante(db, DemoIds.Joao, DemoIds.EmpresaExemplo);
        SemeiarFuncaoRepresentante(db, DemoIds.EmpresaB, DemoIds.EmpresaBId);
        SemeiarFuncaoRepresentante(db, DemoIds.EmpresaC, DemoIds.EmpresaCId);
        SemeiarFuncaoRepresentante(db, DemoIds.EmpresaD, DemoIds.EmpresaDId);
        SemeiarFuncaoRepresentante(db, DemoIds.Marina, DemoIds.EmpresaConecta);
        db.Espacos.AddRange(
            Espaco(DemoIds.EspacoSala205, "SALA-205", "Sala 205", "Riocentro, Pavilhão 2, 2º piso", "Sala comercial de 86 m²."),
            Espaco(DemoIds.EspacoSala118, "SALA-118", "Sala 118", "Riocentro, Pavilhão 1, 1º piso", "Sala comercial de 42 m²."),
            Espaco(DemoIds.EspacoSala102, "SALA-102", "Sala 102", "Riocentro, Pavilhão 1, térreo", "Sala comercial de 54 m²."),
            Espaco(DemoIds.EspacoSala014, "SALA-014", "Sala 014", "Riocentro, acesso de serviço", "Sala de apoio de 32 m²."),
            Espaco(DemoIds.EspacoAcessoNorte, "ACESSO-NORTE", "Acesso norte", "Riocentro, portaria norte", "Ponto de credenciamento."),
            Espaco(DemoIds.EspacoSala310, "SALA-310", "Sala 310", "Riocentro, Pavilhão 3, 3º piso", "Sala de operação de rede de 70 m²."));
        db.SaveChanges();
        db.Locacoes.AddRange(
            Locacao(db, DemoIds.EspacoSala205, DemoIds.EmpresaExemplo, new DateOnly(2024, 3, 12)),
            Locacao(db, DemoIds.EspacoSala118, DemoIds.EmpresaExemplo, new DateOnly(2025, 8, 3)),
            Locacao(db, DemoIds.EspacoSala102, DemoIds.EmpresaBId, new DateOnly(2023, 6, 2)),
            Locacao(db, DemoIds.EspacoSala014, DemoIds.EmpresaCId, new DateOnly(2024, 11, 19)),
            Locacao(db, DemoIds.EspacoAcessoNorte, DemoIds.EmpresaDId, new DateOnly(2025, 1, 8)),
            Locacao(db, DemoIds.EspacoSala310, DemoIds.EmpresaConecta, new DateOnly(2025, 4, 27)));
        db.SaveChanges();

        db.Regras.AddRange(
            Regra(1, "infiltracao", civil, "Civil / Infiltração", "Manutenção Civil", "Manutenção > Civil > Infiltração", "Alta", 1, "Alta"),
            Regra(2, "teto", civil, "Civil / Infiltração", "Manutenção Civil", "Manutenção > Civil > Infiltração", "Alta", 1, "Alta"),
            Regra(3, "agua", civil, "Civil / Infiltração", "Manutenção Civil", "Manutenção > Civil > Infiltração", "Alta", 1, "Alta"),
            Regra(4, "ar-condicionado", refrigeracao, "Refrigeração", "Manutenção Refrigeração", "Manutenção > Refrigeração", "Média", 2, "Alta"),
            Regra(5, "ar condicionado", refrigeracao, "Refrigeração", "Manutenção Refrigeração", "Manutenção > Refrigeração", "Média", 2, "Alta"),
            Regra(6, "refrigeracao", refrigeracao, "Refrigeração", "Manutenção Refrigeração", "Manutenção > Refrigeração", "Média", 2, "Alta"),
            Regra(7, "fibra", fibra, "Fibra", "Aprovação GL", "Solicitação sujeita à aprovação GL", "Normal", 3, "Alta"));

        db.Demandas.AddRange(
            Demanda(
                DemoIds.Demanda120,
                "GL-2026-00120",
                joao,
                "Empresa Exemplo",
                "Sala 205",
                "Infiltração no teto, próxima à janela da sala 205.",
                catManut,
                civil,
                manutencao,
                resp01,
                "Civil / Infiltração",
                "Manutenção Civil",
                "Em andamento",
                "Alta",
                1,
                "ATENDIMENTO",
                agora.AddDays(-2),
                gl,
                "Vistoria conferida com a foto da última inspeção. Aguardando a intervenção hidráulica."),
            Demanda(
                DemoIds.Demanda123,
                "GL-2026-00123",
                joao,
                "Empresa Exemplo",
                "Sala 205",
                "Ar-condicionado da sala de reunião parou de gelar.",
                catManut,
                refrigeracao,
                manutencao,
                resp01,
                "Refrigeração",
                "Manutenção Refrigeração",
                "Recebido",
                "Média",
                2,
                "ATENDIMENTO",
                agora.AddHours(-6),
                gl,
                "Encaminhado para a refrigeração."),
            Demanda(
                DemoIds.Demanda119,
                "GL-2026-00119",
                joao,
                "Empresa Exemplo",
                "Sala 205",
                "Correspondência do contrato retida na recepção.",
                catRecep,
                subRecep,
                recepcao,
                resp02,
                "Recepção",
                "Recepção",
                "Em andamento",
                "Normal",
                3,
                "ATENDIMENTO",
                agora.AddHours(-26),
                gl,
                "Envelope localizado. Aguardando a retirada na recepção."),
            Demanda(
                DemoIds.Demanda118,
                "GL-2026-00118",
                joao,
                "Empresa Exemplo",
                "Sala 205",
                "Credencial de visitante para a sala 205.",
                catEst,
                subEst,
                estacionamento,
                resp03,
                "Estacionamento",
                "Estacionamento",
                "Concluído",
                "Normal",
                3,
                "ATENDIMENTO",
                agora.AddDays(-8),
                gl,
                "Credencial emitida e entregue na recepção."),
            Demanda(
                DemoIds.Demanda130,
                "GL-2026-00130",
                empresaB,
                "Empresa B",
                "Sala 102",
                "Sala 102 sem refrigeração desde a manhã.",
                catManut,
                refrigeracao,
                manutencao,
                resp01,
                "Refrigeração",
                "Manutenção Refrigeração",
                "Recebido",
                "Média",
                2,
                "ATENDIMENTO",
                agora.AddHours(-10),
                gl,
                "Chamado recebido pela manutenção."),
            Demanda(
                DemoIds.Demanda127,
                "GL-2026-00127",
                empresaB,
                "Empresa B",
                "Sala 102",
                "Quadro elétrico com disjuntor desarmando.",
                catManut,
                eletrica,
                manutencao,
                resp01,
                "Elétrica",
                "Manutenção Elétrica",
                "Em andamento",
                "Média",
                2,
                "ATENDIMENTO",
                agora.AddMinutes(-75),
                gl,
                "Em atendimento pela área."),
            Demanda(
                DemoIds.Demanda126,
                "GL-2026-00126",
                empresaC,
                "Empresa C",
                "Sala 014",
                "Correspondência retida na recepção.",
                catRecep,
                subRecep,
                recepcao,
                resp02,
                "Recepção",
                "Recepção",
                "Em andamento",
                "Normal",
                3,
                "ATENDIMENTO",
                agora.AddHours(-3),
                gl,
                "Documento localizado, aguardando retirada."),
            Demanda(
                DemoIds.Demanda125,
                "GL-2026-00125",
                empresaD,
                "Empresa D",
                "Acesso norte",
                "Cadastro de vaga adicional.",
                catEst,
                subEst,
                estacionamento,
                resp03,
                "Estacionamento",
                "Estacionamento",
                "Concluído",
                "Normal",
                3,
                "ATENDIMENTO",
                agora.AddDays(-1),
                gl,
                "Cadastro concluído.",
                nota: 10,
                comentarioNps: "A vaga ficou disponível no mesmo dia."),
            Demanda(
                DemoIds.Demanda121,
                "GL-2026-00121",
                empresaC,
                "Empresa C",
                "Sala 014",
                "A infiltração voltou depois do conserto. Quero registrar a reclamação.",
                catManut,
                civil,
                manutencao,
                resp01,
                "Civil / Infiltração",
                "Manutenção Civil",
                "Em andamento",
                "Alta",
                1,
                "ATENDIMENTO",
                agora.AddHours(-30),
                gl,
                "Retorno aberto como reclamação. A equipe voltou ao ponto.",
                "Reclamação"),
            Demanda(
                DemoIds.Demanda122,
                "GL-2026-00122",
                empresaB,
                "Empresa B",
                "Sala 102",
                "O ar-condicionado foi religado e parou de novo no dia seguinte.",
                catManut,
                refrigeracao,
                manutencao,
                resp01,
                "Refrigeração",
                "Manutenção Refrigeração",
                "Concluído",
                "Alta",
                1,
                "ATENDIMENTO",
                agora.AddDays(-4),
                gl,
                "Segundo atendimento concluído.",
                "Reclamação",
                3,
                "O reparo voltou no dia seguinte."),
            Demanda(
                DemoIds.Demanda124,
                "GL-2026-00124",
                empresaD,
                "Empresa D",
                "Acesso norte",
                "Troca do disjuntor do acesso norte.",
                catManut,
                eletrica,
                manutencao,
                resp01,
                "Elétrica",
                "Manutenção Elétrica",
                "Concluído",
                "Normal",
                3,
                "ATENDIMENTO",
                agora.AddDays(-3),
                gl,
                "Disjuntor substituído.",
                nota: 10,
                comentarioNps: "Resolveu no mesmo dia."));

        var fibraDemanda = Demanda(
            DemoIds.Demanda131,
            "GL-2026-00131",
            marina,
            "Empresa Conecta",
            "Sala 310",
            "Instalação de fibra de internet.",
            catInfra,
            fibra,
            infra,
            null,
            "Fibra",
            "Aprovação GL",
            "Aguardando aprovação",
            "Normal",
            3,
            "APROVACAO",
            agora.AddHours(-5),
            gl,
            "Enviada para aprovação do GL.");
        fibraDemanda.Anexos.Add(new AnexoRegistro
        {
            Id = DemoIds.AnexoFibra,
            Nome = "Projeto_Fibra.pdf",
            Caminho = "seed/Projeto_Fibra.pdf",
            Tipo = "application/pdf",
            Tamanho = 1024,
            EnviadoEm = agora.AddHours(-5)
        });
        db.Demandas.Add(fibraDemanda);

        var obra = new ObraRegistro
        {
            Id = DemoIds.ObraFoyer,
            Nome = "Modernização do foyer",
            Local = "Pavilhão 2",
            Descricao = "Intervenção civil no foyer, com adequação de piso e forro.",
            InicioPrevisto = new DateOnly(2026, 10, 6),
            TerminoPrevisto = new DateOnly(2026, 12, 18),
            EmpresaExecutora = "Construtora Exemplo",
            Responsavel = "Carlos Mendes",
            Contato = "carlos.mendes@construtoraexemplo.com.br",
            Etapa = "Análise",
            Documentos =
            [
                Doc(DemoIds.DocProjeto, "Projeto Executivo", "Recebido", 1),
                Doc(DemoIds.DocArt, "ART", "Pendente", 2),
                Doc(DemoIds.DocSeguro, "Seguro da Obra", "Pendente", 3),
                Doc(DemoIds.DocCronograma, "Cronograma", "Pendente", 4)
            ]
        };
        db.Obras.Add(obra);
        db.SaveChanges();

        var infiltracao = db.Demandas.Single(d => d.Id == DemoIds.Demanda120);
        infiltracao.PrevisaoAtendimento = agora.Date.AddDays(1).AddHours(14);
        db.Demandas.Single(d => d.Id == DemoIds.Demanda123).PrevisaoAtendimento = agora.Date.AddDays(1).AddHours(10);
        db.Demandas.Single(d => d.Id == DemoIds.Demanda119).PrevisaoAtendimento = agora.Date.AddDays(2).AddHours(9);
        db.Demandas.Single(d => d.Id == DemoIds.Demanda127).PrevisaoAtendimento = agora.AddHours(-4);
        db.Demandas.Single(d => d.Id == DemoIds.Demanda126).PrevisaoAtendimento = agora.AddHours(-3);
        db.Demandas.Single(d => d.Id == DemoIds.Demanda121).PrevisaoAtendimento = agora.AddHours(-8);
        infiltracao.Mensagens.Add(new MensagemRegistro
        {
            Id = DemoIds.MsgComplemento,
            AutorIdInterno = resp01.IdInterno,
            Texto = "Envie uma foto do ponto da infiltração para complementar o chamado.",
            Canal = "PORTAL",
            Finalidade = "complemento",
            EnviadaEm = agora.AddHours(-1)
        });
        db.Notificacoes.Add(new NotificacaoRegistro
        {
            Id = DemoIds.NotaInfiltracao,
            DemandaIdInterno = infiltracao.IdInterno,
            UsuarioIdInterno = joao.IdInterno,
            Texto = "Sua solicitação GL-2026-00120 está em atendimento.",
            Leitura = "NAO_LIDA",
            CriadaEm = agora.AddHours(-2)
        });
        db.Notificacoes.Add(new NotificacaoRegistro
        {
            Id = DemoIds.NotaComplemento,
            DemandaIdInterno = infiltracao.IdInterno,
            UsuarioIdInterno = joao.IdInterno,
            Texto = "Envie uma foto do ponto da infiltração para complementar o chamado.",
            Leitura = "NAO_LIDA",
            CriadaEm = agora.AddHours(-1)
        });
        db.SaveChanges();
        GarantirCadeia(db);
    }

    public static void GarantirCadeia(AppDbContext db)
    {
        var existentes = db.EtapasCadeia.Select(e => e.SubcategoriaIdInterno).Distinct().ToHashSet();
        foreach (var sub in db.Subcategorias.ToList())
        {
            if (existentes.Contains(sub.IdInterno))
                continue;

            db.EtapasCadeia.AddRange(CadeiaAtendimento.Padrao().Select(etapa => new EtapaCadeiaRegistro
            {
                SubcategoriaIdInterno = sub.IdInterno,
                Codigo = etapa.Codigo,
                Nome = etapa.Nome,
                Ordem = etapa.Ordem,
                Automatica = etapa.Codigo == CadeiaAtendimento.Aprovacao && sub.Id == DemoIds.SubRefrigeracao,
                Campos = string.Join(',', etapa.Tarefas.Select(tarefa => $"{tarefa.Codigo}:{(tarefa.Obrigatoria ? "1" : "0")}"))
            }));
        }

        db.SaveChanges();
    }

    private static AreaRegistro Area(Guid id, string nome) => new() { Id = id, Nome = nome };
    
        private static EmpresaCessionariaRegistro Empresa(Guid id, string nome, string? logo) =>
            new() { Id = id, Nome = nome, Status = "ATIVO", Logo = logo };

        private static void AssociarEmpresa(AppDbContext db, Guid usuarioId, Guid empresaId)
        {
            var usuario = db.Usuarios.Single(item => item.Id == usuarioId);
            var empresa = db.EmpresasCessionarias.Single(item => item.Id == empresaId);
            usuario.EmpresaCessionariaIdInterno = empresa.IdInterno;
            db.SaveChanges();
        }

        private static void SemeiarFuncaoRepresentante(AppDbContext db, Guid usuarioId, Guid empresaId)
        {
            var usuario = db.Usuarios.Single(item => item.Id == usuarioId);
            var empresa = db.EmpresasCessionarias.Single(item => item.Id == empresaId);
            var funcao = new FuncaoCessionarioRegistro
            {
                Id = Guid.NewGuid(),
                EmpresaIdInterno = empresa.IdInterno,
                Nome = "Representante demonstrativo",
                Status = "ATIVO",
                Permissoes = Enum.GetValues<PermissaoCessionario>()
                    .Select(permissao => new FuncaoPermissaoRegistro { Permissao = PermissaoCessionarioTexto.ParaCodigo(permissao) })
                    .ToList()
            };
            db.FuncoesCessionario.Add(funcao);
            db.SaveChanges();
            db.FuncoesRepresentante.Add(new RepresentanteFuncaoRegistro
            {
                UsuarioIdInterno = usuario.IdInterno,
                FuncaoIdInterno = funcao.IdInterno
            });
            db.SaveChanges();
        }
    
        private static EspacoRegistro Espaco(Guid id, string codigo, string nome, string localizacao, string descricao) =>
            new() { Id = id, Codigo = codigo, Nome = nome, Localizacao = localizacao, Descricao = descricao, Status = "ATIVO" };
    
        private static LocacaoRegistro Locacao(AppDbContext db, Guid espacoId, Guid empresaId, DateOnly inicio) => new()
        {
            Id = Guid.NewGuid(),
            EspacoIdInterno = db.Espacos.Single(item => item.Id == espacoId).IdInterno,
            EmpresaIdInterno = db.EmpresasCessionarias.Single(item => item.Id == empresaId).IdInterno,
            Inicio = inicio
        };

    private static CategoriaRegistro Categoria(Guid id, string nome) => new() { Id = id, Nome = nome };

    private static SubcategoriaRegistro Sub(Guid id, CategoriaRegistro categoria, AreaRegistro area, string nome, string fluxo) =>
        new()
        {
            Id = id,
            CategoriaIdInterno = categoria.IdInterno,
            AreaIdInterno = area.IdInterno,
            Nome = nome,
            Fluxo = fluxo
        };

    private static UsuarioRegistro Usuario(
        Guid id,
        string nome,
        string email,
        string perfil,
        string? empresa,
        string? sala,
        AreaRegistro? area,
        string? logo = null,
        string? foto = null) =>
        new()
        {
            Id = id,
            Nome = nome,
            Email = email,
            SenhaHash = SenhaHash,
            Perfil = perfil,
            Empresa = empresa,
            Sala = sala,
            LogoEmpresa = logo,
            Foto = foto,
            AreaIdInterno = area?.IdInterno
        };

    private static string Foto(string id) =>
        $"https://images.unsplash.com/{id}?auto=format&fit=crop&w=640&q=80";

    private static RegraRegistro Regra(
        int ordem,
        string termo,
        SubcategoriaRegistro sub,
        string servico,
        string destino,
        string resumo,
        string prioridade,
        int ordemPrioridade,
        string confianca) =>
        new()
        {
            Id = Guid.Parse($"77777777-7777-4777-8777-7777777777{ordem:00}"),
            Termo = termo,
            SubcategoriaIdInterno = sub.IdInterno,
            Servico = servico,
            Destino = destino,
            Resumo = resumo,
            Prioridade = prioridade,
            OrdemPrioridade = ordemPrioridade,
            Confianca = confianca,
            Ordem = ordem
        };

    private static DemandaRegistro Demanda(
        Guid id,
        string protocolo,
        UsuarioRegistro cessionario,
        string empresa,
        string sala,
        string descricao,
        CategoriaRegistro categoria,
        SubcategoriaRegistro sub,
        AreaRegistro area,
        UsuarioRegistro? responsavel,
        string servico,
        string destino,
        string situacao,
        string prioridade,
        int ordemPrioridade,
        string fluxo,
        DateTime abertoEm,
        UsuarioRegistro gl,
        string andamento,
        string natureza = "Serviço",
        int? nota = null,
        string? comentarioNps = null)
    {
        var demanda = new DemandaRegistro
        {
            Id = id,
            Protocolo = protocolo,
            CessionarioIdInterno = cessionario.IdInterno,
            EmpresaCessionariaIdInterno = cessionario.EmpresaCessionariaIdInterno
                ?? throw new InvalidOperationException("Usuário Cessionário demonstrativo sem empresa associada."),
            Empresa = empresa,
            Sala = sala,
            Descricao = descricao,
            CategoriaIdInterno = categoria.IdInterno,
            SubcategoriaIdInterno = sub.IdInterno,
            AreaIdInterno = area.IdInterno,
            ResponsavelIdInterno = responsavel?.IdInterno,
            Servico = servico,
            Destino = destino,
            Situacao = situacao,
            Prioridade = prioridade,
            OrdemPrioridade = ordemPrioridade,
            Confianca = "Alta",
            Classificacao = "Confirmada",
            Fluxo = fluxo,
            Natureza = natureza,
            AbertoEm = abertoEm,
            AtualizadoEm = abertoEm.AddMinutes(20)
        };
        demanda.Mensagens.Add(new MensagemRegistro
        {
            Id = Guid.NewGuid(),
            AutorIdInterno = cessionario.IdInterno,
            Texto = descricao,
            Canal = "PORTAL",
            EnviadaEm = abertoEm
        });
        demanda.Historico.Add(Evento(cessionario, null, "Novo", "Chamado aberto.", "ABERTURA", abertoEm));
        if (natureza == "Reclamação")
            demanda.Historico.Add(Evento(cessionario, "Novo", "Novo", "Chamado aberto como reclamação.", "RECLAMACAO", abertoEm));
        demanda.Historico.Add(Evento(gl, "Novo", "Recebido", $"Demanda direcionada para {area.Nome}.", "REDIRECIONAMENTO", abertoEm.AddMinutes(5)));
        if (responsavel is not null && situacao == "Concluído")
        {
            demanda.Historico.Add(Evento(responsavel, "Recebido", "Em andamento", "Atendimento iniciado.", "ANDAMENTO", abertoEm.AddMinutes(20)));
            demanda.Historico.Add(Evento(responsavel, "Em andamento", situacao, andamento, "ANDAMENTO", abertoEm.AddHours(2)));
            if (nota is int valor)
            {
                demanda.NotaAvaliacao = valor;
                demanda.ComentarioAvaliacao = comentarioNps;
                demanda.AvaliadaEm = abertoEm.AddHours(3);
                demanda.Historico.Add(Evento(
                    cessionario,
                    situacao,
                    situacao,
                    string.IsNullOrWhiteSpace(comentarioNps)
                        ? $"Avaliação do atendimento: {valor}."
                        : $"Avaliação do atendimento: {valor}. {comentarioNps}",
                    "AVALIACAO",
                    abertoEm.AddHours(3)));
            }
        }
        else if (responsavel is not null && situacao is not "Novo" and not "Recebido")
        {
            demanda.Historico.Add(Evento(responsavel, "Recebido", situacao, andamento, "ANDAMENTO", abertoEm.AddMinutes(20)));
        }

        return demanda;
    }

    private static HistoricoRegistro Evento(
        UsuarioRegistro usuario,
        string? anterior,
        string novo,
        string comentario,
        string tipo,
        DateTime quando) =>
        new()
        {
            Id = Guid.NewGuid(),
            UsuarioIdInterno = usuario.IdInterno,
            StatusAnterior = anterior,
            StatusNovo = novo,
            Comentario = comentario,
            TipoEvento = tipo,
            EventoEm = quando
        };

    private static DocumentoObraRegistro Doc(Guid id, string nome, string situacao, int ordem) =>
        new() { Id = id, Nome = nome, Situacao = situacao, Ordem = ordem };
}
