using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure.Persistence;

namespace Gl.Demandas.Application.Tests;

public sealed class AuditoriaAplicacaoTests
{
    private static readonly DateTime Agora = new(2026, 10, 5, 15, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task Dia_devolve_somente_acoes_do_proprio_usuario()
    {
        var propria = Linha(DemoIds.Joao, "João Silva", Agora);
        var alheia = Linha(DemoIds.Gl, "Patrícia Lima", Agora);
        var ontem = Linha(DemoIds.Joao, "João Silva", Agora.AddDays(-1));
        var repo = new AuditoriaFalsa([propria, alheia, ontem]);
        var app = new AuditoriaAplicacao(repo, new UsuariosVazios(), new RelogioFixo(Agora));

        var dia = await app.DoDia(new Ator(DemoIds.Joao, Perfil.Cessionario, null, DemoIds.EmpresaExemplo), CancellationToken.None);

        var unica = Assert.Single(dia);
        Assert.Equal(DemoIds.Joao, unica.AutorId);
        Assert.Equal(propria.Id, unica.Id);
        Assert.Equal(DemoIds.Joao, repo.Ultimo?.AutorId);
    }

    [Fact]
    public async Task Pesquisa_de_outro_usuario_fica_com_o_gl()
    {
        var repo = new AuditoriaFalsa([Linha(DemoIds.Resp01, "Responsável 01", Agora)]);
        var app = new AuditoriaAplicacao(repo, new UsuariosVazios(), new RelogioFixo(Agora));
        var hoje = new DateOnly(2026, 10, 5);

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            app.Pesquisar(new Ator(DemoIds.Joao, Perfil.Cessionario, null, DemoIds.EmpresaExemplo), hoje, hoje, DemoIds.Resp01, null, CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            app.Pesquisar(new Ator(DemoIds.Resp01, Perfil.ResponsavelArea, DemoIds.AreaManutencao), hoje, hoje, null, null, CancellationToken.None));

        var achados = await app.Pesquisar(new Ator(DemoIds.Gl, Perfil.GlAdministrador, null), hoje, hoje, DemoIds.Resp01, null, CancellationToken.None);

        Assert.Equal(DemoIds.Resp01, Assert.Single(achados).AutorId);
    }

    [Fact]
    public async Task Pesquisa_aceita_tres_meses_e_recusa_intervalo_maior()
    {
        var app = new AuditoriaAplicacao(new AuditoriaFalsa([]), new UsuariosVazios(), new RelogioFixo(Agora));
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);

        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            app.Pesquisar(gl, new DateOnly(2026, 10, 5), new DateOnly(2026, 10, 4), null, null, CancellationToken.None));
        var dentro = await app.Pesquisar(gl, new DateOnly(2026, 1, 15), new DateOnly(2026, 4, 15), null, null, CancellationToken.None);
        Assert.Empty(dentro);
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            app.Pesquisar(gl, new DateOnly(2026, 1, 15), new DateOnly(2026, 4, 16), null, null, CancellationToken.None));
    }

    [Fact]
    public async Task Exportacao_entrega_a_base_inteira_em_excel_somente_para_o_gl()
    {
        var antiga = Linha(DemoIds.Joao, "João Silva", new DateTime(2024, 3, 2, 15, 0, 0, DateTimeKind.Utc));
        var recente = Linha(DemoIds.Gl, "Patrícia Lima", Agora);
        var repo = new AuditoriaFalsa([antiga, recente]);
        var app = new AuditoriaAplicacao(repo, new UsuariosVazios(), new RelogioFixo(Agora));

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            app.ExportarBase(new Ator(DemoIds.Joao, Perfil.Cessionario, null, DemoIds.EmpresaExemplo), CancellationToken.None));

        var arquivo = await app.ExportarBase(new Ator(DemoIds.Gl, Perfil.GlAdministrador, null), CancellationToken.None);

        Assert.Equal("auditoria.xlsx", arquivo.Nome);
        Assert.Null(repo.Ultimo?.De);
        Assert.Null(repo.Ultimo?.Ate);
        using var zip = new System.IO.Compression.ZipArchive(new MemoryStream(arquivo.Conteudo));
        var planilha = zip.GetEntry("xl/worksheets/sheet1.xml");
        Assert.NotNull(planilha);
        using var leitor = new StreamReader(planilha.Open());
        var xml = await leitor.ReadToEndAsync();
        Assert.Contains("João Silva", xml);
        Assert.Contains("Patrícia Lima", xml);
        Assert.Contains("02/03/2024 12:00", xml);
    }

    private static LinhaAuditoria Linha(Guid autorId, string autor, DateTime quando) =>
        new(Guid.NewGuid(), "demanda", Guid.NewGuid(), "GL-2026-00123", autorId, autor, "Cessionário", "ABERTURA", "Chamado aberto.", null, "Novo", quando);

    private sealed class RelogioFixo(DateTime agora) : IRelogio
    {
        public DateTime UtcNow => agora;
    }

    private sealed class AuditoriaFalsa(IReadOnlyList<LinhaAuditoria> linhas) : IAuditoria
    {
        public FiltroAuditoria? Ultimo { get; private set; }

        public Task<IReadOnlyList<LinhaAuditoria>> Listar(FiltroAuditoria filtro, CancellationToken ct)
        {
            Ultimo = filtro;
            IEnumerable<LinhaAuditoria> consulta = linhas;
            if (filtro.De is DateTime de)
                consulta = consulta.Where(linha => linha.EventoEm >= de);
            if (filtro.Ate is DateTime ate)
                consulta = consulta.Where(linha => linha.EventoEm < ate);
            if (filtro.AutorId is Guid autor)
                consulta = consulta.Where(linha => linha.AutorId == autor);
            return Task.FromResult<IReadOnlyList<LinhaAuditoria>>(consulta.ToArray());
        }
    }

    private sealed class UsuariosVazios : IUsuarios
    {
        public Task<Usuario?> ObterPorEmail(string email, CancellationToken ct) => Task.FromResult<Usuario?>(null);
        public Task<Usuario?> ObterPorIdentidadeEstavel(string identidade, CancellationToken ct) => Task.FromResult<Usuario?>(null);
        public Task<Usuario?> Obter(Guid id, CancellationToken ct) => Task.FromResult<Usuario?>(null);
        public Task<IReadOnlyList<Usuario>> Listar(CancellationToken ct) => Task.FromResult<IReadOnlyList<Usuario>>([]);
        public Task VincularIdentidadeEstavel(Guid usuarioId, string identidade, CancellationToken ct) => Task.CompletedTask;
        public Task SalvarResponsavel(Guid? id, string nome, string email, Guid areaId, bool ativo, string? senhaHashNovo, CancellationToken ct) => Task.CompletedTask;
        public Task<IReadOnlySet<PermissaoCessionario>> PermissoesCessionario(Guid usuarioId, CancellationToken ct) =>
            Task.FromResult<IReadOnlySet<PermissaoCessionario>>(new HashSet<PermissaoCessionario>());
    }
}
