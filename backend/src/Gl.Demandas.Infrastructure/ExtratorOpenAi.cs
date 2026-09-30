using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Gl.Demandas.Infrastructure;

public sealed class ExtratorOpenAi(HttpClient http, IConfiguration configuracao, ILogger<ExtratorOpenAi> log) : IExtratorSolicitacao
{
    private const string ModeloPadrao = "gpt-4o";

    public async Task<LeituraSolicitacao?> Extrair(string texto, DateOnly hoje, CancellationToken ct)
    {
        var (chave, origemChave) = ResolverChave(configuracao);
        if (string.IsNullOrWhiteSpace(chave))
        {
            log.LogInformation("Preenchimento sem modelo: OPENAI_API_KEY não configurada.");
            return null;
        }

        log.LogInformation("Preenchimento consultando o modelo com chave de {Origem}.", origemChave);

        var modelo = configuracao["OpenAI:Model"];
        if (string.IsNullOrWhiteSpace(modelo))
            modelo = ModeloPadrao;

        try
        {
            var (ok, corpo) = await Enviar(chave, modelo, texto, hoje, ct);
            if (!ok && !string.Equals(modelo, ModeloPadrao, StringComparison.Ordinal) && corpo.Contains("does not have access to model", StringComparison.Ordinal))
                (ok, corpo) = await Enviar(chave, ModeloPadrao, texto, hoje, ct);
            if (!ok)
                return null;

            var json = ExtrairTexto(corpo);
            if (string.IsNullOrWhiteSpace(json))
                return null;

            var lida = JsonSerializer.Deserialize<RespostaModelo>(json, JsonSerializerOptions.Web);
            if (lida is null)
                return null;

            return NormalizadorSolicitacao.Aplicar(
                lida.Assunto,
                lida.Sala,
                lida.Ponto,
                lida.DataDesejada,
                lida.Periodo,
                lida.Telefone,
                lida.Itens,
                lida.AutorizaAcesso,
                lida.Subcategoria,
                hoje);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Preenchimento por modelo indisponível.");
            return null;
        }
    }

    internal static (string? Chave, string Origem) ResolverChave(IConfiguration configuracao)
    {
        var configurada = configuracao["OpenAI:ApiKey"];
        if (!string.IsNullOrWhiteSpace(configurada))
            return (configurada.Trim(), "configuracao");

        if (!string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("OPENAI_API_KEY")))
            return (Environment.GetEnvironmentVariable("OPENAI_API_KEY")!.Trim(), "variavel");

        var arquivo = PrimeiroPreenchido(configuracao["OpenAI:EnvFile"], Environment.GetEnvironmentVariable("OPENAI_ENV_FILE"));
        var lida = string.IsNullOrWhiteSpace(arquivo) ? null : LerChave(arquivo);
        return (lida, "arquivo");
    }

    internal static string? LerChave(string caminho)
    {
        if (!File.Exists(caminho))
            return null;

        foreach (var linha in File.ReadLines(caminho))
        {
            var texto = linha.Trim();
            if (texto.Length == 0 || texto.StartsWith('#'))
                continue;
            const string prefixo = "OPENAI_API_KEY=";
            if (!texto.StartsWith(prefixo, StringComparison.Ordinal))
                continue;
            var valor = texto[prefixo.Length..].Trim().Trim('"').Trim('\'');
            return string.IsNullOrWhiteSpace(valor) ? null : valor;
        }

        return null;
    }

    private async Task<(bool Ok, string Corpo)> Enviar(string chave, string modelo, string texto, DateOnly hoje, CancellationToken ct)
    {
        using var pedido = new HttpRequestMessage(HttpMethod.Post, "responses");
        pedido.Headers.Authorization = new AuthenticationHeaderValue("Bearer", chave);
        pedido.Content = new StringContent(Corpo(modelo, texto, hoje), Encoding.UTF8, "application/json");
        using var resposta = await http.SendAsync(pedido, ct);
        var corpo = await resposta.Content.ReadAsStringAsync(ct);
        if (resposta.IsSuccessStatusCode)
            return (true, corpo);

        log.LogWarning("Preenchimento por modelo {Modelo} recusado com status {Status}: {Motivo}.", modelo, (int)resposta.StatusCode, Motivo(corpo));
        return (false, corpo);
    }

    private static string Motivo(string corpo)
    {
        try
        {
            using var documento = JsonDocument.Parse(corpo);
            if (documento.RootElement.TryGetProperty("error", out var erro)
                && erro.TryGetProperty("message", out var mensagem))
            {
                var texto = mensagem.GetString() ?? "";
                return texto.Length <= 240 ? texto : texto[..240];
            }
        }
        catch (JsonException)
        {
            return "resposta sem detalhe";
        }

        return "resposta sem detalhe";
    }

    private static string? PrimeiroPreenchido(params string?[] valores) =>
        valores.FirstOrDefault(valor => !string.IsNullOrWhiteSpace(valor))?.Trim();

    internal static string Corpo(string modelo, string texto, DateOnly hoje)
    {
        var pedido = new JsonObjectPedido(
            modelo,
            700,
            [
                new MensagemPedido("system", Instrucoes(hoje)),
                new MensagemPedido("user", texto)
            ],
            new TextPedido(new FormatoPedido(new EsquemaPedido())));
        return JsonSerializer.Serialize(pedido, JsonSerializerOptions.Web);
    }

    private static string Instrucoes(DateOnly hoje) =>
        $"""
        Você extrai campos de uma solicitação predial ditada em português do Brasil.
        A data de referência (hoje) é {hoje:yyyy-MM-dd}.
        Preencha um campo somente se a fala o mencionar. Caso contrário use null, e itens como lista vazia.
        assunto: título curto, no máximo 80 caracteres, sem telefone.
        sala: "Sala" seguida do número, quando houver número de sala, loja ou unidade.
        ponto: referência dentro do local, sem data e sem telefone.
        dataDesejada: yyyy-MM-dd. "amanhã" é o dia seguinte à data de referência. Se o ano ditado for implausível para uma visita (por exemplo 2006 quando hoje é {hoje.Year}), use o ano da data de referência.
        periodo: exatamente Manhã, Tarde, Noite ou Qualquer horário, ou null.
        telefone: dígitos com DDD, ou null.
        itens: problemas citados, nomes curtos. Prefira Infiltração, Elétrica, Ar-condicionado, Vaga, Correspondência ou Liberação de área quando couber.
        autorizaAcesso: true somente se a fala autorizar a entrada da equipe; senão null.
        subcategoria: a principal entre Refrigeração, Elétrica, Civil ou Obras; null se não der para escolher.
        Não invente dados.
        """;

    private static string? ExtrairTexto(string corpo)
    {
        using var documento = JsonDocument.Parse(corpo);
        var raiz = documento.RootElement;
        if (raiz.TryGetProperty("output_text", out var direto))
        {
            var texto = direto.GetString();
            if (!string.IsNullOrWhiteSpace(texto))
                return Limpar(texto);
        }

        if (!raiz.TryGetProperty("output", out var saida) || saida.ValueKind != JsonValueKind.Array)
            return null;

        foreach (var item in saida.EnumerateArray())
        {
            if (!item.TryGetProperty("content", out var conteudo) || conteudo.ValueKind != JsonValueKind.Array)
                continue;
            foreach (var bloco in conteudo.EnumerateArray())
            {
                if (!bloco.TryGetProperty("text", out var texto))
                    continue;
                if (texto.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(texto.GetString()))
                    return Limpar(texto.GetString()!);
                if (texto.ValueKind == JsonValueKind.Object
                    && texto.TryGetProperty("value", out var valor)
                    && valor.ValueKind == JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(valor.GetString()))
                    return Limpar(valor.GetString()!);
            }
        }

        return null;
    }

    private static string Limpar(string texto)
    {
        var normalizado = texto.Trim();
        if (normalizado.StartsWith("```", StringComparison.Ordinal))
        {
            var quebra = normalizado.IndexOf('\n');
            if (quebra >= 0)
                normalizado = normalizado[(quebra + 1)..];
            if (normalizado.EndsWith("```", StringComparison.Ordinal))
                normalizado = normalizado[..^3];
        }

        var inicio = normalizado.IndexOf('{');
        var fim = normalizado.LastIndexOf('}');
        if (inicio >= 0 && fim > inicio)
            normalizado = normalizado[inicio..(fim + 1)];
        return normalizado.Trim();
    }

    private sealed record RespostaModelo(
        string? Assunto,
        string? Sala,
        string? Ponto,
        [property: JsonPropertyName("dataDesejada")] string? DataDesejada,
        string? Periodo,
        string? Telefone,
        List<string>? Itens,
        [property: JsonPropertyName("autorizaAcesso")] bool? AutorizaAcesso,
        string? Subcategoria);

    private sealed record JsonObjectPedido(
        string Model,
        [property: JsonPropertyName("max_output_tokens")] int MaxOutputTokens,
        IReadOnlyList<MensagemPedido> Input,
        TextPedido Text);

    private sealed record MensagemPedido(string Role, string Content);

    private sealed record TextPedido(FormatoPedido Format);

    private sealed record FormatoPedido(EsquemaPedido Schema)
    {
        public string Type { get; } = "json_schema";
        public string Name { get; } = "preenchimento_solicitacao";
        public bool Strict { get; } = true;
    }

    private sealed record EsquemaPedido
    {
        public string Type { get; } = "object";
        public bool AdditionalProperties { get; } = false;
        public string[] Required { get; } =
        [
            "assunto", "sala", "ponto", "dataDesejada", "periodo", "telefone", "itens", "autorizaAcesso", "subcategoria"
        ];
        public Dictionary<string, object> Properties { get; } = new()
        {
            ["assunto"] = Nulo("string"),
            ["sala"] = Nulo("string"),
            ["ponto"] = Nulo("string"),
            ["dataDesejada"] = Nulo("string"),
            ["periodo"] = Nulo("string"),
            ["telefone"] = Nulo("string"),
            ["itens"] = new Dictionary<string, object> { ["type"] = "array", ["items"] = new Dictionary<string, string> { ["type"] = "string" } },
            ["autorizaAcesso"] = Nulo("boolean"),
            ["subcategoria"] = Nulo("string")
        };

        private static Dictionary<string, object> Nulo(string tipo) => new()
        {
            ["anyOf"] = new object[] { new Dictionary<string, string> { ["type"] = tipo }, new Dictionary<string, string> { ["type"] = "null" } }
        };
    }
}
