namespace Gl.Demandas.Domain;

public sealed record ResultadoAvanco(bool EntrouEmAtendimento, bool AguardaValidacao);

public sealed record CadeiaDoTipo(Guid SubcategoriaId, IReadOnlyList<EtapaCadeia> Etapas);

public sealed record TarefaCadeia(string Codigo, bool Obrigatoria);

public sealed class EtapaCadeia
{
    public EtapaCadeia(
        string codigo,
        string nome,
        int ordem,
        bool automatica,
        IReadOnlyList<string> campos,
        IReadOnlyList<TarefaCadeia>? tarefas = null)
    {
        Codigo = codigo;
        Nome = nome;
        Ordem = ordem;
        Automatica = automatica;
        Tarefas = tarefas is { Count: > 0 }
            ? tarefas
            : campos.Select(campo => new TarefaCadeia(campo, true)).ToArray();
    }

    public string Codigo { get; }
    public string Nome { get; }
    public int Ordem { get; }
    public bool Automatica { get; }
    public IReadOnlyList<TarefaCadeia> Tarefas { get; }
    public IReadOnlyList<string> Campos => Tarefas.Select(tarefa => tarefa.Codigo).ToArray();
}

public static class CadeiaAtendimento
{
    public const string Solicitacao = "solicitacao";
    public const string Aprovacao = "aprovacao";
    public const string Atendimento = "atendimento";
    public const string Validacao = "validacao";
    public const string Conclusao = "conclusao";

    private static readonly string[] Ordem =
    [
        Solicitacao, Aprovacao, Atendimento, Validacao, Conclusao
    ];

    private static readonly Dictionary<string, string[]> CamposPermitidos = new()
    {
        [Solicitacao] = [],
        [Aprovacao] = ["comentario", "anexo"],
        [Atendimento] = ["comentario", "previsao", "anexo"],
        [Validacao] = ["comentario", "anexo"],
        [Conclusao] = ["comentario", "anexo"]
    };

    public static IReadOnlyList<EtapaCadeia> Padrao() =>
    [
        new(Solicitacao, "Solicitação", 1, false, []),
        new(Aprovacao, "Aprovação", 2, false, ["comentario"]),
        new(Atendimento, "Atendimento", 3, false, ["comentario", "previsao"]),
        new(Validacao, "Validação do cliente", 4, false, ["comentario"]),
        new(Conclusao, "Conclusão", 5, false, [])
    ];

    public static IReadOnlyList<EtapaCadeia> Configurar(IReadOnlyList<EtapaCadeia> recebidas)
    {
        if (recebidas.Count != Ordem.Length || recebidas.Select(e => e.Codigo).Distinct().Count() != Ordem.Length)
            throw new RegraNegocioException("A cadeia precisa manter Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão.");

        var porCodigo = recebidas.ToDictionary(e => e.Codigo);
        if (Ordem.Any(codigo => !porCodigo.ContainsKey(codigo)))
            throw new RegraNegocioException("A cadeia precisa manter Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão.");

        if (porCodigo[Solicitacao].Automatica || porCodigo[Conclusao].Automatica)
            throw new RegraNegocioException("Solicitação e Conclusão permanecem na cadeia.");

        return Ordem.Select((codigo, indice) =>
        {
            var etapa = porCodigo[codigo];
            var permitidos = CamposPermitidos[codigo];
            var tarefas = etapa.Tarefas
                .GroupBy(tarefa => tarefa.Codigo)
                .Select(grupo => grupo.First())
                .ToArray();
            if (tarefas.Any(tarefa => !permitidos.Contains(tarefa.Codigo)))
                throw new RegraNegocioException($"A etapa {NomeDe(codigo)} não aceita esse campo.");
            var exigida = tarefas.FirstOrDefault(tarefa => tarefa.Obrigatoria);
            if (etapa.Automatica && exigida is not null)
                throw new RegraNegocioException($"A etapa {NomeDe(codigo)} é automática e não pode exigir a tarefa {NomeTarefa(exigida.Codigo)}.");
            return new EtapaCadeia(codigo, NomeDe(codigo), indice + 1, etapa.Automatica, tarefas.Select(tarefa => tarefa.Codigo).ToArray(), tarefas);
        }).ToArray();
    }

    public static string Coluna(SituacaoDemanda situacao) => situacao switch
    {
        SituacaoDemanda.Novo or SituacaoDemanda.Recebido => Solicitacao,
        SituacaoDemanda.AguardandoAprovacao or SituacaoDemanda.AguardandoAjuste => Aprovacao,
        SituacaoDemanda.EmAndamento or SituacaoDemanda.LiberadoParaExecucao => Atendimento,
        SituacaoDemanda.AguardandoValidacao => Validacao,
        SituacaoDemanda.Concluido or SituacaoDemanda.Reprovado => Conclusao,
        _ => throw new ArgumentOutOfRangeException(nameof(situacao))
    };

    public static EtapaCadeia? Proxima(SituacaoDemanda atual, IReadOnlyList<EtapaCadeia> cadeia)
    {
        if (atual is SituacaoDemanda.Concluido or SituacaoDemanda.Reprovado or SituacaoDemanda.AguardandoAjuste)
            return null;

        var ordem = cadeia.First(e => e.Codigo == Coluna(atual)).Ordem;
        return cadeia.Where(e => e.Ordem > ordem && !e.Automatica).OrderBy(e => e.Ordem).FirstOrDefault();
    }

    public static IReadOnlyList<EtapaCadeia> AutomaticasEntre(SituacaoDemanda atual, EtapaCadeia destino, IReadOnlyList<EtapaCadeia> cadeia)
    {
        var ordem = cadeia.First(e => e.Codigo == Coluna(atual)).Ordem;
        return cadeia.Where(e => e.Automatica && e.Ordem > ordem && e.Ordem < destino.Ordem).OrderBy(e => e.Ordem).ToArray();
    }

    public static void GarantirQuemAvanca(
        Perfil perfil,
        Guid autorId,
        Guid? areaDoAutor,
        Guid cessionarioId,
        Guid? empresaCessionariaId,
        Guid? empresaDoAutor,
        Guid areaId,
        SituacaoDemanda atual,
        EtapaCadeia destino)
    {
        if (atual == SituacaoDemanda.AguardandoValidacao && destino.Codigo == Conclusao)
        {
            if (perfil != Perfil.Cessionario ||
                (autorId != cessionarioId && (empresaCessionariaId is not Guid empresaId || empresaDoAutor != empresaId)))
                throw new AcessoNegadoException("A validação do atendimento é do Cessionário do chamado.");
            return;
        }

        if (destino.Codigo == Aprovacao || atual == SituacaoDemanda.AguardandoAprovacao)
        {
            if (perfil != Perfil.GlAdministrador)
                throw new AcessoNegadoException("A aprovação da solicitação é do GL / Administrador.");
            return;
        }

        var daArea = perfil == Perfil.GlAdministrador || (perfil == Perfil.ResponsavelArea && areaDoAutor == areaId);
        if (!daArea)
            throw new AcessoNegadoException("Quem avança o atendimento é o Responsável da Área ou o GL / Administrador.");
    }

    public static void ExigirCampos(EtapaCadeia destino, string? comentario, DateTime? previsao, DateTime? previsaoAtual, bool possuiAnexo)
    {
        foreach (var tarefa in destino.Tarefas.Where(tarefa => tarefa.Obrigatoria))
        {
            if (tarefa.Codigo == "comentario" && string.IsNullOrWhiteSpace(comentario))
                throw new RegraNegocioException("Preencha o que esta etapa pede para mudar de status.");
            if (tarefa.Codigo == "previsao" && previsao is null && previsaoAtual is null)
                throw new RegraNegocioException("Informe a previsão de atendimento.");
            if (tarefa.Codigo == "anexo" && !possuiAnexo)
                throw new RegraNegocioException("Anexe o documento que esta etapa pede.");
        }
    }

    public static SituacaoDemanda SituacaoAoEntrar(EtapaCadeia destino) => destino.Codigo switch
    {
        Aprovacao => SituacaoDemanda.AguardandoAprovacao,
        Atendimento => SituacaoDemanda.EmAndamento,
        Validacao => SituacaoDemanda.AguardandoValidacao,
        Conclusao => SituacaoDemanda.Concluido,
        _ => throw new TransicaoInvalidaException("Esta etapa não recebe chamado.")
    };

    public static string NomeTarefa(string codigo) => codigo switch
    {
        "comentario" => "Observação",
        "previsao" => "Previsão de atendimento",
        "anexo" => "Anexo",
        _ => codigo
    };

    public static string NomeDe(string codigo) => codigo switch
    {
        Solicitacao => "Solicitação",
        Aprovacao => "Aprovação",
        Atendimento => "Atendimento",
        Validacao => "Validação do cliente",
        Conclusao => "Conclusão",
        _ => codigo
    };
}
