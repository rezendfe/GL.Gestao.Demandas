using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Microsoft.EntityFrameworkCore;

namespace Gl.Demandas.Infrastructure.Persistence;

public sealed class GlRepositorio(AppDbContext db) : IUsuarios, ICatalogo, IDemandas, IObras, INotificacoes, ICadeia, IInventarioEspacos, IGestaoCessionarios
{
    public async Task<IReadOnlyList<EmpresaCadastro>> ListarEmpresasAdministracao(CancellationToken ct)
    {
        var empresas = await db.EmpresasCessionarias.OrderBy(x => x.Nome).ToListAsync(ct);
        var resultado = new List<EmpresaCadastro>(empresas.Count);
        foreach (var empresa in empresas)
        {
            var funcoes = await db.FuncoesCessionario.Include(x => x.Permissoes)
                .Where(x => x.EmpresaIdInterno == empresa.IdInterno).OrderBy(x => x.Nome).ToListAsync(ct);
            var usuarios = await db.Usuarios.Where(x => x.EmpresaCessionariaIdInterno == empresa.IdInterno)
                .OrderBy(x => x.Nome).ToListAsync(ct);
            var representantes = new List<RepresentanteCadastro>(usuarios.Count);
            foreach (var usuario in usuarios)
            {
                var contatos = await db.ContatosRepresentante.Where(x => x.UsuarioIdInterno == usuario.IdInterno)
                    .OrderBy(x => x.Canal).ThenByDescending(x => x.Principal).ToListAsync(ct);
                var idsFuncoes = await db.FuncoesRepresentante.Where(x => x.UsuarioIdInterno == usuario.IdInterno)
                    .Select(x => x.FuncaoIdInterno).ToArrayAsync(ct);
                var funcoesUsuario = funcoes.Where(funcao => idsFuncoes.Contains(funcao.IdInterno)).Select(MapearFuncao).ToArray();
                representantes.Add(new RepresentanteCadastro(
                    usuario.Id,
                    usuario.Nome,
                    usuario.Email,
                    usuario.Status == "ATIVO",
                    contatos.Select(contato => new ContatoCadastro(contato.Id, contato.Canal, contato.Valor, contato.Principal)).ToArray(),
                    funcoesUsuario));
            }
            resultado.Add(new EmpresaCadastro(
                empresa.Id,
                empresa.Nome,
                empresa.Status == "ATIVO",
                empresa.Logo,
                representantes,
                funcoes.Select(MapearFuncao).ToArray()));
        }
        return resultado;
    }

    public async Task<EmpresaCadastro> SalvarEmpresa(Guid? id, string nome, bool ativa, string? logo, CancellationToken ct)
    {
        if (await db.EmpresasCessionarias.AnyAsync(x => x.Nome.ToUpper() == nome.ToUpper() && (!id.HasValue || x.Id != id.Value), ct))
            throw new RegraNegocioException("Já existe uma empresa Cessionária com este nome.");
        var empresa = id.HasValue
            ? await db.EmpresasCessionarias.FirstOrDefaultAsync(x => x.Id == id.Value, ct)
                ?? throw new NaoEncontradaException("Empresa Cessionária não encontrada.")
            : new EmpresaCessionariaRegistro { Id = Guid.NewGuid() };
        empresa.Nome = nome;
        empresa.Status = ativa ? "ATIVO" : "INATIVO";
        empresa.Logo = logo;
        if (!id.HasValue) db.EmpresasCessionarias.Add(empresa);
        foreach (var usuario in await db.Usuarios.Where(x => x.EmpresaCessionariaIdInterno == empresa.IdInterno).ToListAsync(ct))
            usuario.Empresa = empresa.Nome;
        await db.SaveChangesAsync(ct);
        return (await ListarEmpresasAdministracao(ct)).Single(x => x.Id == empresa.Id);
    }

    public async Task<RepresentanteCadastro> SalvarRepresentante(
        Guid empresaId,
        Guid? usuarioId,
        string nome,
        string email,
        bool ativo,
        IReadOnlyList<ContatoCadastro> contatos,
        IReadOnlyList<Guid> funcoes,
        CancellationToken ct)
    {
        var empresa = await db.EmpresasCessionarias.FirstOrDefaultAsync(x => x.Id == empresaId, ct)
            ?? throw new NaoEncontradaException("Empresa Cessionária não encontrada.");
        var usuario = usuarioId.HasValue
            ? await db.Usuarios.FirstOrDefaultAsync(x => x.Id == usuarioId.Value, ct)
                ?? throw new NaoEncontradaException("Representante não encontrado.")
            : await db.Usuarios.FirstOrDefaultAsync(x => x.Email == email, ct);

        if (usuario is not null && usuario.Perfil != "CESSIONARIO")
            throw new RegraNegocioException("O e-mail informado pertence a um usuário que não é Cessionário.");
        if (usuario is not null && usuario.EmpresaCessionariaIdInterno is long empresaExistente && empresaExistente != empresa.IdInterno)
            throw new RegraNegocioException("Este login já está associado a outra empresa Cessionária.");
        if (usuario is not null && usuarioId.HasValue && usuario.Email != email && await db.Usuarios.AnyAsync(x => x.Email == email && x.Id != usuario.Id, ct))
            throw new RegraNegocioException("Este e-mail de login já está cadastrado.");
        if (usuario is null)
        {
            if (await db.Usuarios.AnyAsync(x => x.Email == email, ct))
                throw new RegraNegocioException("Este e-mail de login já está cadastrado.");
            usuario = new UsuarioRegistro
            {
                Id = Guid.NewGuid(),
                Email = email,
                Perfil = "CESSIONARIO",
                EmpresaCessionariaIdInterno = empresa.IdInterno
            };
            db.Usuarios.Add(usuario);
        }

        usuario.Nome = nome;
        usuario.Email = email;
        usuario.Empresa = empresa.Nome;
        usuario.LogoEmpresa = empresa.Logo;
        usuario.Status = ativo && empresa.Status == "ATIVO" ? "ATIVO" : "INATIVO";
        usuario.EmpresaCessionariaIdInterno = empresa.IdInterno;

        var funcoesValidas = await db.FuncoesCessionario.Where(x => funcoes.Contains(x.Id) && x.EmpresaIdInterno == empresa.IdInterno)
            .Select(x => x.IdInterno).ToArrayAsync(ct);
        if (funcoesValidas.Length != funcoes.Distinct().Count())
            throw new RegraNegocioException("Todas as funções do representante devem pertencer à mesma empresa.");

        await db.SaveChangesAsync(ct);
        var contatosExistentes = await db.ContatosRepresentante.Where(x => x.UsuarioIdInterno == usuario.IdInterno).ToListAsync(ct);
        db.ContatosRepresentante.RemoveRange(contatosExistentes);
        foreach (var contato in contatos)
        {
            if (!Enum.TryParse<CanalContato>(contato.Canal, true, out var canal))
                throw new RegraNegocioException("Canal de contato inválido.");
            db.ContatosRepresentante.Add(new RepresentanteContatoRegistro
            {
                Id = contato.Id,
                UsuarioIdInterno = usuario.IdInterno,
                Canal = canal.ToString().ToUpperInvariant(),
                Valor = contato.Valor,
                Principal = contato.Principal
            });
        }
        var funcoesAtuais = await db.FuncoesRepresentante.Where(x => x.UsuarioIdInterno == usuario.IdInterno).ToListAsync(ct);
        db.FuncoesRepresentante.RemoveRange(funcoesAtuais);
        foreach (var funcaoId in funcoesValidas)
            db.FuncoesRepresentante.Add(new RepresentanteFuncaoRegistro { UsuarioIdInterno = usuario.IdInterno, FuncaoIdInterno = funcaoId });

        await db.SaveChangesAsync(ct);
        var resultado = await ListarEmpresasAdministracao(ct);
        return resultado.Single(x => x.Id == empresaId).Representantes.Single(x => x.UsuarioId == usuario.Id);
    }

    public async Task<FuncaoCadastro> SalvarFuncao(
        Guid empresaId,
        Guid? id,
        string nome,
        bool ativa,
        IReadOnlyList<PermissaoCessionario> permissoes,
        CancellationToken ct)
    {
        var empresa = await db.EmpresasCessionarias.FirstOrDefaultAsync(x => x.Id == empresaId, ct)
            ?? throw new NaoEncontradaException("Empresa Cessionária não encontrada.");
        if (await db.FuncoesCessionario.AnyAsync(x => x.EmpresaIdInterno == empresa.IdInterno && x.Nome.ToUpper() == nome.ToUpper() && (!id.HasValue || x.Id != id.Value), ct))
            throw new RegraNegocioException("Já existe uma função com este nome nesta empresa.");
        var funcao = id.HasValue
            ? await db.FuncoesCessionario.Include(x => x.Permissoes).FirstOrDefaultAsync(x => x.Id == id.Value, ct)
                ?? throw new NaoEncontradaException("Função não encontrada.")
            : new FuncaoCessionarioRegistro { Id = Guid.NewGuid(), EmpresaIdInterno = empresa.IdInterno };
        if (funcao.EmpresaIdInterno != empresa.IdInterno)
            throw new RegraNegocioException("A função deve pertencer à empresa selecionada.");
        funcao.Nome = nome;
        funcao.Status = ativa ? "ATIVO" : "INATIVO";
        if (!id.HasValue) db.FuncoesCessionario.Add(funcao);
        db.PermissoesFuncao.RemoveRange(funcao.Permissoes);
        foreach (var permissao in permissoes.Distinct())
            funcao.Permissoes.Add(new FuncaoPermissaoRegistro { Permissao = PermissaoCessionarioTexto.ParaCodigo(permissao) });
        await db.SaveChangesAsync(ct);
        return MapearFuncao(funcao);
    }

    public async Task<IReadOnlyList<EspacoConsulta>> ListarEspacos(CancellationToken ct)
    {
        var rows = await db.Espacos.Include(x => x.Locacoes).ThenInclude(x => x.Empresa)
            .OrderBy(x => x.Codigo).ToListAsync(ct);
        return rows.Select(MapearEspaco).ToArray();
    }

    public async Task<EspacoConsulta?> ObterEspaco(Guid id, CancellationToken ct)
    {
        var row = await db.Espacos.Include(x => x.Locacoes).ThenInclude(x => x.Empresa)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        return row is null ? null : MapearEspaco(row);
    }

    public async Task<IReadOnlyList<EmpresaOpcao>> ListarEmpresas(CancellationToken ct) =>
        await db.EmpresasCessionarias.OrderBy(x => x.Nome)
            .Select(x => new EmpresaOpcao(x.Id, x.Nome, x.Status == "ATIVO"))
            .ToArrayAsync(ct);

    public Task<bool> EmpresaAtiva(Guid id, CancellationToken ct) =>
        db.EmpresasCessionarias.AnyAsync(x => x.Id == id && x.Status == "ATIVO", ct);

    public Task<bool> CodigoEmUso(string codigo, Guid? excetoId, CancellationToken ct) =>
        db.Espacos.AnyAsync(x => x.Codigo.ToUpper() == codigo.ToUpper() && (!excetoId.HasValue || x.Id != excetoId.Value), ct);

    public Task<bool> PossuiLocacaoVigente(Guid espacoId, CancellationToken ct) =>
        db.Locacoes.Include(x => x.Espaco).AnyAsync(x => x.Espaco!.Id == espacoId && x.Termino == null, ct);

    public async Task SalvarEspaco(Espaco espaco, CancellationToken ct)
    {
        var row = await db.Espacos.FirstOrDefaultAsync(x => x.Id == espaco.Id, ct);
        if (row is null)
        {
            row = new EspacoRegistro { Id = espaco.Id };
            db.Espacos.Add(row);
        }
        row.Codigo = espaco.Codigo;
        row.Nome = espaco.Nome;
        row.Localizacao = espaco.Localizacao;
        row.Descricao = espaco.Descricao;
        row.Status = espaco.Ativo ? "ATIVO" : "INATIVO";
        await db.SaveChangesAsync(ct);
    }

    public async Task IniciarLocacao(Locacao locacao, CancellationToken ct)
    {
        var espaco = await db.Espacos.FirstOrDefaultAsync(x => x.Id == locacao.EspacoId, ct)
            ?? throw new NaoEncontradaException("Espaço não encontrado.");
        var empresa = await db.EmpresasCessionarias.FirstOrDefaultAsync(x => x.Id == locacao.EmpresaId, ct)
            ?? throw new NaoEncontradaException("Empresa Cessionária não encontrada.");
        if (espaco.Status != "ATIVO")
            throw new RegraNegocioException("Espaço Inativo não aceita nova locação.");
        if (empresa.Status != "ATIVO")
            throw new RegraNegocioException("Empresa Cessionária Inativa não aceita nova locação.");
        if (await db.Locacoes.AnyAsync(x => x.EspacoIdInterno == espaco.IdInterno && x.Termino == null, ct))
            throw new RegraNegocioException("O espaço já possui uma locação vigente.");

        db.Locacoes.Add(new LocacaoRegistro
        {
            Id = locacao.Id,
            EspacoIdInterno = espaco.IdInterno,
            EmpresaIdInterno = empresa.IdInterno,
            Inicio = locacao.Inicio
        });
        await db.SaveChangesAsync(ct);
    }

    public async Task EncerrarLocacao(Guid espacoId, DateOnly termino, CancellationToken ct)
    {
        var locacao = await db.Locacoes.Include(x => x.Espaco)
            .SingleOrDefaultAsync(x => x.Espaco!.Id == espacoId && x.Termino == null, ct)
            ?? throw new NaoEncontradaException("Locação vigente não encontrada.");
        if (termino < locacao.Inicio)
            throw new RegraNegocioException("A data de término não pode ser anterior ao início da locação.");
        locacao.Termino = termino;
        await db.SaveChangesAsync(ct);
    }

    public async Task<Usuario?> ObterPorEmail(string email, CancellationToken ct)
    {
        var row = await db.Usuarios.Include(u => u.Area).Include(u => u.EmpresaCessionaria)
            .FirstOrDefaultAsync(u => u.Email == email, ct);
        return row is null ? null : Mapear(row);
    }

    public async Task<Usuario?> ObterPorIdentidadeEstavel(string identidade, CancellationToken ct)
    {
        var row = await db.Usuarios.Include(u => u.Area).Include(u => u.EmpresaCessionaria)
            .FirstOrDefaultAsync(u => u.IdentidadeEstavel == identidade, ct);
        return row is null ? null : Mapear(row);
    }

    async Task<Usuario?> IUsuarios.Obter(Guid id, CancellationToken ct)
    {
        var row = await db.Usuarios.Include(u => u.Area).Include(u => u.EmpresaCessionaria)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        return row is null ? null : Mapear(row);
    }

    async Task<IReadOnlyList<Usuario>> IUsuarios.Listar(CancellationToken ct) =>
        (await db.Usuarios.Include(u => u.Area).Include(u => u.EmpresaCessionaria).ToListAsync(ct)).Select(Mapear).ToArray();

    public async Task VincularIdentidadeEstavel(Guid usuarioId, string identidade, CancellationToken ct)
    {
        var valor = identidade.Trim();
        var row = await db.Usuarios.FirstOrDefaultAsync(usuario => usuario.Id == usuarioId, ct)
            ?? throw new NaoEncontradaException("Representante não encontrado.");
        if (row.IdentidadeEstavel is not null && !string.Equals(row.IdentidadeEstavel, valor, StringComparison.Ordinal))
            throw new AcessoNegadoException("A identidade autenticada não corresponde ao cadastro do representante.");
        if (await db.Usuarios.AnyAsync(usuario => usuario.Id != usuarioId && usuario.IdentidadeEstavel == valor, ct))
            throw new AcessoNegadoException("Esta identidade já está vinculada a outro representante.");
        row.IdentidadeEstavel = valor;
        await db.SaveChangesAsync(ct);
    }

    public async Task SalvarResponsavel(Guid? id, string nome, string email, Guid areaId, bool ativo, string? senhaHashNovo, CancellationToken ct)
    {
        var area = await db.Areas.FirstOrDefaultAsync(a => a.Id == areaId, ct)
            ?? throw new NaoEncontradaException("Área responsável não encontrada.");
        if (await db.Usuarios.AnyAsync(u => u.Email == email && (!id.HasValue || u.Id != id.Value), ct))
            throw new RegraNegocioException("Já existe um usuário com este e-mail.");

        var row = id.HasValue
            ? await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id.Value, ct)
                ?? throw new NaoEncontradaException("Responsável não encontrado.")
            : new UsuarioRegistro
            {
                Id = Guid.NewGuid(),
                Perfil = PerfilTexto.ParaCodigo(Perfil.ResponsavelArea),
                SenhaHash = senhaHashNovo
            };
        if (PerfilTexto.ParaPerfil(row.Perfil) != Perfil.ResponsavelArea)
            throw new RegraNegocioException("Este cadastro não é de um Responsável da Área.");
        row.Nome = nome;
        row.Email = email;
        row.AreaIdInterno = area.IdInterno;
        row.Status = ativo ? "ATIVO" : "INATIVO";
        if (!id.HasValue) db.Usuarios.Add(row);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlySet<PermissaoCessionario>> PermissoesCessionario(Guid usuarioId, CancellationToken ct)
    {
        var codigos = await db.FuncoesRepresentante
                .Where(vinculo => vinculo.Usuario!.Id == usuarioId &&
                    vinculo.Funcao!.Status == "ATIVO" &&
                    vinculo.Funcao.EmpresaIdInterno == vinculo.Usuario.EmpresaCessionariaIdInterno)
            .SelectMany(vinculo => vinculo.Funcao!.Permissoes.Select(permissao => permissao.Permissao))
            .Distinct()
            .ToArrayAsync(ct);
        return codigos.Select(codigo =>
            {
                try { return (PermissaoCessionario?)PermissaoCessionarioTexto.ParaPermissao(codigo); }
                catch (ArgumentOutOfRangeException) { return null; }
            })
            .Where(permissao => permissao.HasValue)
            .Select(permissao => permissao!.Value)
            .ToHashSet();
    }

    public async Task<IReadOnlyList<RegraClassificacao>> ListarRegras(CancellationToken ct)
    {
        var rows = await db.Regras.Include(r => r.Subcategoria).OrderBy(r => r.Ordem).ToListAsync(ct);
        return rows.Select(r => new RegraClassificacao(
            r.Id,
            r.Termo,
            r.Subcategoria!.Id,
            r.Servico,
            r.Destino,
            r.Resumo,
            r.Prioridade,
            r.OrdemPrioridade,
            r.Confianca,
            r.Ordem)).ToArray();
    }

    public async Task<Subcategoria?> ObterSubcategoria(Guid id, CancellationToken ct)
    {
        var row = await db.Subcategorias.Include(s => s.Categoria).Include(s => s.Area)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
        return row is null ? null : Mapear(row);
    }

    public async Task<IReadOnlyList<Subcategoria>> ListarSubcategorias(CancellationToken ct) =>
        (await db.Subcategorias.Include(s => s.Categoria).Include(s => s.Area).ToListAsync(ct)).Select(Mapear).ToArray();

    public async Task<IReadOnlyList<Categoria>> ListarCategorias(CancellationToken ct) =>
        (await db.Categorias.ToListAsync(ct)).Select(c => new Categoria(c.Id, c.Nome, c.Status == "ATIVO", c.PrazoHoras)).ToArray();

    public async Task<IReadOnlyList<Area>> ListarAreas(CancellationToken ct) =>
        (await db.Areas.ToListAsync(ct)).Select(a => new Area(a.Id, a.Nome, a.Status == "ATIVO")).ToArray();

    public async Task<Area> SalvarArea(Guid? id, string nome, bool ativa, CancellationToken ct)
    {
        var row = id.HasValue
            ? await db.Areas.FirstOrDefaultAsync(a => a.Id == id.Value, ct)
                ?? throw new NaoEncontradaException("Área não encontrada.")
            : new AreaRegistro { Id = Guid.NewGuid() };
        row.Nome = nome;
        row.Status = ativa ? "ATIVO" : "INATIVO";
        if (!id.HasValue) db.Areas.Add(row);
        await db.SaveChangesAsync(ct);
        return new Area(row.Id, row.Nome, ativa);
    }

    public async Task<Categoria> SalvarCategoria(Guid? id, string nome, bool ativa, int? prazoHoras, CancellationToken ct)
    {
        var row = id.HasValue
            ? await db.Categorias.FirstOrDefaultAsync(c => c.Id == id.Value, ct)
                ?? throw new NaoEncontradaException("Categoria não encontrada.")
            : new CategoriaRegistro { Id = Guid.NewGuid() };
        row.Nome = nome;
        row.Status = ativa ? "ATIVO" : "INATIVO";
        row.PrazoHoras = prazoHoras;
        if (!id.HasValue) db.Categorias.Add(row);
        await db.SaveChangesAsync(ct);
        return new Categoria(row.Id, row.Nome, ativa, prazoHoras);
    }

    public async Task<Subcategoria> SalvarSubcategoria(Guid? id, Guid categoriaId, Guid areaId, string nome, FluxoDemanda fluxo, bool ativa, CancellationToken ct)
    {
        var categoria = await db.Categorias.FirstOrDefaultAsync(c => c.Id == categoriaId, ct)
            ?? throw new NaoEncontradaException("Categoria não encontrada.");
        var area = await db.Areas.FirstOrDefaultAsync(a => a.Id == areaId, ct)
            ?? throw new NaoEncontradaException("Área responsável não encontrada.");
        if (categoria.Status != "ATIVO" && ativa)
            throw new RegraNegocioException("Ative a categoria antes de ativar o tipo de atendimento.");

        var row = id.HasValue
            ? await db.Subcategorias.FirstOrDefaultAsync(s => s.Id == id.Value, ct)
                ?? throw new NaoEncontradaException("Tipo de atendimento não encontrado.")
            : new SubcategoriaRegistro { Id = Guid.NewGuid() };
        row.CategoriaIdInterno = categoria.IdInterno;
        row.AreaIdInterno = area.IdInterno;
        row.Nome = nome;
        row.Fluxo = fluxo.ParaCodigo();
        row.Status = ativa ? "ATIVO" : "INATIVO";
        if (!id.HasValue) db.Subcategorias.Add(row);
        await db.SaveChangesAsync(ct);
        return new Subcategoria(row.Id, categoriaId, areaId, nome, fluxo, ativa);
    }

    async Task<Demanda?> IDemandas.Obter(Guid id, CancellationToken ct)
    {
        var row = await Consulta().Include(d => d.EmpresaCessionaria).FirstOrDefaultAsync(d => d.Id == id, ct);
        return row is null ? null : Mapear(row);
    }

    async Task<IReadOnlyList<Demanda>> IDemandas.Listar(CancellationToken ct) =>
        (await Consulta().Include(d => d.EmpresaCessionaria).ToListAsync(ct)).Select(Mapear).ToArray();

    public async Task<IReadOnlyList<string>> ListarProtocolos(CancellationToken ct) =>
        await db.Demandas.Select(d => d.Protocolo).ToListAsync(ct);

    public async Task Adicionar(Demanda demanda, CancellationToken ct)
    {
        var usuarios = await db.Usuarios.ToDictionaryAsync(u => u.Id, ct);
        var row = new DemandaRegistro();
        await Copiar(row, demanda, usuarios, ct);
        foreach (var mensagem in demanda.Mensagens)
            row.Mensagens.Add(NovaMensagem(mensagem, usuarios));
        foreach (var anexo in demanda.Anexos)
            row.Anexos.Add(NovoAnexo(anexo));
        foreach (var evento in demanda.Historico)
            row.Historico.Add(NovoHistorico(evento, usuarios));
        foreach (var decisao in demanda.Decisoes)
            row.Decisoes.Add(NovaDecisao(decisao, usuarios));
        db.Demandas.Add(row);
        await db.SaveChangesAsync(ct);
    }

    public async Task Salvar(Demanda demanda, CancellationToken ct)
    {
        var row = await Consulta().FirstAsync(d => d.Id == demanda.Id, ct);
        var usuarios = await db.Usuarios.ToDictionaryAsync(u => u.Id, ct);
        await Copiar(row, demanda, usuarios, ct);

        foreach (var mensagem in demanda.Mensagens.Where(m => row.Mensagens.All(x => x.Id != m.Id)))
            row.Mensagens.Add(NovaMensagem(mensagem, usuarios));
        foreach (var anexo in demanda.Anexos.Where(a => row.Anexos.All(x => x.Id != a.Id)))
            row.Anexos.Add(NovoAnexo(anexo));
        foreach (var evento in demanda.Historico.Where(h => row.Historico.All(x => x.Id != h.Id)))
            row.Historico.Add(NovoHistorico(evento, usuarios));
        foreach (var decisao in demanda.Decisoes.Where(d => row.Decisoes.All(x => x.Id != d.Id)))
            row.Decisoes.Add(NovaDecisao(decisao, usuarios));

        await db.SaveChangesAsync(ct);
    }

    async Task<IReadOnlyList<Obra>> IObras.Listar(CancellationToken ct) =>
        (await db.Obras.Include(o => o.Documentos).ToListAsync(ct)).Select(Mapear).ToArray();

    async Task<Obra?> IObras.Obter(Guid id, CancellationToken ct)
    {
        var row = await db.Obras.Include(o => o.Documentos).FirstOrDefaultAsync(o => o.Id == id, ct);
        return row is null ? null : Mapear(row);
    }

    public async Task Adicionar(Notificacao notificacao, CancellationToken ct)
    {
        var demanda = await db.Demandas.FirstAsync(d => d.Id == notificacao.DemandaId, ct);
        var usuario = await db.Usuarios.FirstAsync(u => u.Id == notificacao.UsuarioId, ct);
        db.Notificacoes.Add(new NotificacaoRegistro
        {
            Id = notificacao.Id,
            DemandaIdInterno = demanda.IdInterno,
            UsuarioIdInterno = usuario.IdInterno,
            Texto = notificacao.Texto,
            Leitura = notificacao.Lida ? "LIDA" : "NAO_LIDA",
            CriadaEm = notificacao.CriadaEm
        });
    }

    public async Task<IReadOnlyList<Notificacao>> ListarDoUsuario(Guid usuarioId, CancellationToken ct)
    {
        var rows = await db.Notificacoes.Include(n => n.Usuario).Include(n => n.Demanda)
            .Where(n => n.Usuario!.Id == usuarioId)
            .ToListAsync(ct);
        return rows.Select(Mapear).ToArray();
    }

    async Task<Notificacao?> INotificacoes.Obter(Guid id, CancellationToken ct)
    {
        var row = await db.Notificacoes.Include(n => n.Usuario).Include(n => n.Demanda)
            .FirstOrDefaultAsync(n => n.Id == id, ct);
        return row is null ? null : Mapear(row);
    }

    public async Task Salvar(Notificacao notificacao, CancellationToken ct)
    {
        var row = await db.Notificacoes.FirstAsync(n => n.Id == notificacao.Id, ct);
        row.Leitura = notificacao.Lida ? "LIDA" : "NAO_LIDA";
        await db.SaveChangesAsync(ct);
    }

    private IQueryable<DemandaRegistro> Consulta() =>
        db.Demandas
            .Include(d => d.Cessionario).ThenInclude(usuario => usuario!.EmpresaCessionaria)
            .Include(d => d.EmpresaCessionaria)
            .Include(d => d.Responsavel)
            .Include(d => d.Categoria)
            .Include(d => d.Subcategoria)
            .Include(d => d.Area)
            .Include(d => d.Mensagens).ThenInclude(m => m.Autor)
            .Include(d => d.Anexos)
            .Include(d => d.Historico).ThenInclude(h => h.Usuario)
            .Include(d => d.Decisoes).ThenInclude(x => x.Usuario);

    private async Task Copiar(
        DemandaRegistro row,
        Demanda demanda,
        Dictionary<Guid, UsuarioRegistro> usuarios,
        CancellationToken ct)
    {
        var categoria = await db.Categorias.FirstAsync(c => c.Id == demanda.CategoriaId, ct);
        var sub = await db.Subcategorias.FirstAsync(s => s.Id == demanda.SubcategoriaId, ct);
        var area = await db.Areas.FirstAsync(a => a.Id == demanda.AreaId, ct);
        var cessionario = usuarios[demanda.CessionarioId];
        var empresaIdInterno = demanda.EmpresaCessionariaId is Guid empresaId
            ? (await db.EmpresasCessionarias.FirstOrDefaultAsync(empresa => empresa.Id == empresaId, ct))?.IdInterno
            : cessionario.EmpresaCessionariaIdInterno;
        if (empresaIdInterno is null)
            throw new RegraNegocioException("O Cessionário não está associado a uma empresa ativa.");
        row.Id = demanda.Id;
        row.Protocolo = demanda.Protocolo;
        row.CessionarioIdInterno = cessionario.IdInterno;
        row.EmpresaCessionariaIdInterno = empresaIdInterno.Value;
        row.Empresa = demanda.Empresa;
        row.Sala = demanda.Sala;
        row.Descricao = demanda.Descricao;
        row.Ponto = demanda.Ponto;
        row.CategoriaIdInterno = categoria.IdInterno;
        row.SubcategoriaIdInterno = sub.IdInterno;
        row.AreaIdInterno = area.IdInterno;
        row.ResponsavelIdInterno = demanda.ResponsavelId is Guid responsavel ? usuarios[responsavel].IdInterno : null;
        row.Servico = demanda.Servico;
        row.Destino = demanda.Destino;
        row.Situacao = demanda.Situacao.ParaTexto();
        row.Prioridade = demanda.Prioridade;
        row.OrdemPrioridade = demanda.OrdemPrioridade;
        row.Confianca = demanda.Confianca;
        row.Classificacao = demanda.Classificacao;
        row.Fluxo = demanda.Fluxo.ParaCodigo();
        row.AbertoEm = demanda.AbertoEm;
        row.AtualizadoEm = demanda.AtualizadoEm;
        row.PrevisaoAtendimento = demanda.PrevisaoAtendimento;
        row.Natureza = demanda.Natureza;
        row.NotaAvaliacao = demanda.NotaAvaliacao;
        row.ComentarioAvaliacao = demanda.ComentarioAvaliacao;
        row.AvaliadaEm = demanda.AvaliadaEm;
    }

    private static MensagemRegistro NovaMensagem(Mensagem mensagem, Dictionary<Guid, UsuarioRegistro> usuarios) =>
        new()
        {
            Id = mensagem.Id,
            AutorIdInterno = usuarios[mensagem.AutorId].IdInterno,
            Texto = mensagem.Texto,
            Canal = mensagem.Canal,
            Finalidade = mensagem.Finalidade,
            EnviadaEm = mensagem.EnviadaEm
        };

    private static AnexoRegistro NovoAnexo(Anexo anexo) =>
        new()
        {
            Id = anexo.Id,
            Nome = anexo.Nome,
            Caminho = anexo.Caminho,
            Tipo = anexo.Tipo,
            Tamanho = anexo.Tamanho,
            EnviadoEm = anexo.EnviadoEm
        };

    private static HistoricoRegistro NovoHistorico(HistoricoDemanda evento, Dictionary<Guid, UsuarioRegistro> usuarios) =>
        new()
        {
            Id = evento.Id,
            UsuarioIdInterno = usuarios[evento.UsuarioId].IdInterno,
            StatusAnterior = evento.StatusAnterior,
            StatusNovo = evento.StatusNovo,
            Comentario = evento.Comentario,
            TipoEvento = evento.TipoEvento,
            EventoEm = evento.EventoEm
        };

    private static DecisaoRegistro NovaDecisao(DecisaoAprovacao decisao, Dictionary<Guid, UsuarioRegistro> usuarios) =>
        new()
        {
            Id = decisao.Id,
            UsuarioIdInterno = usuarios[decisao.UsuarioId].IdInterno,
            Decisao = decisao.Decisao,
            Motivo = decisao.Motivo,
            DecididaEm = decisao.DecididaEm
        };

    private static Usuario Mapear(UsuarioRegistro row) =>
        new(
            row.Id,
            row.Nome,
            row.Email,
            row.SenhaHash,
            PerfilTexto.ParaPerfil(row.Perfil),
            row.Empresa,
            row.Sala,
            row.Area?.Id,
            row.LogoEmpresa,
            row.Foto,
            row.EmpresaCessionaria?.Id,
            row.IdentidadeEstavel,
            row.Status == "ATIVO",
            row.EmpresaCessionaria?.Status == "ATIVO");

    private static EspacoConsulta MapearEspaco(EspacoRegistro row)
    {
        var historico = row.Locacoes
            .OrderByDescending(locacao => locacao.Inicio)
            .Select(locacao => new LocacaoResumo(
                locacao.Id,
                locacao.Empresa!.Id,
                locacao.Empresa.Nome,
                locacao.Inicio,
                locacao.Termino))
            .ToArray();
        var locacaoVigente = row.Locacoes.SingleOrDefault(locacao => locacao.Termino is null);
        var espaco = Espaco.Carregar(
            row.Id,
            row.Codigo,
            row.Nome,
            row.Localizacao,
            row.Descricao,
            row.Status == "ATIVO");
        var empresa = locacaoVigente is null
            ? null
            : new EmpresaOpcao(locacaoVigente.Empresa!.Id, locacaoVigente.Empresa.Nome, locacaoVigente.Empresa.Status == "ATIVO");
        return new EspacoConsulta(espaco, espaco.Situacao(locacaoVigente is not null), empresa, historico);
    }

    private static FuncaoCadastro MapearFuncao(FuncaoCessionarioRegistro funcao) => new(
        funcao.Id,
        funcao.Nome,
        funcao.Status == "ATIVO",
        funcao.Permissoes
            .Select(item => Enum.TryParse<PermissaoCessionario>(item.Permissao, out var permissao) ? permissao : (PermissaoCessionario?)null)
            .Where(permissao => permissao.HasValue)
            .Select(permissao => permissao!.Value)
            .Distinct()
            .ToArray());

    private static Subcategoria Mapear(SubcategoriaRegistro row)
    {
        return new Subcategoria(row.Id, row.Categoria!.Id, row.Area!.Id, row.Nome, FluxoDemandaTexto.ParaFluxo(row.Fluxo), row.Status == "ATIVO");
    }

    private static Demanda Mapear(DemandaRegistro row) =>
        Demanda.Carregar(
            row.Id,
            row.Protocolo,
            row.Cessionario!.Id,
            row.Empresa,
            row.Sala,
            row.Descricao,
            row.Ponto,
            row.Categoria!.Id,
            row.Subcategoria!.Id,
            row.Area!.Id,
            row.Responsavel?.Id,
            row.Servico,
            row.Destino,
            SituacaoDemandaTexto.ParaSituacao(row.Situacao),
            row.Prioridade,
            row.OrdemPrioridade,
            row.Confianca,
            row.Classificacao,
            FluxoDemandaTexto.ParaFluxo(row.Fluxo),
            row.AbertoEm,
            row.AtualizadoEm,
            row.Mensagens.Select(m => new Mensagem(m.Id, m.Autor!.Id, m.Texto, m.Canal, m.EnviadaEm, m.Finalidade)),
            row.Anexos.Select(a => new Anexo(a.Id, a.Nome, a.Caminho, a.Tipo, a.Tamanho, a.EnviadoEm)),
            row.Historico.Select(h => new HistoricoDemanda(h.Id, h.Usuario!.Id, h.StatusAnterior, h.StatusNovo, h.Comentario, h.TipoEvento, h.EventoEm)),
            row.Decisoes.Select(d => new DecisaoAprovacao(d.Id, d.Usuario!.Id, d.Decisao, d.Motivo, d.DecididaEm)),
            row.PrevisaoAtendimento,
            row.Natureza,
            row.NotaAvaliacao,
            row.ComentarioAvaliacao,
            row.AvaliadaEm,
            row.EmpresaCessionaria?.Id ?? row.Cessionario?.EmpresaCessionaria?.Id);

    private static Obra Mapear(ObraRegistro row) =>
        new(
            row.Id,
            row.Nome,
            row.Local,
            row.Descricao,
            row.InicioPrevisto,
            row.TerminoPrevisto,
            row.EmpresaExecutora,
            row.Responsavel,
            row.Contato,
            row.Etapa,
            row.Documentos.Select(d => new DocumentoObra(d.Id, d.Nome, d.Situacao, d.Ordem)).ToArray());

    private static Notificacao Mapear(NotificacaoRegistro row) =>
        new(row.Id, row.Demanda!.Id, row.Usuario!.Id, row.Texto, row.Leitura == "LIDA", row.CriadaEm);

    public async Task<IReadOnlyList<CadeiaDoTipo>> Listar(CancellationToken ct)
    {
        var rows = await db.EtapasCadeia.Include(e => e.Subcategoria).OrderBy(e => e.Ordem).ToListAsync(ct);
        return rows
            .Where(row => row.Subcategoria is not null)
            .GroupBy(row => row.Subcategoria!.Id)
            .Select(grupo => new CadeiaDoTipo(grupo.Key, grupo.Select(MapearEtapa).ToArray()))
            .ToArray();
    }

    public async Task<IReadOnlyList<EtapaCadeia>> Obter(Guid subcategoriaId, CancellationToken ct)
    {
        var sub = await db.Subcategorias.FirstOrDefaultAsync(s => s.Id == subcategoriaId, ct);
        if (sub is null)
            return CadeiaAtendimento.Padrao();

        var rows = await db.EtapasCadeia
            .Where(e => e.SubcategoriaIdInterno == sub.IdInterno)
            .OrderBy(e => e.Ordem)
            .ToListAsync(ct);
        if (rows.Count == 0)
            return CadeiaAtendimento.Padrao();

        return rows.Select(MapearEtapa).ToArray();
    }

    public async Task Salvar(Guid subcategoriaId, IReadOnlyList<EtapaCadeia> etapas, CancellationToken ct)
    {
        var sub = await db.Subcategorias.FirstAsync(s => s.Id == subcategoriaId, ct);
        var atuais = await db.EtapasCadeia.Where(e => e.SubcategoriaIdInterno == sub.IdInterno).ToListAsync(ct);
        db.EtapasCadeia.RemoveRange(atuais);
        db.EtapasCadeia.AddRange(etapas.Select(etapa => new EtapaCadeiaRegistro
        {
            SubcategoriaIdInterno = sub.IdInterno,
            Codigo = etapa.Codigo,
            Nome = etapa.Nome,
            Ordem = etapa.Ordem,
            Automatica = etapa.Automatica,
            Campos = string.Join(',', etapa.Tarefas.Select(tarefa => $"{tarefa.Codigo}:{(tarefa.Obrigatoria ? "1" : "0")}"))
        }));
        await db.SaveChangesAsync(ct);
    }

    private static EtapaCadeia MapearEtapa(EtapaCadeiaRegistro row)
    {
        var tarefas = row.Campos
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(parte =>
            {
                var pedacos = parte.Split(':', 2);
                var obrigatoria = !row.Automatica && (pedacos.Length < 2 || pedacos[1] != "0");
                return new TarefaCadeia(pedacos[0], obrigatoria);
            })
            .ToArray();
        return new EtapaCadeia(row.Codigo, row.Nome, row.Ordem, row.Automatica, tarefas.Select(tarefa => tarefa.Codigo).ToArray(), tarefas);
    }
}
