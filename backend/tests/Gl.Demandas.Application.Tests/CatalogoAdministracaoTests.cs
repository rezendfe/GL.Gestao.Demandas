using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure;
using Gl.Demandas.Infrastructure.Persistence;

namespace Gl.Demandas.Application.Tests;

public sealed class CatalogoAdministracaoTests : IDisposable
{
    private readonly BancoDeTeste _banco;
    private readonly AppDbContext _db;
    private readonly CatalogoAdministracaoAplicacao _admin;
    private readonly CatalogoAplicacao _catalogo;
    private readonly LoginAplicacao _login;

    public CatalogoAdministracaoTests()
    {
        _banco = new BancoDeTeste();
        _db = _banco.Contexto;
        DemoSeed.Aplicar(_db, new DateTime(2026, 9, 28, 15, 0, 0, DateTimeKind.Utc));
        var repo = new GlRepositorio(_db);
        _admin = new CatalogoAdministracaoAplicacao(repo, repo);
        _catalogo = new CatalogoAplicacao(repo, repo);
        _login = new LoginAplicacao(repo, new EmissorTokenDemo(TokenDemo.ChaveDesenvolvimento));
    }

    public void Dispose() => _banco.Dispose();

    [Fact]
    public async Task Gl_cadastra_area_e_responsavel()
    {
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        await _admin.SalvarArea(gl, null, "Segurança", true, CancellationToken.None);
        var seguranca = (await _catalogo.Obter(CancellationToken.None)).Areas.Single(a => a.Nome == "Segurança");
        Assert.True(seguranca.Ativa);

        await _admin.SalvarResponsavel(gl, null, "Ana Costa", "ana.costa@gleventos.com.br", seguranca.Id, true, CancellationToken.None);
        var ana = (await _catalogo.Obter(CancellationToken.None)).Responsaveis.Single(p => p.Email == "ana.costa@gleventos.com.br");
        Assert.Equal("Ana Costa", ana.Nome);
        Assert.Equal(seguranca.Id, ana.AreaId);
        Assert.True(ana.Ativo);

        var sessao = await _login.Entrar("ana.costa@gleventos.com.br", "Demo@2026", CancellationToken.None);
        Assert.Equal("Responsável da Área", sessao.Usuario.Perfil);
    }

    [Fact]
    public async Task Area_com_tipo_ativo_nao_e_desativada_e_cessionario_nao_cadastra()
    {
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var cessionario = new Ator(DemoIds.Joao, Perfil.Cessionario, null);
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _admin.SalvarArea(gl, DemoIds.AreaManutencao, "Manutenção", false, CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _admin.SalvarArea(cessionario, null, "Outra área", true, CancellationToken.None));
    }

    [Fact]
    public async Task Gl_grava_meta_de_prazo_da_categoria()
    {
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var agora = new DateTime(2026, 9, 28, 15, 0, 0, DateTimeKind.Utc);
        await _admin.SalvarCategoria(gl, DemoIds.CatManutencao, "Manutenção", true, 2, null, CancellationToken.None);
        var manutencao = (await _catalogo.Obter(CancellationToken.None)).Categorias.Single(c => c.Id == DemoIds.CatManutencao);
        Assert.Equal(2, manutencao.PrazoHoras);

        Assert.True(PrazoAtendimento.EmAtraso(true, agora.AddHours(-3), null, 2, agora));
        Assert.False(PrazoAtendimento.EmAtraso(true, agora.AddHours(-3), agora.AddHours(1), 2, agora));
        Assert.False(PrazoAtendimento.EmAtraso(true, agora.AddHours(-3), null, null, agora));
        Assert.False(PrazoAtendimento.EmAtraso(false, agora.AddHours(-3), null, 2, agora));

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _admin.SalvarCategoria(new Ator(DemoIds.Resp01, Perfil.ResponsavelArea, DemoIds.AreaManutencao), DemoIds.CatManutencao, "Manutenção", true, 4, null, CancellationToken.None));
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _admin.SalvarCategoria(gl, DemoIds.CatManutencao, "Manutenção", true, 0, null, CancellationToken.None));
    }
}
