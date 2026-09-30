using Gl.Demandas.Application;
using Gl.Demandas.Domain;

namespace Gl.Demandas.Infrastructure;

public sealed class ClassificadorDemanda(ICatalogo catalogo) : IClassificadorDemanda
{
    public async Task<SugestaoClassificacao?> Sugerir(string texto, CancellationToken ct)
    {
        var regras = await catalogo.ListarRegras(ct);
        var categorias = (await catalogo.ListarCategorias(ct)).Where(c => c.Ativa).ToDictionary(c => c.Id);
        var subcategorias = (await catalogo.ListarSubcategorias(ct))
            .Where(s => s.Ativa && categorias.ContainsKey(s.CategoriaId))
            .ToDictionary(s => s.Id);
        return ClassificadorPorRegras.Sugerir(texto, regras, subcategorias, categorias);
    }
}
