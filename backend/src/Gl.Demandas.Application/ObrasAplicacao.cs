using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class ObrasAplicacao(IObras obras)
{
    public async Task<IReadOnlyList<ObraDto>> Listar(CancellationToken ct) =>
        (await obras.Listar(ct)).Select(Mapear).ToArray();

    public async Task<ObraDto> Obter(Guid id, CancellationToken ct)
    {
        var obra = await obras.Obter(id, ct) ?? throw new NaoEncontradaException("Obra não encontrada.");
        return Mapear(obra);
    }

    private static ObraDto Mapear(Obra obra) =>
        new(
            obra.Id,
            obra.Nome,
            obra.Local,
            obra.Descricao,
            obra.InicioPrevisto,
            obra.TerminoPrevisto,
            obra.EmpresaExecutora,
            obra.Responsavel,
            obra.Contato,
            obra.EtapaAtual,
            ObraEtapas.Linha,
            obra.Documentos
                .OrderBy(d => d.Ordem)
                .Select(d => new DocumentoObraDto(d.Id, d.Nome, d.Situacao, d.Ordem))
                .ToArray());
}
