using Gl.Demandas.Domain;

namespace Gl.Demandas.Application.Tests;

public sealed class EspacosTests
{
    [Fact]
    public void Situacao_do_espaco_depende_da_locacao_e_atividade()
    {
        var espaco = NovoEspaco();

        Assert.Equal(SituacaoEspaco.Disponivel, espaco.Situacao(false));
        Assert.Equal(SituacaoEspaco.Locado, espaco.Situacao(true));

        espaco.Inativar(false);

        Assert.Equal(SituacaoEspaco.Inativo, espaco.Situacao(false));
    }

    [Fact]
    public void Espaco_locado_nao_pode_ser_inativado()
    {
        var espaco = NovoEspaco();

        var erro = Assert.Throws<RegraNegocioException>(() => espaco.Inativar(true));

        Assert.Contains("Encerre a locação", erro.Message);
        Assert.True(espaco.Ativo);
    }

    [Fact]
    public void Locacao_encerrada_preserva_datas_e_nao_pode_ser_encerrada_novamente()
    {
        var inicio = new DateOnly(2026, 1, 10);
        var termino = new DateOnly(2026, 9, 29);
        var locacao = Locacao.Iniciar(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), inicio);

        locacao.Encerrar(termino);

        Assert.False(locacao.Vigente);
        Assert.Equal(inicio, locacao.Inicio);
        Assert.Equal(termino, locacao.Termino);
        Assert.Throws<RegraNegocioException>(() => locacao.Encerrar(termino));
    }

    [Fact]
    public void Locacao_nao_aceita_termino_anterior_ao_inicio()
    {
        var inicio = new DateOnly(2026, 5, 1);
        var locacao = Locacao.Iniciar(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), inicio);

        Assert.Throws<RegraNegocioException>(() => locacao.Encerrar(inicio.AddDays(-1)));
        Assert.True(locacao.Vigente);
    }

    private static Espaco NovoEspaco() => Espaco.Cadastrar(
        Guid.NewGuid(),
        "S-101",
        "Sala 101",
        "Pavilhão 1, térreo",
        "Sala comercial de teste.");
}