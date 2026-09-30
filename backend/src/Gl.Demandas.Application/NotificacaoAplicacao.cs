using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class NotificacaoAplicacao(INotificacoes notificacoes, IDemandas demandas)
{
    public async Task<IReadOnlyList<NotificacaoDto>> Listar(Ator ator, CancellationToken ct)
    {
        var itens = await notificacoes.ListarDoUsuario(ator.Id, ct);
        var protocolos = (await demandas.Listar(ct)).ToDictionary(d => d.Id, d => d.Protocolo);
        return itens
            .OrderByDescending(n => n.CriadaEm)
            .Select(n => new NotificacaoDto(
                n.Id,
                n.DemandaId,
                protocolos.GetValueOrDefault(n.DemandaId, ""),
                n.Texto,
                n.Lida,
                n.CriadaEm))
            .ToArray();
    }

    public async Task MarcarLida(Ator ator, Guid id, CancellationToken ct)
    {
        var notificacao = await notificacoes.Obter(id, ct) ?? throw new NaoEncontradaException("Notificação não encontrada.");
        notificacao.MarcarLida(ator.Id);
        await notificacoes.Salvar(notificacao, ct);
    }
}
