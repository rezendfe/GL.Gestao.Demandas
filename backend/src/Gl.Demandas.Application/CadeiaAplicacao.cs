using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class CadeiaAplicacao(ICadeia cadeia, ICatalogo catalogo)
{
    public async Task<IReadOnlyList<CadeiaTipoDto>> Listar(CancellationToken ct)
    {
        var categorias = (await catalogo.ListarCategorias(ct)).ToDictionary(item => item.Id);
        var salvas = (await cadeia.Listar(ct)).ToDictionary(item => item.SubcategoriaId);
        return (await catalogo.ListarSubcategorias(ct))
            .OrderBy(sub => categorias[sub.CategoriaId].Nome, StringComparer.Create(new System.Globalization.CultureInfo("pt-BR"), true))
            .ThenBy(sub => sub.Nome, StringComparer.Create(new System.Globalization.CultureInfo("pt-BR"), true))
            .Select(sub =>
            {
                var etapas = salvas.TryGetValue(sub.Id, out var salva) ? salva.Etapas : CadeiaAtendimento.Padrao();
                return new CadeiaTipoDto(sub.Id, categorias[sub.CategoriaId].Nome, sub.Nome, etapas.Select(Mapear).ToArray());
            })
            .ToArray();
    }

    public async Task<IReadOnlyList<EtapaCadeiaDto>> Salvar(Ator ator, Guid subcategoriaId, IReadOnlyList<EtapaCadeiaDto> etapas, CancellationToken ct)
    {
        if (ator.Perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException("A cadeia do quadro é configurada pelo GL / Administrador.");

        if (await catalogo.ObterSubcategoria(subcategoriaId, ct) is null)
            throw new RegraNegocioException("Selecione o tipo de atendimento.");

        var normalizada = CadeiaAtendimento.Configurar(etapas
            .Select(etapa => new EtapaCadeia(
                etapa.Codigo,
                etapa.Nome,
                etapa.Ordem,
                etapa.Automatica,
                etapa.Tarefas.Count > 0 ? etapa.Tarefas.Select(tarefa => tarefa.Codigo).ToArray() : etapa.Campos,
                etapa.Tarefas.Select(tarefa => new TarefaCadeia(tarefa.Codigo, tarefa.Obrigatoria)).ToArray()))
            .ToArray());
        await cadeia.Salvar(subcategoriaId, normalizada, ct);
        return normalizada.Select(Mapear).ToArray();
    }

    private static EtapaCadeiaDto Mapear(EtapaCadeia etapa) =>
        new(
            etapa.Codigo,
            etapa.Nome,
            etapa.Ordem,
            etapa.Automatica,
            etapa.Campos,
            etapa.Tarefas.Select(tarefa => new TarefaCadeiaDto(tarefa.Codigo, tarefa.Obrigatoria)).ToArray());
}
