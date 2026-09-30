using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class CatalogoAplicacao(ICatalogo catalogo, IUsuarios usuarios)
{
    public async Task<CatalogoDto> Obter(CancellationToken ct)
    {
        var categorias = await catalogo.ListarCategorias(ct);
        var subcategorias = await catalogo.ListarSubcategorias(ct);
        var areas = await catalogo.ListarAreas(ct);
        var pessoas = await usuarios.Listar(ct);

        return new CatalogoDto(
            categorias
                .OrderBy(c => c.Nome)
                .Select(c => new CategoriaDto(
                    c.Id,
                    c.Nome,
                    c.Ativa,
                    subcategorias
                        .Where(s => s.CategoriaId == c.Id)
                        .OrderBy(s => s.Nome)
                        .Select(s => new SubcategoriaDto(s.Id, s.Nome, s.AreaId, s.Fluxo.ParaTexto(), s.Ativa))
                        .ToArray()))
                .ToArray(),
            areas.OrderBy(a => a.Nome).Select(a => new AreaDto(a.Id, a.Nome, a.Ativa)).ToArray(),
            pessoas
                .Where(p => p.Perfil == Perfil.ResponsavelArea)
                .OrderBy(p => p.Nome)
                .Select(p => new ResponsavelDto(p.Id, p.Nome, p.Email, p.AreaId, p.Ativo))
                .ToArray());
    }
}
