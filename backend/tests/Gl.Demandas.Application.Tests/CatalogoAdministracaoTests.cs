using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure;
using Gl.Demandas.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gl.Demandas.Application.Tests;

public sealed class CatalogoAdministracaoTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly CatalogoAdministracaoAplicacao _admin;
    private readonly CatalogoAplicacao _catalogo;
    private readonly LoginAplicacao _login;

    public CatalogoAdministracaoTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        DemoSeed.Aplicar(_db, new DateTime(2026, 9, 28, 15, 0, 0, DateTimeKind.Utc));
        var repo = new GlRepositorio(_db);
        _admin = new CatalogoAdministracaoAplicacao(repo, repo);
        _catalogo = new CatalogoAplicacao(repo, repo);
        _login = new LoginAplicacao(repo, new EmissorTokenDemo(TokenDemo.ChaveDesenvolvimento));
    }

    public void Dispose() => _db.Dispose();

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
}
