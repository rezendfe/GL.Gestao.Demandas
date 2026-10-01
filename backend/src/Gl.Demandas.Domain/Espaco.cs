namespace Gl.Demandas.Domain;

public enum SituacaoEspaco
{
    Disponivel,
    Locado,
    Inativo
}

public sealed class Espaco
{
    private Espaco()
    {
    }

    public Guid Id { get; private set; }
    public string Codigo { get; private set; } = "";
    public string Nome { get; private set; } = "";
    public string Localizacao { get; private set; } = "";
    public string Descricao { get; private set; } = "";
    public bool Ativo { get; private set; }

    public static Espaco Cadastrar(Guid id, string codigo, string nome, string localizacao, string descricao)
    {
        if (id == Guid.Empty)
            throw new RegraNegocioException("Identificador do espaço inválido.");

        return new Espaco
        {
            Id = id,
            Codigo = FormatoCampo.CodigoEspaco(codigo),
            Nome = FormatoCampo.Texto(nome, 2, 120, "O nome do espaço deve ter entre 2 e 120 caracteres."),
            Localizacao = Validar(localizacao, "Informe a localização do espaço.", 240),
            Descricao = NormalizarDescricao(descricao),
            Ativo = true
        };
    }

    public static Espaco Carregar(Guid id, string codigo, string nome, string localizacao, string descricao, bool ativo) => new()
    {
        Id = id,
        Codigo = codigo,
        Nome = nome,
        Localizacao = localizacao,
        Descricao = descricao,
        Ativo = ativo
    };

    public void Atualizar(string codigo, string nome, string localizacao, string descricao)
    {
        Codigo = FormatoCampo.CodigoEspaco(codigo);
        Nome = FormatoCampo.Texto(nome, 2, 120, "O nome do espaço deve ter entre 2 e 120 caracteres.");
        Localizacao = Validar(localizacao, "Informe a localização do espaço.", 240);
        Descricao = NormalizarDescricao(descricao);
    }

    public void Inativar(bool possuiLocacaoVigente)
    {
        if (possuiLocacaoVigente)
            throw new RegraNegocioException("Encerre a locação vigente antes de inativar o espaço.");
        Ativo = false;
    }

    public void Ativar() => Ativo = true;

    public SituacaoEspaco Situacao(bool possuiLocacaoVigente) => !Ativo
        ? SituacaoEspaco.Inativo
        : possuiLocacaoVigente
            ? SituacaoEspaco.Locado
            : SituacaoEspaco.Disponivel;

    private static string NormalizarDescricao(string descricao)
    {
        if (string.IsNullOrWhiteSpace(descricao)) return "";
        var texto = descricao.Trim();
        if (texto.Length > 1000)
            throw new RegraNegocioException("A descrição do espaço tem no máximo 1000 caracteres.");
        return texto;
    }

    private static string Validar(string valor, string mensagem, int limite)
    {
        var texto = valor.Trim();
        if (texto.Length is < 1 || texto.Length > limite)
            throw new RegraNegocioException(mensagem);
        return texto;
    }
}

public sealed class Locacao
{
    private Locacao()
    {
    }

    public Guid Id { get; private set; }
    public Guid EspacoId { get; private set; }
    public Guid EmpresaId { get; private set; }
    public DateOnly Inicio { get; private set; }
    public DateOnly? Termino { get; private set; }
    public bool Vigente => Termino is null;

    public static Locacao Iniciar(Guid id, Guid espacoId, Guid empresaId, DateOnly inicio)
    {
        if (id == Guid.Empty || espacoId == Guid.Empty || empresaId == Guid.Empty)
            throw new RegraNegocioException("Informe espaço e empresa válidos para iniciar a locação.");

        return new Locacao
        {
            Id = id,
            EspacoId = espacoId,
            EmpresaId = empresaId,
            Inicio = inicio
        };
    }

    public void Encerrar(DateOnly termino)
    {
        if (!Vigente)
            throw new RegraNegocioException("A locação já foi encerrada.");
        if (termino < Inicio)
            throw new RegraNegocioException("A data de término não pode ser anterior ao início da locação.");
        Termino = termino;
    }
}