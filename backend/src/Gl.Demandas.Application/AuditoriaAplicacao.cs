using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class AuditoriaAplicacao(IAuditoria auditoria, IUsuarios usuarios, IRelogio relogio)
{
    public async Task<IReadOnlyList<EventoAuditoriaDto>> DoDia(Ator ator, CancellationToken ct)
    {
        var hoje = CalendarioSolicitacao.HojeEmSaoPaulo(relogio.UtcNow);
        var linhas = await auditoria.Listar(new FiltroAuditoria(ator.Id, InicioUtc(hoje), InicioUtc(hoje.AddDays(1)), null), ct);
        return linhas.Select(ParaDto).ToArray();
    }

    public async Task<IReadOnlyList<PessoaAuditoriaDto>> Pessoas(Ator ator, CancellationToken ct)
    {
        ExigirGl(ator);
        var lista = await usuarios.Listar(ct);
        return lista
            .OrderBy(pessoa => pessoa.Nome, StringComparer.CurrentCultureIgnoreCase)
            .Select(pessoa => new PessoaAuditoriaDto(pessoa.Id, pessoa.Nome, PerfilTexto.ParaExibicao(pessoa.Perfil)))
            .ToArray();
    }

    public async Task<IReadOnlyList<EventoAuditoriaDto>> Pesquisar(
        Ator ator,
        DateOnly de,
        DateOnly ate,
        Guid? autorId,
        string? texto,
        CancellationToken ct)
    {
        ExigirGl(ator);
        ExigirPeriodo(de, ate);

        var filtroTexto = string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
        if (filtroTexto is { Length: > 80 })
            throw new RegraNegocioException("O texto da pesquisa tem no máximo 80 caracteres.");

        var linhas = await auditoria.Listar(new FiltroAuditoria(autorId, InicioUtc(de), InicioUtc(ate.AddDays(1)), filtroTexto), ct);
        return linhas.Select(ParaDto).ToArray();
    }

    public async Task<ArquivoExportado> ExportarBase(Ator ator, CancellationToken ct)
    {
        ExigirGl(ator);
        var linhas = await auditoria.Listar(new FiltroAuditoria(null, null, null, null), ct);
        var ordenadas = linhas.OrderBy(linha => linha.EventoEm).ToArray();
        return new ArquivoExportado(
            "auditoria.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            PlanilhaAuditoria.Gerar(ordenadas));
    }

    private static void ExigirPeriodo(DateOnly de, DateOnly ate)
    {
        if (ate < de)
            throw new RegraNegocioException("A data final precisa ser igual ou posterior à data inicial.");
        if (de.AddMonths(3) < ate)
            throw new RegraNegocioException("A pesquisa cobre no máximo 3 meses entre a data de início e a de fim.");
    }

    private static void ExigirGl(Ator ator)
    {
        if (ator.Perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException("A pesquisa e a exportação da auditoria são do GL / Administrador.");
    }

    private static DateTime InicioUtc(DateOnly dia)
    {
        var zona = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        var local = DateTime.SpecifyKind(dia.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(local, zona);
    }

    private static EventoAuditoriaDto ParaDto(LinhaAuditoria linha) =>
        new(
            linha.Id,
            linha.Origem,
            linha.AlvoId,
            linha.Referencia,
            linha.AutorId,
            linha.Autor,
            linha.Perfil,
            linha.Tipo,
            linha.Comentario,
            linha.StatusAnterior,
            linha.StatusNovo,
            linha.EventoEm);
}
