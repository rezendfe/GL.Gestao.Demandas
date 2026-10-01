using System.Globalization;
using System.Text.RegularExpressions;
using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class AgendaAplicacao(IDemandas demandas, IObras obras)
{
    private static readonly Regex DataDesejada = new(
        @"Data desejada:\s*(\d{2})/(\d{2})/(\d{4})",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public async Task<IReadOnlyList<ItemAgendaDto>> Listar(Ator ator, CancellationToken ct)
    {
        if (ator.Perfil == Perfil.Cessionario)
            throw new AcessoNegadoException("O Cessionário acompanha a previsão no próprio resumo.");

        var itens = new List<ItemAgendaDto>();
        foreach (var demanda in await demandas.Listar(ct))
        {
            if (!Visivel(demanda, ator)) continue;
            if (demanda.PrevisaoAtendimento is DateTime previsao)
                itens.Add(new ItemAgendaDto("demanda", demanda.Id, demanda.Protocolo, demanda.Situacao.ParaTexto(), "previsao", DateOnly.FromDateTime(previsao)));
            if (LerDataDesejada(demanda) is DateOnly desejada)
                itens.Add(new ItemAgendaDto("demanda", demanda.Id, demanda.Protocolo, demanda.Situacao.ParaTexto(), "data-desejada", desejada));
        }

        if (ator.Perfil == Perfil.GlAdministrador)
        {
            foreach (var obra in await obras.Listar(ct))
            {
                itens.Add(new ItemAgendaDto("obra", obra.Id, obra.Nome, obra.EtapaAtual, "inicio", obra.InicioPrevisto));
                itens.Add(new ItemAgendaDto("obra", obra.Id, obra.Nome, obra.EtapaAtual, "termino", obra.TerminoPrevisto));
            }
        }

        return itens
            .OrderBy(item => item.Data)
            .ThenBy(item => item.Titulo, StringComparer.Ordinal)
            .ThenBy(item => item.Marco, StringComparer.Ordinal)
            .ToArray();
    }

    private static bool Visivel(Demanda demanda, Ator ator) => ator.Perfil switch
    {
        Perfil.GlAdministrador => true,
        Perfil.ResponsavelArea => demanda.AreaId == ator.AreaId,
        _ => false
    };

    private static DateOnly? LerDataDesejada(Demanda demanda)
    {
        var textos = new[] { demanda.Descricao }.Concat(demanda.Mensagens.OrderBy(m => m.EnviadaEm).Select(m => m.Texto));
        foreach (var texto in textos)
        {
            var achado = DataDesejada.Match(texto ?? "");
            if (!achado.Success) continue;
            var iso = $"{achado.Groups[3].Value}-{achado.Groups[2].Value}-{achado.Groups[1].Value}";
            if (DateOnly.TryParseExact(iso, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var data))
                return data;
        }

        return null;
    }
}
