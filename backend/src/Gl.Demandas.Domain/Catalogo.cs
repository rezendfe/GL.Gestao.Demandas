namespace Gl.Demandas.Domain;

public sealed class Area
{
    public Area(Guid id, string nome, bool ativa = true)
    {
        Id = id;
        Nome = nome;
        Ativa = ativa;
    }

    public Guid Id { get; }
    public string Nome { get; }
    public bool Ativa { get; }
}

public sealed class Categoria
{
    public Categoria(Guid id, string nome, bool ativa = true, int? prazoHoras = null)
    {
        Id = id;
        Nome = nome;
        Ativa = ativa;
        PrazoHoras = prazoHoras;
    }

    public Guid Id { get; }
    public string Nome { get; set; }
    public bool Ativa { get; set; }
    public int? PrazoHoras { get; set; }
}

public sealed class Subcategoria
{
    public Subcategoria(Guid id, Guid categoriaId, Guid areaId, string nome, FluxoDemanda fluxo, bool ativa = true)
    {
        Id = id;
        CategoriaId = categoriaId;
        AreaId = areaId;
        Nome = nome;
        Fluxo = fluxo;
        Ativa = ativa;
    }

    public Guid Id { get; }
    public Guid CategoriaId { get; }
    public Guid AreaId { get; }
    public string Nome { get; set; }
    public FluxoDemanda Fluxo { get; set; }
    public bool Ativa { get; set; }
}

public sealed class RegraClassificacao
{
    public RegraClassificacao(
        Guid id,
        string termo,
        Guid subcategoriaId,
        string servico,
        string destino,
        string resumo,
        string prioridade,
        int ordemPrioridade,
        string confianca,
        int ordem)
    {
        Id = id;
        Termo = termo;
        SubcategoriaId = subcategoriaId;
        Servico = servico;
        Destino = destino;
        Resumo = resumo;
        Prioridade = prioridade;
        OrdemPrioridade = ordemPrioridade;
        Confianca = confianca;
        Ordem = ordem;
    }

    public Guid Id { get; }
    public string Termo { get; }
    public Guid SubcategoriaId { get; }
    public string Servico { get; }
    public string Destino { get; }
    public string Resumo { get; }
    public string Prioridade { get; }
    public int OrdemPrioridade { get; }
    public string Confianca { get; }
    public int Ordem { get; }
}
