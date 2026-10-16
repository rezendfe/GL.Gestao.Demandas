using System.Net.Http.Headers;
using System.Text;
using Gl.Demandas.Application;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Gl.Demandas.Infrastructure.WhatsApp;

public sealed class EnvioWhatsAppMeta(HttpClient http, IConfiguration configuracao, ILogger<EnvioWhatsAppMeta> logger) : IEnvioWhatsApp
{
    public async Task Enviar(string telefone, string texto, CancellationToken ct)
    {
        var token = configuracao["WhatsApp:AccessToken"]?.Trim();
        var numero = configuracao["WhatsApp:PhoneNumberId"]?.Trim();
        var versao = configuracao["WhatsApp:GraphVersion"]?.Trim();
        if (string.IsNullOrWhiteSpace(versao))
            versao = "v25.0";

        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(numero))
        {
            logger.LogWarning("WhatsApp não enviado: defina WhatsApp:AccessToken e WhatsApp:PhoneNumberId neste ambiente.");
            return;
        }

        var destino = TelefoneWhatsApp.Normalizar(telefone);
        if (destino is null || string.IsNullOrWhiteSpace(texto))
            return;

        using var pedido = new HttpRequestMessage(HttpMethod.Post, $"{versao}/{numero}/messages");
        pedido.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        pedido.Content = new StringContent(CorpoMensagemWhatsApp.Json(destino, texto), Encoding.UTF8, "application/json");

        try
        {
            using var resposta = await http.SendAsync(pedido, ct);
            if (resposta.IsSuccessStatusCode)
                return;

            var corpo = await resposta.Content.ReadAsStringAsync(ct);
            if (corpo.Length > 500)
                corpo = corpo[..500];
            logger.LogWarning(
                "WhatsApp recusou o aviso para o final {Final} com status {Status}. {Corpo}",
                destino[^4..],
                (int)resposta.StatusCode,
                corpo);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Falha ao enviar WhatsApp para o final {Final}.", destino[^4..]);
        }
    }
}
