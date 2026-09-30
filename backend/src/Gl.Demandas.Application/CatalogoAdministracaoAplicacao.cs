using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class CatalogoAdministracaoAplicacao(ICatalogo catalogo, IUsuarios usuarios)
{
    public async Task SalvarArea(Ator ator, Guid? id, string nome, bool ativa, CancellationToken ct)
    {
        ExigirGl(ator);
        var nomeNormalizado = NormalizarNome(nome, "?rea");
        var areas = await catalogo.ListarAreas(ct);
        if (areas.Any(a => a.Id != id && string.Equals(a.Nome, nomeNormalizado, StringComparison.OrdinalIgnoreCase)))
            throw new RegraNegocioException("J? existe uma ?rea com este nome.");
        if (!ativa && (await catalogo.ListarSubcategorias(ct)).Any(s => s.AreaId == id && s.Ativa))
            throw new RegraNegocioException("Desative os tipos de atendimento desta ?rea antes de desativ?-la.");
        await catalogo.SalvarArea(id, nomeNormalizado, ativa, ct);
    }

    public async Task SalvarResponsavel(Ator ator, Guid? id, string nome, string email, Guid areaId, bool ativo, CancellationToken ct)
    {
        ExigirGl(ator);
        var nomeNormalizado = nome.Trim();
        if (nomeNormalizado.Length is < 2 or > 200)
            throw new RegraNegocioException("O nome do respons?vel deve ter entre 2 e 200 caracteres.");
        var emailNormalizado = email.Trim().ToLowerInvariant();
        if (emailNormalizado.Length is < 6 or > 320 || !emailNormalizado.Contains('@') || emailNormalizado.Contains(' '))
            throw new RegraNegocioException("Informe um e-mail v?lido.");
        var areas = await catalogo.ListarAreas(ct);
        var area = areas.FirstOrDefault(a => a.Id == areaId)
            ?? throw new RegraNegocioException("Selecione uma ?rea respons?vel v?lida.");
        if (ativo && !area.Ativa)
            throw new RegraNegocioException("Selecione uma ?rea ativa.");
        var pessoas = await usuarios.Listar(ct);
        if (pessoas.Any(p => p.Id != id && string.Equals(p.Email, emailNormalizado, StringComparison.OrdinalIgnoreCase)))
            throw new RegraNegocioException("J? existe um usu?rio com este e-mail.");
        if (id.HasValue && !pessoas.Any(p => p.Id == id && p.Perfil == Perfil.ResponsavelArea))
            throw new RegraNegocioException("Este cadastro n?o ? de um Respons?vel da ÿÿrea.");
        await usuarios.SalvarResponsavel(
            id,
            nomeNormalizado,
            emailNormalizado,
            areaId,
            ativo,
            id.HasValue ? null : SenhaDemo.Hash("Demo@2026"),
            ct);
    }

    public async Task SalvarCategoria(Ator ator, Guid? id, string nome, bool ativa, int? prazoHoras, CancellationToken ct)
    {
        ExigirGl(ator);
        if (prazoHoras is < 1 or > 8760)
            throw new RegraNegocioException("A meta de prazo fica entre 1 e 8760 horas, ou em branco.");
        var nomeNormalizado = NormalizarNome(nome, "categoria");
        var categorias = await catalogo.ListarCategorias(ct);
        if (categorias.Any(c => c.Id != id && string.Equals(c.Nome, nomeNormalizado, StringComparison.OrdinalIgnoreCase)))
            throw new RegraNegocioException("J? existe uma categoria com este nome.");
        if (!ativa && (await catalogo.ListarSubcategorias(ct)).Any(s => s.CategoriaId == id && s.Ativa))
            throw new RegraNegocioException("Desative os tipos de atendimento desta categoria antes de desativ?-la.");
        await catalogo.SalvarCategoria(id, nomeNormalizado, ativa, prazoHoras, ct);
    }

    public async Task SalvarTipo(Ator ator, Guid? id, Guid categoriaId, Guid areaId, string nome, string fluxo, bool ativo, CancellationToken ct)
    {
        ExigirGl(ator);
        var nomeNormalizado = NormalizarNome(nome, "tipo de atendimento");
        FluxoDemanda fluxoNormalizado;
        try
        {
            fluxoNormalizado = FluxoDemandaTexto.ParaFluxo(fluxo);
        }
        catch (ArgumentOutOfRangeException)
        {
            throw new RegraNegocioException("Selecione um fluxo v?lido.");
        }

        var categorias = await catalogo.ListarCategorias(ct);
        if (!categorias.Any(c => c.Id == categoriaId && c.Ativa))
            throw new RegraNegocioException("Selecione uma categoria ativa.");
        var areas = await catalogo.ListarAreas(ct);
        var area = areas.FirstOrDefault(a => a.Id == areaId)
            ?? throw new RegraNegocioException("Selecione uma ?rea respons?vel v?lida.");
        if (ativo && !area.Ativa)
            throw new RegraNegocioException("Selecione uma ?rea ativa.");
        if ((await catalogo.ListarSubcategorias(ct)).Any(s => s.Id != id && s.CategoriaId == categoriaId && string.Equals(s.Nome, nomeNormalizado, StringComparison.OrdinalIgnoreCase)))
            throw new RegraNegocioException("J? existe esse tipo de atendimento na categoria.");
        await catalogo.SalvarSubcategoria(id, categoriaId, areaId, nomeNormalizado, fluxoNormalizado, ativo, ct);
    }

    private static string NormalizarNome(string nome, string entidade)
    {
        var valor = nome.Trim();
        if (valor.Length is < 2 or > 120)
            throw new RegraNegocioException($"O nome da {entidade} deve ter entre 2 e 120 caracteres.");
        return valor;
    }

    private static void ExigirGl(Ator ator)
    {
        if (ator.Perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException();
    }
}