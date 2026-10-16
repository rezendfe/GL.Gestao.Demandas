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
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(numero))
        {
            logger.LogWarning("WhatsApp não enviado: defina WhatsApp:AccessToken e WhatsApp:PhoneNumberId neste ambiente.");
            return;
        }

        var destino = TelefoneWhatsApp.Normalizar(telefone);
        if (destino is null || string.IsNullOrWhiteSpace(texto))
            return;

        await Postar(destino, token, CorpoMensagemWhatsApp.Json(destino, texto), ct);
    }

    public async Task EnviarMidia(string telefone, MidiaWhatsApp midia, CancellationToken ct)
    {
        if (midia.Conteudo.Length == 0)
            return;

        var token = configuracao["WhatsApp:AccessToken"]?.Trim();
        var numero = configuracao["WhatsApp:PhoneNumberId"]?.Trim();
        var versao = configuracao["WhatsApp:GraphVersion"]?.Trim();
        if (string.IsNullOrWhiteSpace(versao))
            versao = "v25.0";
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(numero))
            return;

        var destino = TelefoneWhatsApp.Normalizar(telefone);
        if (destino is null)
            return;

        var id = await Subir(versao, numero, token, midia, destino, ct);
        if (id is null)
            return;

        var tipo = CorpoMensagemWhatsApp.TipoDeEnvio(midia);
        await Postar(destino, token, CorpoMensagemWhatsApp.JsonMidia(destino, tipo, id, midia.Nome), ct);
    }

    private async Task<string?> Subir(string versao, string numero, string token, MidiaWhatsApp midia, string destino, CancellationToken ct)
    {
        using var pedido = new HttpRequestMessage(HttpMethod.Post, $"{versao}/{numero}/media");
        pedido.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var form = new MultipartFormDataContent();
        form.Add(new StringContent("whatsapp"), "messaging_product");
        var arquivo = new ByteArrayContent(midia.Conteudo);
        arquivo.Headers.ContentType = new MediaTypeHeaderValue(CorpoMensagemWhatsApp.Mime(midia.Tipo));
        var nome = string.IsNullOrWhiteSpace(midia.Nome) ? "anexo" : Path.GetFileName(midia.Nome);
        form.Add(arquivo, "file", nome);
        pedido.Content = form;

        try
        {
            using var resposta = await http.SendAsync(pedido, ct);
            var corpo = await resposta.Content.ReadAsStringAsync(ct);
            if (!resposta.IsSuccessStatusCode)
            {
                AvisarRecusa(destino, resposta.StatusCode, corpo);
                return null;
            }

            using var json = System.Text.Json.JsonDocument.Parse(corpo);
            if (json.RootElement.TryGetProperty("id", out var id) && id.GetString() is string valor && valor.Length > 0)
                return valor;
            return null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Falha ao enviar mídia de WhatsApp para o final {Final}.", destino[^4..]);
            return null;
        }
    }

    private async Task Postar(string destino, string token, string json, CancellationToken ct)
    {
        var numero = configuracao["WhatsApp:PhoneNumberId"]?.Trim();
        var versao = configuracao["WhatsApp:GraphVersion"]?.Trim();
        if (string.IsNullOrWhiteSpace(versao))
            versao = "v25.0";

        using var pedido = new HttpRequestMessage(HttpMethod.Post, $"{versao}/{numero}/messages");
        pedido.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        pedido.Content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            using var resposta = await http.SendAsync(pedido, ct);
            if (resposta.IsSuccessStatusCode)
                return;

            var corpo = await resposta.Content.ReadAsStringAsync(ct);
            AvisarRecusa(destino, resposta.StatusCode, corpo);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Falha ao enviar WhatsApp para o final {Final}.", destino[^4..]);
        }
    }

    private void AvisarRecusa(string destino, System.Net.HttpStatusCode status, string corpo)
    {
        if (corpo.Length > 500)
            corpo = corpo[..500];
        logger.LogWarning(
            "WhatsApp recusou o aviso para o final {Final} com status {Status}. {Corpo}",
            destino[^4..],
            (int)status,
            corpo);
    }
}
