using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure.Persistence;

namespace Gl.Demandas.Application.Tests;

public sealed class InscricaoPushTests
{
    [Fact]
    public void Inscricao_rejeita_endereco_inseguro()
    {
        Assert.Throws<RegraNegocioException>(() =>
            InscricaoPush.Criar(Guid.NewGuid(), "http://inseguro", "chave", "segredo", DateTime.UtcNow));
    }
}

public sealed class PushCelularTests : IDisposable
{
    private readonly BancoDeTeste _banco = new();

    [Fact]
    public async Task Autorizacao_do_celular_fica_no_usuario()
    {
        var repo = new GlRepositorio(_banco.Contexto);
        var relogio = new RelogioFixo(new DateTime(2026, 9, 30, 12, 0, 0, DateTimeKind.Utc));
        var app = new NotificacaoAplicacao(repo, repo, repo, new ConfiguracaoPushMemoria("chave-publica"), relogio);
        var ator = new Ator(DemoIds.Joao, Perfil.Cessionario, null, DemoIds.EmpresaExemplo);

        Assert.Equal("chave-publica", app.ExigirChavePublica().ChavePublica);

        await app.Inscrever(
            ator,
            new InscricaoPushComando("https://push.exemplo/celular", "chave-p256", "segredo"),
            CancellationToken.None);

        var lista = await repo.ListarPorUsuario(DemoIds.Joao, CancellationToken.None);
        Assert.Single(lista);
        Assert.Equal("https://push.exemplo/celular", lista[0].Endpoint);

        await app.Inscrever(
            ator,
            new InscricaoPushComando("https://push.exemplo/celular", "chave-nova", "segredo-novo"),
            CancellationToken.None);
        lista = await repo.ListarPorUsuario(DemoIds.Joao, CancellationToken.None);
        Assert.Single(lista);
        Assert.Equal("chave-nova", lista[0].ChaveP256dh);

        await app.Cancelar(ator, "https://push.exemplo/celular", CancellationToken.None);
        Assert.Empty(await repo.ListarPorUsuario(DemoIds.Joao, CancellationToken.None));
    }

    public void Dispose() => _banco.Dispose();

    private sealed class RelogioFixo(DateTime agora) : IRelogio
    {
        public DateTime UtcNow => agora;
    }
}

internal sealed class ConfiguracaoPushMemoria(string? chave) : IConfiguracaoPush
{
    public string? ChavePublica => chave;
}
