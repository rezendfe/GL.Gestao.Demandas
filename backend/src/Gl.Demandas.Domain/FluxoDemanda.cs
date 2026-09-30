namespace Gl.Demandas.Domain;

public enum FluxoDemanda
{
    Atendimento,
    Aprovacao,
    Obra
}

public static class FluxoDemandaTexto
{
    public static string ParaTexto(this FluxoDemanda fluxo) => fluxo switch
    {
        FluxoDemanda.Atendimento => "Atendimento",
        FluxoDemanda.Aprovacao => "Aprovação",
        FluxoDemanda.Obra => "Obra",
        _ => throw new ArgumentOutOfRangeException(nameof(fluxo))
    };

    public static string ParaCodigo(this FluxoDemanda fluxo) => fluxo switch
    {
        FluxoDemanda.Atendimento => "ATENDIMENTO",
        FluxoDemanda.Aprovacao => "APROVACAO",
        FluxoDemanda.Obra => "OBRA",
        _ => throw new ArgumentOutOfRangeException(nameof(fluxo))
    };

    public static FluxoDemanda ParaFluxo(string texto) => texto switch
    {
        "Atendimento" or "ATENDIMENTO" => FluxoDemanda.Atendimento,
        "Aprovação" or "APROVACAO" => FluxoDemanda.Aprovacao,
        "Obra" or "OBRA" => FluxoDemanda.Obra,
        _ => throw new ArgumentOutOfRangeException(nameof(texto), texto, "Fluxo desconhecido.")
    };
}
