using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure.Persistence;

namespace Gl.Demandas.Application.Tests;

public sealed class ComunicadoTests
{
    [Fact]
    public void Publicar_encerra_e_registra_leitura_uma_vez()
    {
        var agora = new DateTime(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc);
        var gl = Guid.NewGuid();
        var joao = Guid.NewGuid();
        var comunicado = Comunicado.Publicar(Guid.NewGuid(), gl, "Aviso de manutenção", "O foyer fica interditado amanhã.", agora);

        Assert.Equal("Vigente", comunicado.Situacao);
        Assert.Contains(comunicado.Historico, evento => evento.Tipo == "PUBLICACAO");

        comunicado.MarcarLido(Perfil.Cessionario, joao, agora.AddMinutes(5));
        comunicado.MarcarLido(Perfil.Cessionario, joao, agora.AddMinutes(6));
        Assert.Single(comunicado.Historico, evento => evento.Tipo == "LEITURA");

        Assert.Throws<AcessoNegadoException>(() => comunicado.Encerrar(Perfil.Cessionario, joao, agora));
        Assert.Throws<AcessoNegadoException>(() => comunicado.Encerrar(Perfil.ResponsavelArea, Guid.NewGuid(), agora));
        comunicado.Encerrar(Perfil.GlAdministrador, gl, agora.AddHours(1));
        Assert.Equal("Encerrado", comunicado.Situacao);
        Assert.Contains(comunicado.Historico, evento => evento.Tipo == "ENCERRAMENTO");
        Assert.Throws<RegraNegocioException>(() => comunicado.MarcarLido(Perfil.Cessionario, joao, agora.AddHours(2)));
    }

    [Fact]
    public async Task Cessionario_le_vigente_e_outro_perfil_nao_publica()
    {
        using var banco = new BancoDeTeste();
        DemoSeed.Aplicar(banco.Contexto, new DateTime(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc));
        var repo = new GlRepositorio(banco.Contexto);
        var push = new PushCaptura();
        var app = new ComunicadosAplicacao(repo, repo, push, new RelogioFixo(new DateTime(2026, 10, 1, 15, 0, 0, DateTimeKind.Utc)));
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var joao = new Ator(DemoIds.Joao, Perfil.Cessionario, null, DemoIds.EmpresaExemplo);
        var recepcao = new Ator(DemoIds.Resp02, Perfil.ResponsavelArea, DemoIds.AreaRecepcao);

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            app.Publicar(joao, new PublicarComunicadoComando("Título", "Texto do aviso.", false), CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            app.Publicar(recepcao, new PublicarComunicadoComando("Título", "Texto do aviso.", false), CancellationToken.None));

        var publicado = await app.Publicar(gl, new PublicarComunicadoComando("Interdição do foyer", "O acesso fica fechado das 8h às 12h.", true), CancellationToken.None);
        Assert.Equal("Vigente", publicado.Situacao);
        Assert.Contains(publicado.Historico, evento => evento.Tipo == "PUBLICACAO");
        Assert.All(push.Destinos, destino =>
        {
            Assert.StartsWith("/comunicados/", destino);
            Assert.DoesNotContain("demandas", destino);
            Assert.DoesNotContain("responder", destino);
        });
        Assert.NotEmpty(push.Destinos);

        var fila = await app.Listar(joao, CancellationToken.None);
        Assert.Contains(fila, item => item.Id == publicado.Id && !item.Lido);
        await Assert.ThrowsAsync<AcessoNegadoException>(() => app.Listar(recepcao, CancellationToken.None));

        var lido = await app.MarcarLido(joao, publicado.Id, CancellationToken.None);
        Assert.True(lido.Lido);
        Assert.Contains(lido.Historico, evento => evento.Tipo == "LEITURA");
        Assert.DoesNotContain(lido.Historico, evento => evento.Tipo == "MENSAGEM");

        var encerrado = await app.Encerrar(gl, publicado.Id, CancellationToken.None);
        Assert.Equal("Encerrado", encerrado.Situacao);
        Assert.Contains(encerrado.Historico, evento => evento.Tipo == "ENCERRAMENTO");
        var depois = await app.Listar(joao, CancellationToken.None);
        Assert.DoesNotContain(depois, item => item.Id == publicado.Id);
        await Assert.ThrowsAsync<AcessoNegadoException>(() => app.Encerrar(recepcao, publicado.Id, CancellationToken.None));
    }

    private sealed class RelogioFixo(DateTime agora) : IRelogio
    {
        public DateTime UtcNow => agora;
    }

    private sealed class PushCaptura : IEnvioPush
    {
        public List<string> Destinos { get; } = [];

        public Task Enviar(NotificacaoPush pedido, CancellationToken ct)
        {
            Destinos.Add(pedido.Url ?? "");
            return Task.CompletedTask;
        }
    }
}
