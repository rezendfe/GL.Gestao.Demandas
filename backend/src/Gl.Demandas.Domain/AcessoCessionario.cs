namespace Gl.Demandas.Domain;

public enum PermissaoCessionario
{
    ConsultarEmpresa,
    AbrirDemanda,
    ResponderComplementar,
    AnexarDocumento,
    ValidarServico,
    AvaliarAtendimento
}

public enum CanalContato
{
    Email,
    Telefone,
    WhatsApp
}

public static class PermissaoCessionarioTexto
{
    public static string ParaCodigo(PermissaoCessionario permissao) => permissao switch
    {
        PermissaoCessionario.ConsultarEmpresa => "CONSULTAR_EMPRESA",
        PermissaoCessionario.AbrirDemanda => "ABRIR_DEMANDA",
        PermissaoCessionario.ResponderComplementar => "RESPONDER_COMPLEMENTAR",
        PermissaoCessionario.AnexarDocumento => "ANEXAR_DOCUMENTO",
        PermissaoCessionario.ValidarServico => "VALIDAR_SERVICO",
        PermissaoCessionario.AvaliarAtendimento => "AVALIAR_ATENDIMENTO",
        _ => throw new ArgumentOutOfRangeException(nameof(permissao))
    };

    public static PermissaoCessionario ParaPermissao(string codigo) => codigo switch
    {
        "CONSULTAR_EMPRESA" => PermissaoCessionario.ConsultarEmpresa,
        "ABRIR_DEMANDA" => PermissaoCessionario.AbrirDemanda,
        "RESPONDER_COMPLEMENTAR" => PermissaoCessionario.ResponderComplementar,
        "ANEXAR_DOCUMENTO" => PermissaoCessionario.AnexarDocumento,
        "VALIDAR_SERVICO" => PermissaoCessionario.ValidarServico,
        "AVALIAR_ATENDIMENTO" => PermissaoCessionario.AvaliarAtendimento,
        _ => throw new ArgumentOutOfRangeException(nameof(codigo), codigo, "Permissão desconhecida.")
    };
}

public sealed class FuncaoCessionario
{
    public FuncaoCessionario(Guid id, Guid empresaId, string nome, bool ativa, IReadOnlySet<PermissaoCessionario> permissoes)
    {
        if (id == Guid.Empty || empresaId == Guid.Empty)
            throw new RegraNegocioException("Identificadores da função e da empresa são obrigatórios.");
        var nomeNormalizado = nome.Trim();
        if (nomeNormalizado.Length is < 2 or > 100)
            throw new RegraNegocioException("O nome da função deve ter entre 2 e 100 caracteres.");

        Id = id;
        EmpresaId = empresaId;
        Nome = nomeNormalizado;
        Ativa = ativa;
        Permissoes = new HashSet<PermissaoCessionario>(permissoes);
    }

    public Guid Id { get; }
    public Guid EmpresaId { get; }
    public string Nome { get; }
    public bool Ativa { get; }
    public IReadOnlySet<PermissaoCessionario> Permissoes { get; }
}

public sealed class ContatoCessionario
{
    public ContatoCessionario(Guid id, CanalContato canal, string valor, bool principal)
    {
        if (id == Guid.Empty)
            throw new RegraNegocioException("Identificador do contato inválido.");
        var valorNormalizado = valor.Trim();
        if (valorNormalizado.Length is < 3 or > 320)
            throw new RegraNegocioException("Informe um contato válido.");

        Id = id;
        Canal = canal;
        Valor = valorNormalizado;
        Principal = principal;
    }

    public Guid Id { get; }
    public CanalContato Canal { get; }
    public string Valor { get; }
    public bool Principal { get; private set; }

    internal void DefinirPrincipal(bool principal) => Principal = principal;
}

public sealed class RepresentanteCessionario
{
    private readonly List<ContatoCessionario> _contatos = [];
    private readonly List<FuncaoCessionario> _funcoes = [];

    public RepresentanteCessionario(
        Guid id,
        Guid empresaId,
        Guid usuarioId,
        string emailLogin,
        string? identidadeEstavel = null,
        bool ativo = true)
    {
        if (id == Guid.Empty || empresaId == Guid.Empty || usuarioId == Guid.Empty)
            throw new RegraNegocioException("Identificadores do representante, empresa e usuário são obrigatórios.");
        var emailNormalizado = emailLogin.Trim().ToLowerInvariant();
        if (emailNormalizado.Length is < 3 or > 320 || !emailNormalizado.Contains('@'))
            throw new RegraNegocioException("Informe o e-mail de login do representante.");

        Id = id;
        EmpresaId = empresaId;
        UsuarioId = usuarioId;
        EmailLogin = emailNormalizado;
        IdentidadeEstavel = string.IsNullOrWhiteSpace(identidadeEstavel) ? null : identidadeEstavel.Trim();
        Ativo = ativo;
    }

    public Guid Id { get; }
    public Guid EmpresaId { get; }
    public Guid UsuarioId { get; }
    public string EmailLogin { get; }
    public string? IdentidadeEstavel { get; private set; }
    public bool Ativo { get; private set; }
    public IReadOnlyList<ContatoCessionario> Contatos => _contatos;
    public IReadOnlyList<FuncaoCessionario> Funcoes => _funcoes;

    public void VincularIdentidadeEstavel(string identidade)
    {
        var valor = identidade.Trim();
        if (valor.Length is < 1 or > 200)
            throw new RegraNegocioException("Identidade Entra inválida.");
        if (IdentidadeEstavel is not null && !string.Equals(IdentidadeEstavel, valor, StringComparison.Ordinal))
            throw new RegraNegocioException("A identidade estável do representante não pode ser substituída.");
        IdentidadeEstavel = valor;
    }

    public void SubstituirFuncoes(IEnumerable<FuncaoCessionario> funcoes)
    {
        var selecionadas = funcoes.DistinctBy(funcao => funcao.Id).ToArray();
        if (selecionadas.Any(funcao => funcao.EmpresaId != EmpresaId))
            throw new RegraNegocioException("A função deve pertencer à mesma empresa do representante.");
        _funcoes.Clear();
        _funcoes.AddRange(selecionadas);
    }

    public bool Pode(PermissaoCessionario permissao) =>
        Ativo && _funcoes.Any(funcao => funcao.Ativa && funcao.Permissoes.Contains(permissao));

    public void SalvarContato(ContatoCessionario contato)
    {
        var existente = _contatos.FindIndex(item => item.Id == contato.Id);
        if (existente >= 0)
            _contatos.RemoveAt(existente);

        if (contato.Principal)
        {
            foreach (var outro in _contatos.Where(item => item.Canal == contato.Canal))
                outro.DefinirPrincipal(false);
        }

        _contatos.Add(contato);
    }

    public void DefinirAtivo(bool ativo) => Ativo = ativo;
}