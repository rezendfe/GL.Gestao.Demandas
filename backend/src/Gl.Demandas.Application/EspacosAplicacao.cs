using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed record EspacoDto(
    Guid Id,
    string Codigo,
    string Nome,
    string Localizacao,
    string Descricao,
    string Situacao,
    EmpresaOpcao? EmpresaLocataria,
    IReadOnlyList<LocacaoResumo> Historico);

public sealed record EspacoComando(Guid? Id, string Codigo, string Nome, string Localizacao, string Descricao, bool Ativo);

public sealed record IniciarLocacaoComando(Guid EspacoId, Guid EmpresaId, DateOnly Inicio);

public sealed class EspacosAplicacao(IInventarioEspacos inventario)
{
    public async Task<IReadOnlyList<EspacoDto>> Listar(Ator ator, CancellationToken ct)
    {
        ExigirGl(ator);
        var espacos = await inventario.ListarEspacos(ct);
        return espacos.Select(Mapear).ToArray();
    }

    public async Task<IReadOnlyList<EmpresaOpcao>> ListarEmpresas(Ator ator, CancellationToken ct)
    {
        ExigirGl(ator);
        return await inventario.ListarEmpresas(ct);
    }

    public async Task<EspacoDto> Salvar(Ator ator, EspacoComando comando, CancellationToken ct)
    {
        ExigirGl(ator);
        if (await inventario.CodigoEmUso(comando.Codigo.Trim(), comando.Id, ct))
            throw new RegraNegocioException("Já existe um espaço com esse código.");

        var espaco = comando.Id is Guid id
            ? (await inventario.ObterEspaco(id, ct))?.Espaco
                ?? throw new NaoEncontradaException("Espaço não encontrado.")
            : Espaco.Cadastrar(Guid.NewGuid(), comando.Codigo, comando.Nome, comando.Localizacao, comando.Descricao);

        if (comando.Id.HasValue)
            espaco.Atualizar(comando.Codigo, comando.Nome, comando.Localizacao, comando.Descricao);

        if (comando.Ativo)
            espaco.Ativar();
        else
            espaco.Inativar(await inventario.PossuiLocacaoVigente(espaco.Id, ct));

        await inventario.SalvarEspaco(espaco, ct);
        return Mapear((await inventario.ObterEspaco(espaco.Id, ct))!);
    }

    public async Task<EspacoDto> IniciarLocacao(Ator ator, IniciarLocacaoComando comando, CancellationToken ct)
    {
        ExigirGl(ator);
        var espaco = await inventario.ObterEspaco(comando.EspacoId, ct)
            ?? throw new NaoEncontradaException("Espaço não encontrado.");
        if (espaco.Situacao == SituacaoEspaco.Inativo)
            throw new RegraNegocioException("Espaço Inativo não aceita nova locação.");
        if (espaco.Situacao == SituacaoEspaco.Locado)
            throw new RegraNegocioException("O espaço já possui uma locação vigente.");
        if (!await inventario.EmpresaAtiva(comando.EmpresaId, ct))
            throw new RegraNegocioException("Selecione uma empresa Cessionária ativa.");

        var locacao = Locacao.Iniciar(Guid.NewGuid(), comando.EspacoId, comando.EmpresaId, comando.Inicio);
        await inventario.IniciarLocacao(locacao, ct);
        return Mapear((await inventario.ObterEspaco(comando.EspacoId, ct))!);
    }

    public async Task<EspacoDto> EncerrarLocacao(Ator ator, Guid espacoId, DateOnly termino, CancellationToken ct)
    {
        ExigirGl(ator);
        if (!await inventario.PossuiLocacaoVigente(espacoId, ct))
            throw new NaoEncontradaException("Locação vigente não encontrada.");
        await inventario.EncerrarLocacao(espacoId, termino, ct);
        return Mapear((await inventario.ObterEspaco(espacoId, ct))!);
    }

    private static EspacoDto Mapear(EspacoConsulta consulta) => new(
        consulta.Espaco.Id,
        consulta.Espaco.Codigo,
        consulta.Espaco.Nome,
        consulta.Espaco.Localizacao,
        consulta.Espaco.Descricao,
        consulta.Situacao switch
        {
            SituacaoEspaco.Disponivel => "Disponível",
            SituacaoEspaco.Locado => "Locado",
            SituacaoEspaco.Inativo => "Inativo",
            _ => throw new ArgumentOutOfRangeException(nameof(consulta))
        },
        consulta.EmpresaLocataria,
        consulta.Historico);

    private static void ExigirGl(Ator ator)
    {
        if (ator.Perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException();
    }
}