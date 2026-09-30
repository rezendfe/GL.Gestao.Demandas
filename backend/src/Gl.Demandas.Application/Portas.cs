using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed record Ator(
    Guid Id,
    Perfil Perfil,
    Guid? AreaId,
    Guid? EmpresaId = null,
    IReadOnlySet<PermissaoCessionario>? Permissoes = null);

public interface IRelogio
{
    DateTime UtcNow { get; }
}

public interface ITokenEmissor
{
    string Emitir(Usuario usuario);
}

public interface IClassificadorDemanda
{
    Task<SugestaoClassificacao?> Sugerir(string texto, CancellationToken ct);
}

public interface IExtratorSolicitacao
{
    Task<LeituraSolicitacao?> Extrair(string texto, DateOnly hoje, CancellationToken ct);
}

public interface IAnexoStorage
{
    Task<string> Salvar(Guid demandaId, string nomeArquivo, Stream conteudo, CancellationToken ct);
    Task<Stream?> Abrir(string caminho, CancellationToken ct);
}

public interface IUsuarios
{
    Task<Usuario?> ObterPorEmail(string email, CancellationToken ct);
    Task<Usuario?> ObterPorIdentidadeEstavel(string identidade, CancellationToken ct);
    Task<Usuario?> Obter(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Usuario>> Listar(CancellationToken ct);
    Task VincularIdentidadeEstavel(Guid usuarioId, string identidade, CancellationToken ct);
    Task SalvarResponsavel(Guid? id, string nome, string email, Guid areaId, bool ativo, string? senhaHashNovo, CancellationToken ct);
    Task<IReadOnlySet<PermissaoCessionario>> PermissoesCessionario(Guid usuarioId, CancellationToken ct);
}

public interface ICatalogo
{
    Task<IReadOnlyList<RegraClassificacao>> ListarRegras(CancellationToken ct);
    Task<Subcategoria?> ObterSubcategoria(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Subcategoria>> ListarSubcategorias(CancellationToken ct);
    Task<IReadOnlyList<Categoria>> ListarCategorias(CancellationToken ct);
    Task<IReadOnlyList<Area>> ListarAreas(CancellationToken ct);
    Task<Area> SalvarArea(Guid? id, string nome, bool ativa, CancellationToken ct);
    Task<Categoria> SalvarCategoria(Guid? id, string nome, bool ativa, int? prazoHoras, CancellationToken ct);
    Task<Subcategoria> SalvarSubcategoria(Guid? id, Guid categoriaId, Guid areaId, string nome, FluxoDemanda fluxo, bool ativa, CancellationToken ct);
}

public interface IDemandas
{
    Task<Demanda?> Obter(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Demanda>> Listar(CancellationToken ct);
    Task<IReadOnlyList<string>> ListarProtocolos(CancellationToken ct);
    Task Adicionar(Demanda demanda, CancellationToken ct);
    Task Salvar(Demanda demanda, CancellationToken ct);
}

public interface IObras
{
    Task<IReadOnlyList<Obra>> Listar(CancellationToken ct);
    Task<Obra?> Obter(Guid id, CancellationToken ct);
}

public interface ICadeia
{
    Task<IReadOnlyList<CadeiaDoTipo>> Listar(CancellationToken ct);
    Task<IReadOnlyList<EtapaCadeia>> Obter(Guid subcategoriaId, CancellationToken ct);
    Task Salvar(Guid subcategoriaId, IReadOnlyList<EtapaCadeia> etapas, CancellationToken ct);
}

public interface INotificacoes
{
    Task Adicionar(Notificacao notificacao, CancellationToken ct);
    Task<IReadOnlyList<Notificacao>> ListarDoUsuario(Guid usuarioId, CancellationToken ct);
    Task<Notificacao?> Obter(Guid id, CancellationToken ct);
    Task Salvar(Notificacao notificacao, CancellationToken ct);
}

public sealed record EmpresaOpcao(Guid Id, string Nome, bool Ativa);

public sealed record LocacaoResumo(Guid Id, Guid EmpresaId, string Empresa, DateOnly Inicio, DateOnly? Termino);

public sealed record EspacoConsulta(
    Espaco Espaco,
    SituacaoEspaco Situacao,
    EmpresaOpcao? EmpresaLocataria,
    IReadOnlyList<LocacaoResumo> Historico);

public interface IInventarioEspacos
{
    Task<IReadOnlyList<EspacoConsulta>> ListarEspacos(CancellationToken ct);
    Task<EspacoConsulta?> ObterEspaco(Guid id, CancellationToken ct);
    Task<IReadOnlyList<EmpresaOpcao>> ListarEmpresas(CancellationToken ct);
    Task<bool> EmpresaAtiva(Guid id, CancellationToken ct);
    Task<bool> CodigoEmUso(string codigo, Guid? excetoId, CancellationToken ct);
    Task<bool> PossuiLocacaoVigente(Guid espacoId, CancellationToken ct);
    Task SalvarEspaco(Espaco espaco, CancellationToken ct);
    Task IniciarLocacao(Locacao locacao, CancellationToken ct);
    Task EncerrarLocacao(Guid espacoId, DateOnly termino, CancellationToken ct);
}

public sealed record ContatoCadastro(Guid Id, string Canal, string Valor, bool Principal);

public sealed record FuncaoCadastro(Guid Id, string Nome, bool Ativa, IReadOnlyList<PermissaoCessionario> Permissoes);

public sealed record RepresentanteCadastro(
    Guid UsuarioId,
    string Nome,
    string Email,
    bool Ativo,
    IReadOnlyList<ContatoCadastro> Contatos,
    IReadOnlyList<FuncaoCadastro> Funcoes);

public sealed record EmpresaCadastro(
    Guid Id,
    string Nome,
    bool Ativa,
    string? Logo,
    IReadOnlyList<RepresentanteCadastro> Representantes,
    IReadOnlyList<FuncaoCadastro> Funcoes);

public interface IGestaoCessionarios
{
    Task<IReadOnlyList<EmpresaCadastro>> ListarEmpresasAdministracao(CancellationToken ct);
    Task<EmpresaCadastro> SalvarEmpresa(Guid? id, string nome, bool ativa, string? logo, CancellationToken ct);
    Task<RepresentanteCadastro> SalvarRepresentante(Guid empresaId, Guid? usuarioId, string nome, string email, bool ativo, IReadOnlyList<ContatoCadastro> contatos, IReadOnlyList<Guid> funcoes, CancellationToken ct);
    Task<FuncaoCadastro> SalvarFuncao(Guid empresaId, Guid? id, string nome, bool ativa, IReadOnlyList<PermissaoCessionario> permissoes, CancellationToken ct);
}
