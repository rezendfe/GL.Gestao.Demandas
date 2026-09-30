using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure.Persistence;

namespace Gl.Demandas.Application.Tests;

public sealed class GestaoCessionariosTests
{
    [Fact]
    public async Task Funcao_e_representante_persistem_contatos_e_permissoes_efetivas()
    {
        await using var banco = new BancoDeTeste();
        var db = banco.Contexto;
        DemoSeed.Aplicar(db, DateTime.UtcNow);
        var repo = new GlRepositorio(db);
        var app = new GestaoCessionariosAplicacao(repo);
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var funcao = await app.SalvarFuncao(
            gl,
            DemoIds.EmpresaExemplo,
            new SalvarFuncaoComando(null, "Solicitante", true, [nameof(PermissaoCessionario.AbrirDemanda), nameof(PermissaoCessionario.ConsultarEmpresa)]),
            CancellationToken.None);

        var representante = await app.SalvarRepresentante(
            gl,
            DemoIds.EmpresaExemplo,
            new SalvarRepresentanteComando(
                null,
                "Maria Representante",
                "maria@example.com",
                true,
                [
                    new ContatoComando(null, "Email", "maria.contato@example.com", true),
                    new ContatoComando(null, "Email", "maria.alternativo@example.com", false),
                    new ContatoComando(null, "WhatsApp", "+5521999999999", true)
                ],
                [funcao.Id]),
            CancellationToken.None);

        Assert.Equal("maria@example.com", representante.Email);
        Assert.Equal(3, representante.Contatos.Count);
        Assert.Equal(2, representante.Funcoes.Count == 0 ? 0 : representante.Contatos.Count(contato => contato.Principal));
        var permissoes = await repo.PermissoesCessionario(representante.UsuarioId, CancellationToken.None);
        Assert.Contains(PermissaoCessionario.AbrirDemanda, permissoes);
        Assert.Contains(PermissaoCessionario.ConsultarEmpresa, permissoes);
        Assert.DoesNotContain(PermissaoCessionario.AvaliarAtendimento, permissoes);
    }

    [Fact]
    public async Task Login_nao_pode_ser_associado_a_outra_empresa()
    {
        await using var banco = new BancoDeTeste();
        var db = banco.Contexto;
        DemoSeed.Aplicar(db, DateTime.UtcNow);
        var app = new GestaoCessionariosAplicacao(new GlRepositorio(db));
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        await app.SalvarRepresentante(
            gl,
            DemoIds.EmpresaExemplo,
            new SalvarRepresentanteComando(null, "Maria Representante", "maria@example.com", true, [], []),
            CancellationToken.None);

        await Assert.ThrowsAsync<RegraNegocioException>(() => app.SalvarRepresentante(
            gl,
            DemoIds.EmpresaBId,
            new SalvarRepresentanteComando(null, "Maria Representante", "maria@example.com", true, [], []),
            CancellationToken.None));
    }

    [Fact]
    public async Task Somente_gl_pode_manter_empresa_e_funcoes()
    {
        await using var banco = new BancoDeTeste();
        var db = banco.Contexto;
        DemoSeed.Aplicar(db, DateTime.UtcNow);
        var app = new GestaoCessionariosAplicacao(new GlRepositorio(db));

        await Assert.ThrowsAsync<AcessoNegadoException>(() => app.SalvarEmpresa(
            new Ator(DemoIds.Joao, Perfil.Cessionario, null),
            new SalvarEmpresaComando(null, "Empresa não autorizada", true, null),
            CancellationToken.None));
    }

}