using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class NotificacaoAplicacao(
    INotificacoes notificacoes,
    IDemandas demandas,
    IInscricoesPush inscricoes,
    IConfiguracaoPush configuracao,
    IRelogio relogio)
{
    public ChavePushDto ExigirChavePublica()
    {
        var chave = configuracao.ChavePublica;
        if (string.IsNullOrWhiteSpace(chave))
            throw new RegraNegocioException("As notificações neste aparelho ainda não estão disponíveis.");
        return new ChavePushDto(chave);
    }

    public async Task Inscrever(Ator ator, InscricaoPushComando comando, CancellationToken ct)
    {
        var inscricao = InscricaoPush.Criar(ator.Id, comando.Endpoint, comando.ChaveP256dh, comando.SegredoAuth, relogio.UtcNow);
        var atual = await inscricoes.ObterPorEndpoint(inscricao.Endpoint, ct);
        if (atual is not null && atual.UsuarioId != ator.Id)
            throw new AcessoNegadoException("Este aparelho já está autorizado para outro usuário.");
        await inscricoes.Salvar(inscricao, ct);
    }

    public async Task Cancelar(Ator ator, string endpoint, CancellationToken ct)
    {
        var atual = await inscricoes.ObterPorEndpoint(endpoint, ct);
        if (atual is null)
            return;
        if (atual.UsuarioId != ator.Id)
            throw new AcessoNegadoException("Este aparelho está autorizado para outro usuário.");
        await inscricoes.Remover(atual.Endpoint, ct);
    }

    public async Task<IReadOnlyList<NotificacaoDto>> Listar(Ator ator, CancellationToken ct)
    {
        var itens = await notificacoes.ListarDoUsuario(ator.Id, ct);
        var porDemanda = (await demandas.Listar(ct)).ToDictionary(d => d.Id);
        return itens
            .OrderByDescending(n => n.CriadaEm)
            .Select(n =>
            {
                porDemanda.TryGetValue(n.DemandaId, out var demanda);
                return new NotificacaoDto(
                    n.Id,
                    n.DemandaId,
                    demanda?.Protocolo ?? "",
                    n.Texto,
                    n.Lida,
                    n.CriadaEm,
                    n.MensagemId ?? MensagemDoAviso.Resolver(n, demanda));
            })
            .ToArray();
    }

    public async Task MarcarLida(Ator ator, Guid id, CancellationToken ct)
    {
        var notificacao = await notificacoes.Obter(id, ct) ?? throw new NaoEncontradaException("Notificação não encontrada.");
        notificacao.MarcarLida(ator.Id);
        await notificacoes.Salvar(notificacao, ct);
    }
}
