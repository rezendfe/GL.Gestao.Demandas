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

public sealed record AvisoDemandaWhatsApp(
    string Protocolo,
    string Servico,
    Guid CessionarioId,
    Guid? EmpresaId,
    Guid? ResponsavelId,
    Guid AreaId);

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
        foreach (var pessoa in demandantes)
        {
            ct.ThrowIfCancellationRequested();
            var texto = TextoWhatsAppDemanda.MontarStatus(demanda.Protocolo, demanda.Servico, status, pessoa.Vinculo);
            await envio.Enviar(pessoa.Telefone, texto, ct);
        }
    }

    private static int Preferencia(VinculoWhatsApp vinculo) => vinculo switch
    {
        VinculoWhatsApp.Abriu => 2,
        VinculoWhatsApp.Acompanha => 1,
        _ => 0
    };
}
