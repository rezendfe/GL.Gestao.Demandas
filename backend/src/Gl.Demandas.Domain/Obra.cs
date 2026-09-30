namespace Gl.Demandas.Domain;

public static class ObraEtapas
{
    public static readonly IReadOnlyList<string> Linha =
    [
        "Projeto",
        "Análise",
        "Documentação",
        "Aprovação",
        "Execução",
        "Conclusão"
    ];
}

public sealed class DocumentoObra
{
    public DocumentoObra(Guid id, string nome, string situacao, int ordem)
    {
        Id = id;
        Nome = nome;
        Situacao = situacao;
        Ordem = ordem;
    }

    public Guid Id { get; }
    public string Nome { get; }
    public string Situacao { get; }
    public int Ordem { get; }
}

public sealed class Obra
{
    public Obra(
        Guid id,
        string nome,
        string local,
        string descricao,
        DateOnly inicioPrevisto,
        DateOnly terminoPrevisto,
        string empresaExecutora,
        string responsavel,
        string contato,
        string etapaAtual,
        IReadOnlyList<DocumentoObra> documentos)
    {
        Id = id;
        Nome = nome;
        Local = local;
        Descricao = descricao;
        InicioPrevisto = inicioPrevisto;
        TerminoPrevisto = terminoPrevisto;
        EmpresaExecutora = empresaExecutora;
        Responsavel = responsavel;
        Contato = contato;
        EtapaAtual = etapaAtual;
        Documentos = documentos;
    }

    public Guid Id { get; }
    public string Nome { get; }
    public string Local { get; }
    public string Descricao { get; }
    public DateOnly InicioPrevisto { get; }
    public DateOnly TerminoPrevisto { get; }
    public string EmpresaExecutora { get; }
    public string Responsavel { get; }
    public string Contato { get; }
    public string EtapaAtual { get; }
    public IReadOnlyList<DocumentoObra> Documentos { get; }
}
