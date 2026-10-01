using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure;
using Gl.Demandas.Infrastructure.Persistence;

namespace Gl.Demandas.Application.Tests;

public sealed class PreenchimentoSolicitacaoTests : IDisposable
{
    private const string Fala = """
        Tô com vazamento aqui na minha sala aqui que é do ar condicionado eu tô na sala 534 fico aqui próximo ao Instituto de incêndio Rosa né e cara tu puder vir aqui amanhã dia 29/09/2006 ele vai ajudar mas vem no período da manhã né aí meu telefone você pode ligar é 21 99468-4864 é infiltração ali eu acho que tem problema de elétrica também você tá ação do ar condicionado tá E a equipe toda tá autorizada a entrar aqui para fazer aqui o conserto aqui é só procurar aqui a Maria José
        """;

    private readonly BancoDeTeste _banco;
    private readonly AppDbContext _db;
    private readonly AtendimentoAplicacao _atendimento;
    private readonly string _pasta;

    public PreenchimentoSolicitacaoTests()
    {
        _banco = new BancoDeTeste();
        _db = _banco.Contexto;
        var agora = new DateTime(2026, 9, 28, 15, 0, 0, DateTimeKind.Utc);
        DemoSeed.Aplicar(_db, agora);
        var repo = new GlRepositorio(_db);
        _pasta = Path.Combine(Path.GetTempPath(), "gl-poc-tests", Guid.NewGuid().ToString("N"));
        _atendimento = new AtendimentoAplicacao(
            repo,
            repo,
            repo,
            repo,
            new ArmazenamentoLocal(_pasta),
            new RelogioFixo(agora),
            new ClassificadorDemanda(repo),
            new ExtratorNulo(),
            repo,
            new EnvioPushNulo());
    }

    [Fact]
    public void Leitura_local_preenche_os_campos_ditos_na_fala()
    {
        var hoje = new DateOnly(2026, 9, 28);
        var leitura = LeitorSolicitacao.Ler(Fala, hoje);

        Assert.Equal("Vazamento do ar-condicionado", leitura.Assunto);
        Assert.Equal("Sala 534", leitura.Sala);
        Assert.Equal("Próximo ao Instituto de incêndio Rosa", leitura.Ponto);
        Assert.Equal(new DateOnly(2026, 9, 29), leitura.DataDesejada);
        Assert.Equal("Manhã", leitura.Periodo);
        Assert.Equal("(21) 99468-4864", leitura.Telefone);
        Assert.Contains("Ar-condicionado", leitura.Itens);
        Assert.Contains("Infiltração", leitura.Itens);
        Assert.Contains("Elétrica", leitura.Itens);
        Assert.True(leitura.AutorizaAcesso);
    }

    [Fact]
    public void Amanha_nao_vira_periodo_da_manha()
    {
        var leitura = LeitorSolicitacao.Ler("Pode vir amanhã na sala 10.", new DateOnly(2026, 9, 28));

        Assert.Null(leitura.Periodo);
        Assert.Equal(new DateOnly(2026, 9, 29), leitura.DataDesejada);
        Assert.Equal("Sala 10", leitura.Sala);
    }

    [Fact]
    public async Task Preencher_sem_modelo_usa_leitura_local_e_a_regra_de_classificacao()
    {
        var preenchimento = await _atendimento.Preencher(Fala, CancellationToken.None);

        Assert.Equal("leitura-local", preenchimento.Origem);
        Assert.Equal("Sala 534", preenchimento.Sala);
        Assert.Equal("2026-09-29", preenchimento.DataDesejada);
        Assert.Equal("Manhã", preenchimento.Periodo);
        Assert.Equal("(21) 99468-4864", preenchimento.Telefone);
        Assert.NotNull(preenchimento.Sugestao);
        Assert.Equal("Civil", preenchimento.Sugestao!.Subcategoria);
    }

    [Fact]
    public async Task Modelo_pode_escolher_subcategoria_que_existe_no_catalogo()
    {
        var agora = new DateTime(2026, 9, 28, 15, 0, 0, DateTimeKind.Utc);
        var repo = new GlRepositorio(_db);
        var atendimento = new AtendimentoAplicacao(
            repo,
            repo,
            repo,
            repo,
            new ArmazenamentoLocal(_pasta),
            new RelogioFixo(agora),
            new ClassificadorDemanda(repo),
            new ExtratorFixo(new LeituraSolicitacao(
                "Vazamento do ar-condicionado",
                "sala 534",
                "próximo ao instituto",
                null,
                "manha",
                "21994684864",
                ["infiltração", "ar condicionado"],
                true,
                "Refrigeração")),
            repo,
            new EnvioPushNulo());

        var preenchimento = await atendimento.Preencher(Fala, CancellationToken.None);

        Assert.Equal("modelo", preenchimento.Origem);
        Assert.Equal("Sala 534", preenchimento.Sala);
        Assert.Equal("Próximo ao instituto", preenchimento.Ponto);
        Assert.Equal("Manhã", preenchimento.Periodo);
        Assert.Equal("(21) 99468-4864", preenchimento.Telefone);
        Assert.Equal(["Infiltração", "Ar-condicionado"], preenchimento.Itens);
        Assert.Equal("Refrigeração", preenchimento.Sugestao!.Subcategoria);
        Assert.Equal(DemoIds.SubRefrigeracao, preenchimento.Sugestao.SubcategoriaId);
    }

    [Fact]
    public void Pedido_do_modelo_informa_o_modelo_e_o_esquema()
    {
        var json = ExtratorOpenAi.Corpo("gpt-4o", "vazamento na sala 10", new DateOnly(2026, 9, 28));

        Assert.Contains("gpt-4o", json);
        Assert.Contains("json_schema", json);
        Assert.Contains("preenchimento_solicitacao", json);
        Assert.DoesNotContain("sk-", json);
    }

    [Fact]
    public void Chave_do_arquivo_de_ambiente_nao_vaza_outras_variaveis()
    {
        var pasta = Path.Combine(Path.GetTempPath(), "gl-poc-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(pasta);
        var arquivo = Path.Combine(pasta, ".env");
        File.WriteAllLines(arquivo, ["OUTRA=segredo", "OPENAI_API_KEY=\"sk-teste\"", ""]);

        Assert.Equal("sk-teste", ExtratorOpenAi.LerChave(arquivo));
        Assert.Null(ExtratorOpenAi.LerChave(Path.Combine(pasta, "ausente.env")));

        Directory.Delete(pasta, true);
    }

    public void Dispose()
    {
        _banco.Dispose();
        if (Directory.Exists(_pasta))
            Directory.Delete(_pasta, true);
    }

    private sealed class RelogioFixo(DateTime agora) : IRelogio
    {
        public DateTime UtcNow => agora;
    }

    private sealed class ExtratorNulo : IExtratorSolicitacao
    {
        public Task<LeituraSolicitacao?> Extrair(string texto, DateOnly hoje, CancellationToken ct) =>
            Task.FromResult<LeituraSolicitacao?>(null);
    }

    private sealed class ExtratorFixo(LeituraSolicitacao leitura) : IExtratorSolicitacao
    {
        public Task<LeituraSolicitacao?> Extrair(string texto, DateOnly hoje, CancellationToken ct) =>
            Task.FromResult<LeituraSolicitacao?>(NormalizadorSolicitacao.Aplicar(
                leitura.Assunto,
                leitura.Sala,
                leitura.Ponto,
                leitura.DataDesejada?.ToString("yyyy-MM-dd"),
                leitura.Periodo,
                leitura.Telefone,
                leitura.Itens,
                leitura.AutorizaAcesso,
                leitura.Subcategoria,
                hoje));
    }
}
