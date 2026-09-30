namespace Gl.Demandas.Domain;

public sealed record ResultadoAvanco(bool EntrouEmAtendimento, bool AguardaValidacao);

public sealed record CadeiaDoTipo(Guid SubcategoriaId, IReadOnlyList<EtapaCadeia> Etapas);

public sealed class EtapaCadeia
{
    public EtapaCadeia(string codigo, string nome, int ordem, bool automatica, IReadOnlyList<string> campos)
    {
        Codigo = codigo;
        Nome = nome;
        Ordem = ordem;
        Automatica = automatica;
        Campos = campos;
    }

    public string Codigo { get; }
    public string Nome { get; }
    public int Ordem { get; }
    public bool Automatica { get; }
    public IReadOnlyList<string> Campos { get; }
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
        [Aprovacao] = ["comentario"],
        [Atendimento] = ["comentario", "previsao"],
        [Validacao] = ["comentario"],
        [Conclusao] = ["comentario"]
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
            var campos = etapa.Campos.Distinct().ToArray();
            if (campos.Any(campo => !permitidos.Contains(campo)))
                throw new RegraNegocioException($"A etapa {NomeDe(codigo)} não aceita esse campo.");
            return new EtapaCadeia(codigo, NomeDe(codigo), indice + 1, etapa.Automatica, campos);
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

    public static void ExigirCampos(EtapaCadeia destino, string? comentario, DateTime? previsao, DateTime? previsaoAtual)
    {
        if (destino.Campos.Contains("comentario") && string.IsNullOrWhiteSpace(comentario))
            throw new RegraNegocioException("Preencha o que esta etapa pede para mudar de status.");
        if (destino.Campos.Contains("previsao") && previsao is null && previsaoAtual is null)
            throw new RegraNegocioException("Informe a previsão de atendimento.");
    }

    public static SituacaoDemanda SituacaoAoEntrar(EtapaCadeia destino) => destino.Codigo switch
    {
        Aprovacao => SituacaoDemanda.AguardandoAprovacao,
        Atendimento => SituacaoDemanda.EmAndamento,
        Validacao => SituacaoDemanda.AguardandoValidacao,
        Conclusao => SituacaoDemanda.Concluido,
        _ => throw new TransicaoInvalidaException("Esta etapa não recebe chamado.")
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
