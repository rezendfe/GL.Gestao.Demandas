using System.Text.Json;
using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public enum VinculoWhatsApp
{
    Abriu,
    Acompanha,
    Trabalha
}

public sealed record DestinoWhatsApp(Guid UsuarioId, string Telefone, VinculoWhatsApp Vinculo);

public sealed record MidiaWhatsApp(string Nome, string Tipo, byte[] Conteudo, bool Audio);

public sealed record AvisoDemandaWhatsApp(
    string Protocolo,
    string Servico,
    Guid CessionarioId,
    Guid? EmpresaId,
    Guid? ResponsavelId,
    Guid AreaId,
    string? TextoAlteracao = null,
    string? Link = null,
    IReadOnlyList<MidiaWhatsApp>? Midias = null);

public sealed record EventoEtapaWhatsApp(string Nome, bool Aberta);

public interface IDestinosWhatsApp
{
    Task<IReadOnlyList<DestinoWhatsApp>> DaDemanda(
        Guid cessionarioId,
        Guid? empresaId,
        Guid? responsavelId,
        Guid areaId,
        CancellationToken ct);
}

public interface IEnvioWhatsApp
{
    Task Enviar(string telefone, string texto, CancellationToken ct);
    Task EnviarMidia(string telefone, MidiaWhatsApp midia, CancellationToken ct);
}

public interface IEnderecoPortal
{
    string? BaseUrl { get; }
}

public interface IAvisoWhatsApp
{
    Task Publicar(
        AvisoDemandaWhatsApp demanda,
        SituacaoDemanda? anterior,
        SituacaoDemanda atual,
        IReadOnlyList<EtapaCadeia> etapas,
        bool percorrerAutomaticas,
        CancellationToken ct);
}

public static class TelefoneWhatsApp
{
    public static string? Normalizar(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;

        var digitos = new string(valor.Where(char.IsDigit).ToArray());
        if (digitos.StartsWith("55") && digitos.Length is 12 or 13)
            return digitos;
        if (digitos.Length is 10 or 11)
            return "55" + digitos;
        return null;
    }
}

public static class TextoWhatsAppDemanda
{
    public static string MontarStatus(string protocolo, string servico, string status, VinculoWhatsApp vinculo)
    {
        var relacao = vinculo switch
        {
            VinculoWhatsApp.Abriu => "que você abriu",
            VinculoWhatsApp.Acompanha => "que você está acompanhando",
            VinculoWhatsApp.Trabalha => "que você está trabalhando",
            _ => "em que você participa"
        };
        return $"Chamado {protocolo} ({servico}), {relacao}, está com o status {status}.";
    }

    public static string MontarAviso(string protocolo, string servico, string status, VinculoWhatsApp vinculo, string? alteracao, string? link)
    {
        var texto = MontarStatus(protocolo, servico, status, vinculo);
        if (!string.IsNullOrWhiteSpace(alteracao))
            texto += $"{Environment.NewLine}{Environment.NewLine}{alteracao.Trim()}";
        if (!string.IsNullOrWhiteSpace(link))
            texto += $"{Environment.NewLine}{Environment.NewLine}Abrir o chamado: {link.Trim()}";
        return texto;
    }

    public static string Montar(string protocolo, string servico, string status, EventoEtapaWhatsApp evento, VinculoWhatsApp vinculo)
    {
        var passo = evento.Aberta
            ? $"A etapa {evento.Nome} foi aberta."
            : $"A etapa {evento.Nome} foi concluída.";
        return $"{MontarStatus(protocolo, servico, status, vinculo)} {passo}";
    }
}

public static class CorpoMensagemWhatsApp
{
    public static string Json(string telefone, string texto) =>
        JsonSerializer.Serialize(new
        {
            messaging_product = "whatsapp",
            to = telefone,
            type = "text",
            text = new { body = texto }
        });

    public static string JsonMidia(string telefone, string tipo, string idMidia, string? nomeArquivo)
    {
        if (tipo == "document")
        {
            return JsonSerializer.Serialize(new
            {
                messaging_product = "whatsapp",
                to = telefone,
                type = "document",
                document = new { id = idMidia, filename = NomeArquivo(nomeArquivo) }
            });
        }

        if (tipo == "audio")
        {
            return JsonSerializer.Serialize(new
            {
                messaging_product = "whatsapp",
                to = telefone,
                type = "audio",
                audio = new { id = idMidia }
            });
        }

        return JsonSerializer.Serialize(new
        {
            messaging_product = "whatsapp",
            to = telefone,
            type = "image",
            image = new { id = idMidia }
        });
    }

    public static string TipoDeEnvio(MidiaWhatsApp midia)
    {
        if (!midia.Audio)
            return "image";
        var mime = Mime(midia.Tipo);
        return mime is "audio/mpeg" or "audio/mp4" or "audio/ogg" or "audio/aac" or "audio/amr"
            ? "audio"
            : "document";
    }

    public static string Mime(string? tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo))
            return "application/octet-stream";
        var mime = tipo.Split(';')[0].Trim().ToLowerInvariant();
        return mime.Length == 0 ? "application/octet-stream" : mime;
    }

    private static string NomeArquivo(string? nome)
    {
        var arquivo = string.IsNullOrWhiteSpace(nome) ? "audio" : Path.GetFileName(nome.Trim());
        var limpo = new string(arquivo.Select(caractere => char.IsLetterOrDigit(caractere) || caractere is '.' or '-' or '_' ? caractere : '-').ToArray());
        return string.IsNullOrWhiteSpace(limpo) ? "audio" : limpo;
    }
}

public static class LinkChamado
{
    public const string PortalPadrao = "https://gray-bay-0ad3ef71e.1.azurestaticapps.net";

    public static string Montar(string? baseUrl, Guid demandaId)
    {
        var raiz = string.IsNullOrWhiteSpace(baseUrl) ? PortalPadrao : baseUrl.Trim().TrimEnd('/');
        return $"{raiz}/demandas/{demandaId}";
    }
}

public static class ComplementoWhatsApp
{
    public static string? Texto(string? comentario)
    {
        if (string.IsNullOrWhiteSpace(comentario))
            return null;
        var texto = comentario.Trim();
        if (texto is "Chamado aberto." or "Chamado encerrado." or "Aprovada.")
            return null;
        if (texto.StartsWith("Avançou para ", StringComparison.Ordinal) && texto.EndsWith('.'))
            return null;
        if (texto.EndsWith(" automática.", StringComparison.Ordinal))
            return null;

        foreach (var prefixo in new[] { "Aprovada. ", "Ajuste solicitado. ", "Reprovada. " })
        {
            if (texto.StartsWith(prefixo, StringComparison.Ordinal))
            {
                var resto = texto[prefixo.Length..].Trim();
                return resto.Length == 0 ? null : resto;
            }
        }

        return texto;
    }

    public static string? ComentarioDaMudanca(IEnumerable<HistoricoDemanda> historico)
    {
        var evento = Mudanca(historico);
        return evento is null ? null : Texto(evento.Comentario);
    }

    public static IReadOnlyList<Anexo> AnexosDaMudanca(IEnumerable<HistoricoDemanda> historico, IEnumerable<Anexo> anexos)
    {
        var evento = Mudanca(historico);
        if (evento is null)
            return [];

        var inicio = evento.EventoEm.AddMinutes(-2);
        var fim = evento.EventoEm.AddSeconds(30);
        var fotos = anexos
            .Where(anexo => anexo.EnviadoEm >= inicio && anexo.EnviadoEm <= fim && EhImagem(anexo))
            .OrderBy(anexo => anexo.EnviadoEm)
            .Take(8);
        var audios = anexos
            .Where(anexo => anexo.EnviadoEm >= inicio && anexo.EnviadoEm <= fim && EhAudio(anexo))
            .OrderBy(anexo => anexo.EnviadoEm)
            .Take(3);
        return fotos.Concat(audios).ToArray();
    }

    public static async Task<IReadOnlyList<MidiaWhatsApp>> Carregar(
        IEnumerable<HistoricoDemanda> historico,
        IEnumerable<Anexo> anexos,
        IAnexoStorage armazenamento,
        CancellationToken ct)
    {
        var midias = new List<MidiaWhatsApp>();
        foreach (var anexo in AnexosDaMudanca(historico, anexos))
        {
            ct.ThrowIfCancellationRequested();
            var stream = await armazenamento.Abrir(anexo.Caminho, ct);
            if (stream is null)
                continue;
            await using (stream)
            {
                using var memoria = new MemoryStream();
                await stream.CopyToAsync(memoria, ct);
                if (memoria.Length == 0)
                    continue;
                midias.Add(new MidiaWhatsApp(anexo.Nome, anexo.Tipo, memoria.ToArray(), EhAudio(anexo)));
            }
        }

        return midias;
    }

    public static bool EhImagem(Anexo anexo)
    {
        if (anexo.Tipo.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return true;
        var nome = anexo.Nome.ToLowerInvariant();
        return nome.EndsWith(".jpg") || nome.EndsWith(".jpeg") || nome.EndsWith(".png") || nome.EndsWith(".webp") || nome.EndsWith(".gif");
    }

    public static bool EhAudio(Anexo anexo)
    {
        if (EhImagem(anexo))
            return false;
        if (anexo.Tipo.StartsWith("audio/", StringComparison.OrdinalIgnoreCase))
            return true;
        var nome = anexo.Nome.ToLowerInvariant();
        return nome.EndsWith(".mp3") || nome.EndsWith(".wav") || nome.EndsWith(".m4a") || nome.EndsWith(".ogg") || nome.EndsWith(".webm");
    }

    private static HistoricoDemanda? Mudanca(IEnumerable<HistoricoDemanda> historico) =>
        historico
            .Where(item => !string.Equals(item.StatusAnterior, item.StatusNovo, StringComparison.Ordinal))
            .OrderByDescending(item => item.EventoEm)
            .FirstOrDefault();
}

public static class MudancaDeEtapa
{
    public static IReadOnlyList<EventoEtapaWhatsApp> Listar(
        SituacaoDemanda? anterior,
        SituacaoDemanda atual,
        IReadOnlyList<EtapaCadeia> cadeia,
        bool percorrerAutomaticas)
    {
        var destino = cadeia.FirstOrDefault(etapa => etapa.Codigo == CadeiaAtendimento.Coluna(atual));
        if (destino is null)
            return [];

        if (anterior is null)
            return Abertura(destino);

        if (anterior == atual)
            return [];

        var origem = cadeia.FirstOrDefault(etapa => etapa.Codigo == CadeiaAtendimento.Coluna(anterior.Value));
        if (origem is null || origem.Codigo == destino.Codigo)
            return [];

        var eventos = new List<EventoEtapaWhatsApp>();
        if (destino.Ordem > origem.Ordem)
        {
            if (origem.EnviarAoConcluir)
                eventos.Add(new EventoEtapaWhatsApp(origem.Nome, false));

            if (percorrerAutomaticas)
            {
                foreach (var etapa in cadeia.Where(etapa => etapa.Automatica && etapa.Ordem > origem.Ordem && etapa.Ordem < destino.Ordem).OrderBy(etapa => etapa.Ordem))
                {
                    if (etapa.EnviarAoAbrir)
                        eventos.Add(new EventoEtapaWhatsApp(etapa.Nome, true));
                    if (etapa.EnviarAoConcluir)
                        eventos.Add(new EventoEtapaWhatsApp(etapa.Nome, false));
                }
            }
        }

        if (destino.EnviarAoAbrir)
            eventos.Add(new EventoEtapaWhatsApp(destino.Nome, true));
        if (destino.Ordem > origem.Ordem && destino.Codigo == CadeiaAtendimento.Conclusao && destino.EnviarAoConcluir)
            eventos.Add(new EventoEtapaWhatsApp(destino.Nome, false));

        return eventos;
    }

    private static IReadOnlyList<EventoEtapaWhatsApp> Abertura(EtapaCadeia destino)
    {
        if (!destino.EnviarAoAbrir)
            return [];
        return [new EventoEtapaWhatsApp(destino.Nome, true)];
    }
}

public sealed class AvisoWhatsAppEtapa(IDestinosWhatsApp destinos, IEnvioWhatsApp envio) : IAvisoWhatsApp
{
    public async Task Publicar(
        AvisoDemandaWhatsApp demanda,
        SituacaoDemanda? anterior,
        SituacaoDemanda atual,
        IReadOnlyList<EtapaCadeia> etapas,
        bool percorrerAutomaticas,
        CancellationToken ct)
    {
        if (anterior == atual)
            return;

        _ = etapas;
        _ = percorrerAutomaticas;

        var pessoas = await destinos.DaDemanda(demanda.CessionarioId, demanda.EmpresaId, demanda.ResponsavelId, demanda.AreaId, ct);
        var demandantes = pessoas
            .Where(pessoa => pessoa.Vinculo is VinculoWhatsApp.Abriu or VinculoWhatsApp.Acompanha)
            .GroupBy(pessoa => pessoa.Telefone)
            .Select(grupo => grupo.OrderByDescending(pessoa => Preferencia(pessoa.Vinculo)).First())
            .ToList();
        if (demandantes.Count == 0)
            return;

        var status = atual.ParaTexto();
        var midias = demanda.Midias ?? [];
        foreach (var pessoa in demandantes)
        {
            ct.ThrowIfCancellationRequested();
            var texto = TextoWhatsAppDemanda.MontarAviso(demanda.Protocolo, demanda.Servico, status, pessoa.Vinculo, demanda.TextoAlteracao, demanda.Link);
            await envio.Enviar(pessoa.Telefone, texto, ct);
            foreach (var midia in midias)
            {
                ct.ThrowIfCancellationRequested();
                await envio.EnviarMidia(pessoa.Telefone, midia, ct);
            }
        }
    }

    private static int Preferencia(VinculoWhatsApp vinculo) => vinculo switch
    {
        VinculoWhatsApp.Abriu => 2,
        VinculoWhatsApp.Acompanha => 1,
        _ => 0
    };
}
