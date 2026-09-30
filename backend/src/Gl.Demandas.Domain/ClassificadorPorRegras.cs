namespace Gl.Demandas.Domain;

public sealed record SugestaoClassificacao(
    Guid CategoriaId,
    string Categoria,
    Guid SubcategoriaId,
    string Subcategoria,
    Guid AreaId,
    string Servico,
    string Destino,
    string Confianca,
    string Prioridade,
    int OrdemPrioridade,
    FluxoDemanda Fluxo,
    string Resumo);

public static class ClassificadorPorRegras
{
    public static SugestaoClassificacao? Sugerir(
        string texto,
        IReadOnlyList<RegraClassificacao> regras,
        IReadOnlyDictionary<Guid, Subcategoria> subcategorias,
        IReadOnlyDictionary<Guid, Categoria> categorias)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return null;

        var normalizado = Texto.Normalizar(texto);
        foreach (var regra in regras.OrderBy(r => r.Ordem))
        {
            if (!normalizado.Contains(Texto.Normalizar(regra.Termo), StringComparison.Ordinal))
                continue;

            var sub = subcategorias[regra.SubcategoriaId];
            var categoria = categorias[sub.CategoriaId];
            return new SugestaoClassificacao(
                categoria.Id,
                categoria.Nome,
                sub.Id,
                sub.Nome,
                sub.AreaId,
                regra.Servico,
                regra.Destino,
                regra.Confianca,
                regra.Prioridade,
                regra.OrdemPrioridade,
                sub.Fluxo,
                regra.Resumo);
        }

        return null;
    }
}
