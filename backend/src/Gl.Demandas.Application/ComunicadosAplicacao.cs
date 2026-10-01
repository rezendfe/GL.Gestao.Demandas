using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class ComunicadosAplicacao(IComunicados comunicados, IUsuarios usuarios, IEnvioPush envioPush, IRelogio relogio)
{
    public async Task<IReadOnlyList<ComunicadoResumoDto>> Listar(Ator ator, CancellationToken ct)
    {
        ExigirLeitura(ator);
        var itens = await comunicados.Listar(ct);
        if (ator.Perfil == Perfil.Cessionario)
            itens = itens.Where(item => item.Vigente).ToArray();
        return itens
            .OrderByDescending(item => item.PublicadoEm)
            .Select(item => new ComunicadoResumoDto(item.Id, item.Titulo, item.Situacao, item.Leitores.Contains(ator.Id), item.PublicadoEm))
            .ToArray();
    }

    public async Task<ComunicadoDetalheDto> Obter(Ator ator, Guid id, CancellationToken ct)
    {
        ExigirLeitura(ator);
        var comunicado = await Exigir(id, ct);
        if (ator.Perfil == Perfil.Cessionario && !comunicado.Vigente)
            throw new AcessoNegadoException("O Cessionário consulta o comunicado vigente.");
        return await Detalhe(comunicado, ator.Id, ct);
    }

    public async Task<ComunicadoDetalheDto> Publicar(Ator ator, PublicarComunicadoComando comando, CancellationToken ct)
    {
        if (ator.Perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException("Quem publica o comunicado é o GL / Administrador.");
        var comunicado = Comunicado.Publicar(Guid.NewGuid(), ator.Id, comando.Titulo, comando.Texto, relogio.UtcNow);
        await comunicados.Adicionar(comunicado, ct);
        if (comando.AvisarCelular)
            await AvisarCelular(comunicado, ct);
        return await Detalhe(comunicado, ator.Id, ct);
    }

    public async Task<ComunicadoDetalheDto> Encerrar(Ator ator, Guid id, CancellationToken ct)
    {
        var comunicado = await Exigir(id, ct);
        comunicado.Encerrar(ator.Perfil, ator.Id, relogio.UtcNow);
        await comunicados.Salvar(comunicado, ct);
        return await Detalhe(comunicado, ator.Id, ct);
    }

    public async Task<ComunicadoDetalheDto> MarcarLido(Ator ator, Guid id, CancellationToken ct)
    {
        var comunicado = await Exigir(id, ct);
        comunicado.MarcarLido(ator.Perfil, ator.Id, relogio.UtcNow);
        await comunicados.Salvar(comunicado, ct);
        return await Detalhe(comunicado, ator.Id, ct);
    }

    private async Task AvisarCelular(Comunicado comunicado, CancellationToken ct)
    {
        var aviso = comunicado.Texto.Length > 180 ? comunicado.Texto[..180] : comunicado.Texto;
        var destino = $"/comunicados/{comunicado.Id}";
        foreach (var pessoa in (await usuarios.Listar(ct)).Where(pessoa => pessoa.Perfil == Perfil.Cessionario && pessoa.Ativo))
        {
            await envioPush.Enviar(
                new NotificacaoPush(pessoa.Id, comunicado.Id, Guid.Empty, comunicado.Titulo, aviso, destino),
                ct);
        }
    }

    private static void ExigirLeitura(Ator ator)
    {
        if (ator.Perfil is not (Perfil.GlAdministrador or Perfil.Cessionario))
            throw new AcessoNegadoException("O comunicado é publicado pelo GL / Administrador e lido pelo Cessionário.");
    }

    private async Task<Comunicado> Exigir(Guid id, CancellationToken ct) =>
        await comunicados.Obter(id, ct) ?? throw new NaoEncontradaException("Comunicado não encontrado.");

    private async Task<ComunicadoDetalheDto> Detalhe(Comunicado comunicado, Guid leitorId, CancellationToken ct)
    {
        var pessoas = (await usuarios.Listar(ct)).ToDictionary(pessoa => pessoa.Id);
        var historico = comunicado.Historico
            .OrderBy(evento => evento.EventoEm)
            .Select(evento => new EventoComunicadoDto(
                evento.Id,
                pessoas.TryGetValue(evento.UsuarioId, out var pessoa) ? pessoa.Nome : "Usuário",
                evento.Tipo,
                evento.Comentario,
                evento.EventoEm))
            .ToArray();
        return new ComunicadoDetalheDto(
            comunicado.Id,
            comunicado.Titulo,
            comunicado.Texto,
            comunicado.Situacao,
            comunicado.Leitores.Contains(leitorId),
            comunicado.PublicadoEm,
            comunicado.EncerradoEm,
            historico);
    }
}
