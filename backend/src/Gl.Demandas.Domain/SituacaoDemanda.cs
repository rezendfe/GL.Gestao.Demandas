namespace Gl.Demandas.Domain;

public enum SituacaoDemanda
{
    Novo,
    Recebido,
    EmAndamento,
    AguardandoAprovacao,
    LiberadoParaExecucao,
    AguardandoAjuste,
    AguardandoValidacao,
    Reprovado,
    Concluido,
    Encerrada,
    Cancelada
}

public static class SituacaoDemandaTexto
{
    public static string ParaTexto(this SituacaoDemanda situacao) => situacao switch
    {
        SituacaoDemanda.Novo => "Novo",
        SituacaoDemanda.Recebido => "Recebido",
        SituacaoDemanda.EmAndamento => "Em andamento",
        SituacaoDemanda.AguardandoAprovacao => "Aguardando aprovação",
        SituacaoDemanda.LiberadoParaExecucao => "Liberado para execução",
        SituacaoDemanda.AguardandoAjuste => "Aguardando ajuste",
        SituacaoDemanda.AguardandoValidacao => "Aguardando validação",
        SituacaoDemanda.Reprovado => "Reprovado",
        SituacaoDemanda.Concluido => "Concluído",
        SituacaoDemanda.Encerrada => "Encerrada",
        SituacaoDemanda.Cancelada => "Cancelada",
        _ => throw new ArgumentOutOfRangeException(nameof(situacao))
    };

    public static SituacaoDemanda ParaSituacao(string texto) => texto switch
    {
        "Novo" => SituacaoDemanda.Novo,
        "Recebido" => SituacaoDemanda.Recebido,
        "Em andamento" => SituacaoDemanda.EmAndamento,
        "Aguardando aprovação" => SituacaoDemanda.AguardandoAprovacao,
        "Liberado para execução" => SituacaoDemanda.LiberadoParaExecucao,
        "Aguardando ajuste" => SituacaoDemanda.AguardandoAjuste,
        "Aguardando validação" => SituacaoDemanda.AguardandoValidacao,
        "Reprovado" => SituacaoDemanda.Reprovado,
        "Concluído" => SituacaoDemanda.Concluido,
        "Encerrada" => SituacaoDemanda.Encerrada,
        "Cancelada" => SituacaoDemanda.Cancelada,
        _ => throw new ArgumentOutOfRangeException(nameof(texto), texto, "Situação desconhecida.")
    };
}
