using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure.Persistence;

namespace Gl.Demandas.Application.Tests;

public sealed class EspacosAplicacaoTests
{
    [Fact]
    public async Task Locacao_e_encerramento_preservam_historico_e_atualizam_situacao()
    {
        await using var banco = new BancoDeTeste();
        var db = banco.Contexto;
        DemoSeed.Aplicar(db, DateTime.UtcNow);
        Assert.All(db.Demandas, demanda => Assert.NotEqual(0, demanda.EmpresaCessionariaIdInterno));
        var aplicacao = new EspacosAplicacao(new GlRepositorio(db));
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var novo = await aplicacao.Salvar(
            gl,
            new EspacoComando(null, "SALA-999", "Sala 999", "Pavilhão 9", "Sala disponível", true),
            CancellationToken.None);

        var locado = await aplicacao.IniciarLocacao(
            gl,
            new IniciarLocacaoComando(novo.Id, DemoIds.EmpresaExemplo, new DateOnly(2026, 9, 1)),
            CancellationToken.None);

        Assert.Equal("Locado", locado.Situacao);
        Assert.Equal("Empresa Exemplo", locado.EmpresaLocataria?.Nome);
        await Assert.ThrowsAsync<RegraNegocioException>(() => aplicacao.IniciarLocacao(
            gl,
            new IniciarLocacaoComando(novo.Id, DemoIds.EmpresaBId, new DateOnly(2026, 9, 2)),
            CancellationToken.None));

        var disponivel = await aplicacao.EncerrarLocacao(gl, novo.Id, new DateOnly(2026, 9, 29), CancellationToken.None);

        Assert.Equal("Disponível", disponivel.Situacao);
        var locacao = Assert.Single(disponivel.Historico);
        Assert.Equal(new DateOnly(2026, 9, 1), locacao.Inicio);
        Assert.Equal(new DateOnly(2026, 9, 29), locacao.Termino);
    }

    [Fact]
    public async Task Cessionario_nao_consulta_inventario_administrativo()
    {
        await using var banco = new BancoDeTeste();
        var db = banco.Contexto;
        DemoSeed.Aplicar(db, DateTime.UtcNow);
        var aplicacao = new EspacosAplicacao(new GlRepositorio(db));

        await Assert.ThrowsAsync<AcessoNegadoException>(() => aplicacao.Listar(
            new Ator(DemoIds.Joao, Perfil.Cessionario, null),
            CancellationToken.None));
    }

    [Fact]
    public async Task Espaco_com_locacao_vigente_nao_pode_ser_inativado()
    {
        await using var banco = new BancoDeTeste();
        var db = banco.Contexto;
        DemoSeed.Aplicar(db, DateTime.UtcNow);
        var aplicacao = new EspacosAplicacao(new GlRepositorio(db));
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);

        await Assert.ThrowsAsync<RegraNegocioException>(() => aplicacao.Salvar(
            gl,
            new EspacoComando(DemoIds.EspacoSala205, "SALA-205", "Sala 205", "Pavilhão 2", "Sala comercial", false),
            CancellationToken.None));
    }

}