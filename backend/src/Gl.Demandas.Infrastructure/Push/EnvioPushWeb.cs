using System.Net;
using System.Text.Json;
using Gl.Demandas.Application;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WebPush;

namespace Gl.Demandas.Infrastructure.Push;

public sealed class ConfiguracaoPush(IConfiguration configuracao) : IConfiguracaoPush
{
    public string? ChavePublica
    {
        get
        {
            var chave = configuracao["Push:PublicKey"];
            return string.IsNullOrWhiteSpace(chave) ? null : chave.Trim();
        }
    }
}

public sealed class EnvioPushWeb(IConfiguration configuracao, IInscricoesPush inscricoes, ILogger<EnvioPushWeb> logger) : IEnvioPush
{
    public async Task Enviar(NotificacaoPush pedido, CancellationToken ct)
    {
        var publica = configuracao["Push:PublicKey"];
        var privada = configuracao["Push:PrivateKey"];
        var assunto = configuracao["Push:Subject"];
        if (string.IsNullOrWhiteSpace(publica) || string.IsNullOrWhiteSpace(privada) || string.IsNullOrWhiteSpace(assunto))
        {
            logger.LogWarning("O alerta não foi enviado: faltam as chaves de push neste ambiente.");
            return;
        }

        var aparelhos = await inscricoes.ListarPorUsuario(pedido.UsuarioId, ct);
        if (aparelhos.Count == 0)
            return;

        var payload = JsonSerializer.Serialize(new
        {
            title = string.IsNullOrWhiteSpace(pedido.Protocolo) ? "Chamado GL" : pedido.Protocolo,
            body = pedido.Texto,
            tag = pedido.NotificacaoId.ToString(),
            url = string.IsNullOrWhiteSpace(pedido.Url)
                ? $"/demandas/{pedido.DemandaId}?aba=comunicacao"
                : pedido.Url
        });
        var vapid = new VapidDetails(assunto.Trim(), publica.Trim(), privada.Trim());
        var cliente = new WebPushClient();

        foreach (var aparelho in aparelhos)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                await cliente.SendNotificationAsync(
                    new PushSubscription(aparelho.Endpoint, aparelho.ChaveP256dh, aparelho.SegredoAuth),
                    payload,
                    vapid);
            }
            catch (WebPushException ex) when (ex.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                await inscricoes.Remover(aparelho.Endpoint, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Falha ao enviar a notificação {NotificacaoId} para o celular.", pedido.NotificacaoId);
            }
        }
    }
}
