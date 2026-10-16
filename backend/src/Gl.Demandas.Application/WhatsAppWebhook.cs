using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Gl.Demandas.Application;

public sealed record EventoWhatsAppRecebido(
    string Tipo,
    string? IdMensagem,
    string? Telefone,
    string? Nome,
    string? Texto,
    string? Status,
    string? PhoneNumberId,
    DateTime? EventoEm,
    string Payload);

public interface IEventosWhatsApp
{
    Task Guardar(IReadOnlyList<EventoWhatsAppRecebido> eventos, CancellationToken ct);
}

public static class AssinaturaWhatsApp
{
    public static bool Confere(string? cabecalho, string corpo, string segredo)
    {
        const string prefixo = "sha256=";
        if (string.IsNullOrWhiteSpace(cabecalho) || !cabecalho.StartsWith(prefixo, StringComparison.OrdinalIgnoreCase))
            return false;

        var informado = cabecalho[prefixo.Length..].Trim().ToLowerInvariant();
        var calculado = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(segredo), Encoding.UTF8.GetBytes(corpo))).ToLowerInvariant();
        if (informado.Length != calculado.Length)
            return false;

        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(calculado), Encoding.UTF8.GetBytes(informado));
    }
}

public static class LeituraWebhookWhatsApp
{
    public static string? Desafio(string? modo, string? token, string? desafio, string? esperado) =>
        string.Equals(modo, "subscribe", StringComparison.Ordinal)
        && !string.IsNullOrEmpty(esperado)
        && string.Equals(token, esperado, StringComparison.Ordinal)
        && !string.IsNullOrEmpty(desafio)
            ? desafio
            : null;

    public static IReadOnlyList<EventoWhatsAppRecebido> Ler(string corpo)
    {
        if (string.IsNullOrWhiteSpace(corpo))
            return [];

        using var documento = JsonDocument.Parse(corpo);
        if (!documento.RootElement.TryGetProperty("entry", out var entradas) || entradas.ValueKind != JsonValueKind.Array)
            return [];

        var eventos = new List<EventoWhatsAppRecebido>();
        foreach (var entrada in entradas.EnumerateArray())
        {
            if (!entrada.TryGetProperty("changes", out var mudancas) || mudancas.ValueKind != JsonValueKind.Array)
                continue;

            foreach (var mudanca in mudancas.EnumerateArray())
            {
                if (!mudanca.TryGetProperty("value", out var valor))
                    continue;

                var numero = Texto(valor, "metadata", "phone_number_id");
                var nomes = Nomes(valor);
                if (valor.TryGetProperty("messages", out var mensagens) && mensagens.ValueKind == JsonValueKind.Array)
                {
                    foreach (var mensagem in mensagens.EnumerateArray())
                    {
                        var telefone = TextoDireto(mensagem, "from");
                        eventos.Add(new EventoWhatsAppRecebido(
                            "mensagem",
                            TextoDireto(mensagem, "id"),
                            telefone,
                            telefone is not null && nomes.TryGetValue(telefone, out var nome) ? nome : null,
                            TextoDaMensagem(mensagem),
                            null,
                            numero,
                            Quando(TextoDireto(mensagem, "timestamp")),
                            Cortar(mensagem.GetRawText())));
                    }
                }

                if (valor.TryGetProperty("statuses", out var situacoes) && situacoes.ValueKind == JsonValueKind.Array)
                {
                    foreach (var situacao in situacoes.EnumerateArray())
                    {
                        eventos.Add(new EventoWhatsAppRecebido(
                            "status",
                            TextoDireto(situacao, "id"),
                            TextoDireto(situacao, "recipient_id"),
                            null,
                            null,
                            TextoDireto(situacao, "status"),
                            numero,
                            Quando(TextoDireto(situacao, "timestamp")),
                            Cortar(situacao.GetRawText())));
                    }
                }
            }
        }

        return eventos;
    }

    private static Dictionary<string, string> Nomes(JsonElement valor)
    {
        var nomes = new Dictionary<string, string>();
        if (!valor.TryGetProperty("contacts", out var contatos) || contatos.ValueKind != JsonValueKind.Array)
            return nomes;

        foreach (var contato in contatos.EnumerateArray())
        {
            var id = TextoDireto(contato, "wa_id");
            var nome = Texto(contato, "profile", "name");
            if (id is not null && nome is not null)
                nomes[id] = nome;
        }

        return nomes;
    }

    private static string? TextoDaMensagem(JsonElement mensagem)
    {
        var texto = Texto(mensagem, "text", "body")
            ?? Texto(mensagem, "image", "caption")
            ?? Texto(mensagem, "video", "caption")
            ?? Texto(mensagem, "document", "caption")
            ?? Texto(mensagem, "button", "text")
            ?? Texto(mensagem, "interactive", "button_reply", "title")
            ?? Texto(mensagem, "interactive", "list_reply", "title")
            ?? Texto(mensagem, "reaction", "emoji");
        if (texto is not null)
            return texto;

        var tipo = TextoDireto(mensagem, "type");
        return tipo is null ? null : $"[{tipo}]";
    }

    private static string? Texto(JsonElement elemento, params string[] caminho)
    {
        foreach (var passo in caminho)
        {
            if (!elemento.TryGetProperty(passo, out elemento))
                return null;
        }

        return elemento.ValueKind == JsonValueKind.String ? elemento.GetString() : null;
    }

    private static string? TextoDireto(JsonElement elemento, string nome) =>
        elemento.TryGetProperty(nome, out var valor) && valor.ValueKind == JsonValueKind.String ? valor.GetString() : null;

    private static DateTime? Quando(string? unix)
    {
        if (!long.TryParse(unix, out var segundos))
            return null;
        return DateTimeOffset.FromUnixTimeSeconds(segundos).UtcDateTime;
    }

    private static string Cortar(string texto) => texto.Length <= 16000 ? texto : texto[..16000];
}

public sealed class WebhookWhatsAppAplicacao(IEventosWhatsApp eventos)
{
    public async Task Receber(string corpo, CancellationToken ct)
    {
        var lidos = LeituraWebhookWhatsApp.Ler(corpo);
        if (lidos.Count == 0)
            return;
        await eventos.Guardar(lidos, ct);
    }
}
