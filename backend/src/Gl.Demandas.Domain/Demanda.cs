namespace Gl.Demandas.Domain;

public sealed class Mensagem
{
    public Mensagem(Guid id, Guid autorId, string texto, string canal, DateTime enviadaEm, string finalidade = "mensagem")
    {
        Id = id;
        AutorId = autorId;
        Texto = texto;
        Canal = canal;
        EnviadaEm = enviadaEm;
        Finalidade = finalidade;
    }

    public Guid Id { get; }
    public Guid AutorId { get; }
    public string Texto { get; }
    public string Canal { get; }
    public DateTime EnviadaEm { get; }
    public string Finalidade { get; }
}

public sealed class Anexo
{
    public Anexo(Guid id, string nome, string caminho, string tipo, long tamanho, DateTime enviadoEm)
    {
        Id = id;
        Nome = nome;
        Caminho = caminho;
        Tipo = tipo;
        Tamanho = tamanho;
        EnviadoEm = enviadoEm;
    }

    public Guid Id { get; }
    public string Nome { get; }
    public string Caminho { get; }
    public string Tipo { get; }
    public long Tamanho { get; }
    public DateTime EnviadoEm { get; }
}

public sealed class HistoricoDemanda
{
    public HistoricoDemanda(
        Guid id,
        Guid usuarioId,
        string? statusAnterior,
        string statusNovo,
        string comentario,
        string tipoEvento,
        DateTime eventoEm)
    {
        Id = id;
        UsuarioId = usuarioId;
        StatusAnterior = statusAnterior;
        StatusNovo = statusNovo;
        Comentario = comentario;
        TipoEvento = tipoEvento;
        EventoEm = eventoEm;
    }

    public Guid Id { get; }
    public Guid UsuarioId { get; }
    public string? StatusAnterior { get; }
    public string StatusNovo { get; }
    public string Comentario { get; }
    public string TipoEvento { get; }
    public DateTime EventoEm { get; }
}

public sealed class DecisaoAprovacao
{
    public DecisaoAprovacao(Guid id, Guid usuarioId, string decisao, string? motivo, DateTime decididaEm)
    {
        Id = id;
        UsuarioId = usuarioId;
        Decisao = decisao;
        Motivo = motivo;
        DecididaEm = decididaEm;
    }

    public Guid Id { get; }
    public Guid UsuarioId { get; }
    public string Decisao { get; }
    public string? Motivo { get; }
    public DateTime DecididaEm { get; }
}

public sealed class Demanda
{
    private readonly List<Mensagem> _mensagens = [];
    private readonly List<Anexo> _anexos = [];
    private readonly List<HistoricoDemanda> _historico = [];
    private readonly List<DecisaoAprovacao> _decisoes = [];

    private Demanda()
    {
    }

    public Guid Id { get; private set; }
    public string Protocolo { get; private set; } = "";
    public Guid CessionarioId { get; private set; }
    public Guid? EmpresaCessionariaId { get; private set; }
    public string Empresa { get; private set; } = "";
    public string Sala { get; private set; } = "";
    public string Descricao { get; private set; } = "";
    public string? Ponto { get; private set; }
    public Guid CategoriaId { get; private set; }
    public Guid SubcategoriaId { get; private set; }
    public Guid AreaId { get; private set; }
    public Guid? ResponsavelId { get; private set; }
    public string Servico { get; private set; } = "";
    public string Destino { get; private set; } = "";
    public SituacaoDemanda Situacao { get; private set; }
    public string Prioridade { get; private set; } = "Normal";
    public int OrdemPrioridade { get; private set; } = 3;
    public string Confianca { get; private set; } = "Alta";
    public string Classificacao { get; private set; } = "Sugerida";
    public FluxoDemanda Fluxo { get; private set; }
    public DateTime AbertoEm { get; private set; }
    public DateTime AtualizadoEm { get; private set; }
    public DateTime? PrevisaoAtendimento { get; private set; }
    public string Natureza { get; private set; } = "Serviço";
    public int? NotaAvaliacao { get; private set; }
    public string? ComentarioAvaliacao { get; private set; }
    public DateTime? AvaliadaEm { get; private set; }

    public bool EmAberto => Situacao is not (
        SituacaoDemanda.Concluido
        or SituacaoDemanda.Reprovado
        or SituacaoDemanda.Encerrada
        or SituacaoDemanda.Cancelada);

    public IReadOnlyCollection<Mensagem> Mensagens => _mensagens;
    public IReadOnlyCollection<Anexo> Anexos => _anexos;
    public IReadOnlyCollection<HistoricoDemanda> Historico => _historico;
    public IReadOnlyCollection<DecisaoAprovacao> Decisoes => _decisoes;

    public static Demanda Abrir(
        Guid id,
        string protocolo,
        Guid cessionarioId,
        string empresa,
        string sala,
        string descricao,
        string? ponto,
        Guid categoriaId,
        Guid subcategoriaId,
        Guid areaId,
        string servico,
        string destino,
        string prioridade,
        int ordemPrioridade,
        string confianca,
        FluxoDemanda fluxo,
        bool ajustadaPeloCessionario,
        string canal,
        DateTime agora,
        bool reclamacao = false,
        bool aprovacaoAutomatica = false,
        Guid? empresaCessionariaId = null)
    {
        if (string.IsNullOrWhiteSpace(descricao))
            throw new RegraNegocioException("Descreva o que está acontecendo.");
        if (string.IsNullOrWhiteSpace(sala))
            throw new RegraNegocioException("Informe a sala ou unidade.");
        if (canal is not ("PORTAL" or "MENSAGERIA"))
            throw new RegraNegocioException("Canal inválido.");
        descricao = FormatoCampo.Limitar(descricao, 2000, "A descrição tem no máximo 2000 caracteres.");
        sala = FormatoCampo.Limitar(sala, 80, "O local tem no máximo 80 caracteres.");
        ponto = string.IsNullOrWhiteSpace(ponto) ? null : FormatoCampo.Limitar(ponto, 200, "O ponto tem no máximo 200 caracteres.");

        var situacao = fluxo == FluxoDemanda.Aprovacao && !aprovacaoAutomatica
            ? SituacaoDemanda.AguardandoAprovacao
            : SituacaoDemanda.Novo;

        var demanda = new Demanda
        {
            Id = id,
            Protocolo = protocolo,
            CessionarioId = cessionarioId,
            EmpresaCessionariaId = empresaCessionariaId,
            Empresa = empresa,
            Sala = sala,
            Descricao = descricao,
            Ponto = ponto,
            CategoriaId = categoriaId,
            SubcategoriaId = subcategoriaId,
            AreaId = areaId,
            Servico = servico,
            Destino = destino,
            Situacao = situacao,
            Prioridade = prioridade,
            OrdemPrioridade = ordemPrioridade,
            Confianca = confianca,
            Classificacao = "Sugerida",
            Fluxo = fluxo,
            AbertoEm = agora,
            AtualizadoEm = agora,
            Natureza = reclamacao ? "Reclamação" : "Serviço"
        };

        demanda.RegistrarHistorico(cessionarioId, null, situacao, "Chamado aberto.", "ABERTURA", agora);
        if (reclamacao)
        {
            demanda.RegistrarHistorico(
                cessionarioId,
                situacao.ParaTexto(),
                situacao.ParaTexto(),
                "Chamado aberto como reclamação.",
                "RECLAMACAO",
                agora);
        }
        demanda.IncluirMensagem(cessionarioId, descricao.Trim(), canal, agora);
        if (ajustadaPeloCessionario)
        {
            demanda.RegistrarHistorico(
                cessionarioId,
                situacao.ParaTexto(),
                situacao.ParaTexto(),
                "Cessionário ajustou a classificação sugerida.",
                "CLASSIFICACAO",
                agora);
        }

        return demanda;
    }

    public static Demanda Carregar(
        Guid id,
        string protocolo,
        Guid cessionarioId,
        string empresa,
        string sala,
        string descricao,
        string? ponto,
        Guid categoriaId,
        Guid subcategoriaId,
        Guid areaId,
        Guid? responsavelId,
        string servico,
        string destino,
        SituacaoDemanda situacao,
        string prioridade,
        int ordemPrioridade,
        string confianca,
        string classificacao,
        FluxoDemanda fluxo,
        DateTime abertoEm,
        DateTime atualizadoEm,
        IEnumerable<Mensagem> mensagens,
        IEnumerable<Anexo> anexos,
        IEnumerable<HistoricoDemanda> historico,
        IEnumerable<DecisaoAprovacao> decisoes,
        DateTime? previsaoAtendimento = null,
        string natureza = "Serviço",
        int? notaAvaliacao = null,
        string? comentarioAvaliacao = null,
        DateTime? avaliadaEm = null,
        Guid? empresaCessionariaId = null)
    {
        var demanda = new Demanda
        {
            Id = id,
            Protocolo = protocolo,
            CessionarioId = cessionarioId,
            EmpresaCessionariaId = empresaCessionariaId,
            Empresa = empresa,
            Sala = sala,
            Descricao = descricao,
            Ponto = ponto,
            CategoriaId = categoriaId,
            SubcategoriaId = subcategoriaId,
            AreaId = areaId,
            ResponsavelId = responsavelId,
            Servico = servico,
            Destino = destino,
            Situacao = situacao,
            Prioridade = prioridade,
            OrdemPrioridade = ordemPrioridade,
            Confianca = confianca,
            Classificacao = classificacao,
            Fluxo = fluxo,
            AbertoEm = abertoEm,
            AtualizadoEm = atualizadoEm,
            PrevisaoAtendimento = previsaoAtendimento,
            Natureza = string.IsNullOrWhiteSpace(natureza) ? "Serviço" : natureza,
            NotaAvaliacao = notaAvaliacao,
            ComentarioAvaliacao = comentarioAvaliacao,
            AvaliadaEm = avaliadaEm
        };
        demanda._mensagens.AddRange(mensagens);
        demanda._anexos.AddRange(anexos);
        demanda._historico.AddRange(historico);
        demanda._decisoes.AddRange(decisoes);
        return demanda;
    }

    public void GarantirLeitura(Perfil perfil, Guid usuarioId, Guid? areaId, Guid? empresaCessionariaId = null)
    {
        var permitido = perfil switch
        {
            Perfil.GlAdministrador => true,
            Perfil.Cessionario => usuarioId == CessionarioId ||
                (EmpresaCessionariaId is Guid empresaId && empresaCessionariaId == empresaId),
            Perfil.ResponsavelArea => areaId == AreaId,
            _ => false
        };

        if (!permitido)
            throw new AcessoNegadoException();
    }

    public void ConfirmarClassificacao(
        Perfil perfil,
        Guid autorId,
        Subcategoria subcategoria,
        string servico,
        string destino,
        string prioridade,
        int ordemPrioridade,
        FluxoDemanda fluxo,
        DateTime agora,
        bool aprovacaoAutomatica = false)
    {
        if (perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException();

        var alterou = subcategoria.Id != SubcategoriaId;
        var anterior = Situacao.ParaTexto();
        CategoriaId = subcategoria.CategoriaId;
        SubcategoriaId = subcategoria.Id;
        AreaId = subcategoria.AreaId;
        Servico = servico;
        Destino = destino;
        Prioridade = prioridade;
        OrdemPrioridade = ordemPrioridade;
        Fluxo = fluxo;
        if (fluxo == FluxoDemanda.Aprovacao && Situacao == SituacaoDemanda.Novo && !aprovacaoAutomatica)
            Situacao = SituacaoDemanda.AguardandoAprovacao;
        Classificacao = "Confirmada";
        AtualizadoEm = agora;
        RegistrarHistorico(
            autorId,
            anterior,
            Situacao.ParaTexto(),
            alterou
                ? $"Classificação alterada para {servico}. Destino: {destino}."
                : $"Classificação confirmada: {servico}. Destino: {destino}.",
            "CLASSIFICACAO",
            agora);
    }

    public void Redirecionar(Perfil perfil, Guid autorId, Guid areaId, Guid? responsavelId, string nomeArea, DateTime agora)
    {
        if (perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException();

        var anterior = Situacao;
        AreaId = areaId;
        ResponsavelId = responsavelId;
        if (Situacao == SituacaoDemanda.Novo)
            Situacao = SituacaoDemanda.Recebido;
        AtualizadoEm = agora;
        RegistrarHistorico(
            autorId,
            anterior.ParaTexto(),
            Situacao.ParaTexto(),
            $"Demanda direcionada para {nomeArea}.",
            "REDIRECIONAMENTO",
            agora);
    }

    public bool RegistrarAndamento(
        Perfil perfil,
        Guid autorId,
        Guid? areaDoAutor,
        SituacaoDemanda nova,
        string comentario,
        DateTime agora)
    {
        if (perfil != Perfil.GlAdministrador &&
            !(perfil == Perfil.ResponsavelArea && areaDoAutor == AreaId))
        {
            throw new AcessoNegadoException();
        }

        if (string.IsNullOrWhiteSpace(comentario))
            throw new RegraNegocioException("Registre o que foi feito.");
        comentario = FormatoCampo.Limitar(comentario, 2000, "O comentário tem no máximo 2000 caracteres.");

        GarantirTransicao(nova);
        var anterior = Situacao;
        Situacao = nova;
        if (ResponsavelId is null && perfil == Perfil.ResponsavelArea)
            ResponsavelId = autorId;
        AtualizadoEm = agora;
        RegistrarHistorico(autorId, anterior.ParaTexto(), nova.ParaTexto(), comentario.Trim(), "ANDAMENTO", agora);
        return anterior != SituacaoDemanda.EmAndamento && nova == SituacaoDemanda.EmAndamento;
    }

    public ResultadoAvanco Avancar(
        Perfil perfil,
        Guid autorId,
        Guid? areaDoAutor,
        IReadOnlyList<EtapaCadeia> cadeia,
        string? comentario,
        DateTime? previsao,
        bool? confirmacao,
        DateTime agora,
        Guid? empresaCessionariaId = null)
    {
        var destino = CadeiaAtendimento.Proxima(Situacao, cadeia)
            ?? throw new TransicaoInvalidaException("Este chamado não tem próxima ação.");

        CadeiaAtendimento.GarantirQuemAvanca(perfil, autorId, areaDoAutor, CessionarioId, EmpresaCessionariaId, empresaCessionariaId, AreaId, Situacao, destino);

        var devolve = Situacao == SituacaoDemanda.AguardandoValidacao && confirmacao == false;
        if (Situacao == SituacaoDemanda.AguardandoValidacao && confirmacao is null)
            throw new RegraNegocioException("Informe se o serviço foi realizado.");
        if (!string.IsNullOrWhiteSpace(comentario))
            comentario = FormatoCampo.Limitar(comentario, 2000, "O comentário tem no máximo 2000 caracteres.");

        if (devolve)
        {
            if (string.IsNullOrWhiteSpace(comentario))
                throw new RegraNegocioException("Descreva o que ainda falta.");
            GarantirTransicao(SituacaoDemanda.EmAndamento);
            var antes = Situacao;
            Situacao = SituacaoDemanda.EmAndamento;
            AtualizadoEm = agora;
            RegistrarHistorico(autorId, antes.ParaTexto(), Situacao.ParaTexto(), comentario.Trim(), "VALIDACAO", agora);
            return new ResultadoAvanco(false, false);
        }

        CadeiaAtendimento.ExigirCampos(destino, comentario, previsao, PrevisaoAtendimento, _anexos.Count > 0);
        foreach (var automatica in CadeiaAtendimento.AutomaticasEntre(Situacao, destino, cadeia))
        {
            RegistrarHistorico(
                autorId,
                Situacao.ParaTexto(),
                Situacao.ParaTexto(),
                $"{automatica.Nome} automática.",
                "CADEIA",
                agora);
        }

        if (Situacao == SituacaoDemanda.AguardandoAprovacao && destino.Codigo == CadeiaAtendimento.Atendimento)
        {
            Decidir(perfil, autorId, "Aprovar", comentario, agora);
            if (previsao is DateTime quando)
                DefinirPrevisao(perfil, autorId, areaDoAutor, quando, agora);
            return new ResultadoAvanco(false, false);
        }

        var nova = CadeiaAtendimento.SituacaoAoEntrar(destino);
        var texto = string.IsNullOrWhiteSpace(comentario) ? $"Avançou para {destino.Nome}." : comentario.Trim();
        if (Situacao == SituacaoDemanda.AguardandoValidacao && nova == SituacaoDemanda.Concluido)
        {
            GarantirTransicao(nova);
            var antes = Situacao;
            Situacao = nova;
            AtualizadoEm = agora;
            RegistrarHistorico(autorId, antes.ParaTexto(), nova.ParaTexto(), texto, "VALIDACAO", agora);
            return new ResultadoAvanco(false, false);
        }

        var entrou = RegistrarAndamento(perfil, autorId, areaDoAutor, nova, texto, agora);
        if (previsao is DateTime prevista)
            DefinirPrevisao(perfil, autorId, areaDoAutor, prevista, agora);
        return new ResultadoAvanco(entrou, nova == SituacaoDemanda.AguardandoValidacao);
    }

    public void DefinirPrevisao(Perfil perfil, Guid autorId, Guid? areaDoAutor, DateTime previsao, DateTime agora)
    {
        if (perfil != Perfil.GlAdministrador &&
            !(perfil == Perfil.ResponsavelArea && areaDoAutor == AreaId))
        {
            throw new AcessoNegadoException("A previsão de atendimento é do Responsável da Área ou do GL / Administrador.");
        }

        PrevisaoAtendimento = previsao;
        AtualizadoEm = agora;
        RegistrarHistorico(autorId, Situacao.ParaTexto(), Situacao.ParaTexto(), "Previsão de atendimento definida.", "PREVISAO", agora);
    }

    public void Avaliar(Perfil perfil, Guid autorId, int nota, string? comentario, DateTime agora, Guid? empresaCessionariaId = null)
    {
        if (perfil != Perfil.Cessionario ||
            (autorId != CessionarioId && (EmpresaCessionariaId is not Guid empresaId || empresaCessionariaId != empresaId)))
            throw new AcessoNegadoException("A avaliação do atendimento é do Cessionário do chamado.");
        if (Situacao is not (SituacaoDemanda.Concluido or SituacaoDemanda.Encerrada))
            throw new RegraNegocioException("A avaliação fica disponível quando o serviço é concluído.");
        if (NotaAvaliacao is not null)
            throw new RegraNegocioException("Este serviço já foi avaliado.");
        if (nota is < 0 or > 10)
            throw new RegraNegocioException("A nota vai de 0 a 10.");

        var texto = string.IsNullOrWhiteSpace(comentario)
            ? null
            : FormatoCampo.Limitar(comentario, 500, "O comentário da avaliação tem no máximo 500 caracteres.");
        NotaAvaliacao = nota;
        ComentarioAvaliacao = texto;
        AvaliadaEm = agora;
        AtualizadoEm = agora;
        var registro = texto is null
            ? $"Avaliação do atendimento: {nota}."
            : $"Avaliação do atendimento: {nota}. {texto}";
        RegistrarHistorico(autorId, Situacao.ParaTexto(), Situacao.ParaTexto(), registro, "AVALIACAO", agora);
    }

    public void AdicionarMensagem(Perfil perfil, Guid autorId, Guid? areaDoAutor, string texto, string canal, DateTime agora, string finalidade = "mensagem", Guid? empresaCessionariaId = null)
    {
        GarantirLeitura(perfil, autorId, areaDoAutor, empresaCessionariaId);
        if (string.IsNullOrWhiteSpace(texto))
            throw new RegraNegocioException("Escreva a mensagem.");
        texto = FormatoCampo.Limitar(texto, 2000, "A mensagem tem no máximo 2000 caracteres.");
        if (finalidade is not ("mensagem" or "complemento"))
            throw new RegraNegocioException("Finalidade de mensagem inválida.");
        if (finalidade == "complemento" && perfil == Perfil.Cessionario)
            throw new AcessoNegadoException("O complemento é pedido pelo Responsável da Área ou pelo GL / Administrador.");

        IncluirMensagem(autorId, texto.Trim(), canal, agora, finalidade);
        var comentario = finalidade == "complemento" ? "Complemento solicitado." : "Mensagem registrada.";
        RegistrarHistorico(autorId, Situacao.ParaTexto(), Situacao.ParaTexto(), comentario, "MENSAGEM", agora);
        AtualizadoEm = agora;
    }

    public int PendenciasAbertas()
    {
        var ordenadas = _mensagens.OrderBy(m => m.EnviadaEm).ToList();
        var total = ordenadas.Count(complemento =>
            complemento.Finalidade == "complemento" &&
            !ordenadas.Any(resposta => resposta.AutorId == CessionarioId && resposta.EnviadaEm > complemento.EnviadaEm));
        if (Situacao == SituacaoDemanda.AguardandoAjuste)
            total++;
        return total;
    }

    public IReadOnlyList<string> ComplementosPendentes()
    {
        var ordenadas = _mensagens.OrderBy(m => m.EnviadaEm).ToList();
        return ordenadas
            .Where(complemento =>
                complemento.Finalidade == "complemento" &&
                !ordenadas.Any(resposta => resposta.AutorId == CessionarioId && resposta.EnviadaEm > complemento.EnviadaEm))
            .Select(complemento => complemento.Texto)
            .ToArray();
    }

    public void AdicionarAnexo(
        Perfil perfil,
        Guid autorId,
        Guid? areaDoAutor,
        Anexo anexo,
        DateTime agora,
        Guid? empresaCessionariaId = null)
    {
        GarantirLeitura(perfil, autorId, areaDoAutor, empresaCessionariaId);
        _anexos.Add(anexo);
        RegistrarHistorico(autorId, Situacao.ParaTexto(), Situacao.ParaTexto(), $"Documento anexado: {anexo.Nome}.", "ANEXO", agora);
        AtualizadoEm = agora;
    }

    public void Encerrar(Perfil perfil, Guid autorId, DateTime agora)
    {
        if (perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException("Encerrar o chamado é exclusivo do GL / Administrador.");
        if (Situacao != SituacaoDemanda.Concluido)
            throw new TransicaoInvalidaException("Só é possível encerrar um chamado concluído.");

        var anterior = Situacao;
        Situacao = SituacaoDemanda.Encerrada;
        AtualizadoEm = agora;
        RegistrarHistorico(autorId, anterior.ParaTexto(), Situacao.ParaTexto(), "Chamado encerrado.", "ENCERRAMENTO", agora);
    }

    public void Cancelar(Perfil perfil, Guid autorId, string motivo, DateTime agora)
    {
        if (perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException("Cancelar o chamado é exclusivo do GL / Administrador.");
        if (Situacao is SituacaoDemanda.Concluido or SituacaoDemanda.Encerrada or SituacaoDemanda.Reprovado or SituacaoDemanda.Cancelada)
            throw new TransicaoInvalidaException("Este chamado já teve desfecho e não pode ser cancelado.");
        if (string.IsNullOrWhiteSpace(motivo))
            throw new RegraNegocioException("Informe o motivo.");
        var texto = FormatoCampo.Limitar(motivo, 2000, "O motivo tem no máximo 2000 caracteres.");

        var anterior = Situacao;
        Situacao = SituacaoDemanda.Cancelada;
        AtualizadoEm = agora;
        RegistrarHistorico(autorId, anterior.ParaTexto(), Situacao.ParaTexto(), texto, "CANCELAMENTO", agora);
    }

    public void Decidir(Perfil perfil, Guid autorId, string decisao, string? motivo, DateTime agora)
    {
        if (perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException("Aprovar, solicitar ajuste ou reprovar é exclusivo do GL / Administrador.");
        if (Situacao != SituacaoDemanda.AguardandoAprovacao)
            throw new TransicaoInvalidaException("Esta demanda não está aguardando aprovação.");

        var (nova, rotulo) = decisao switch
        {
            "Aprovar" => (SituacaoDemanda.LiberadoParaExecucao, "Aprovada"),
            "Solicitar ajuste" => ExigirMotivo(SituacaoDemanda.AguardandoAjuste, "Ajuste solicitado", motivo),
            "Reprovar" => ExigirMotivo(SituacaoDemanda.Reprovado, "Reprovada", motivo),
            _ => throw new RegraNegocioException("Decisão inválida.")
        };

        var anterior = Situacao;
        Situacao = nova;
        AtualizadoEm = agora;
        _decisoes.Add(new DecisaoAprovacao(Guid.NewGuid(), autorId, decisao, string.IsNullOrWhiteSpace(motivo) ? null : motivo.Trim(), agora));
        var comentario = string.IsNullOrWhiteSpace(motivo) ? $"{rotulo}." : $"{rotulo}. {motivo.Trim()}";
        RegistrarHistorico(autorId, anterior.ParaTexto(), nova.ParaTexto(), comentario, "APROVACAO", agora);
    }

    public void IncluirMensagem(Guid autorId, string texto, string canal, DateTime agora, string finalidade = "mensagem") =>
        _mensagens.Add(new Mensagem(Guid.NewGuid(), autorId, texto, canal, agora, finalidade));

    public void RegistrarEvento(Guid autorId, string comentario, string tipo, DateTime agora) =>
        RegistrarHistorico(autorId, Situacao.ParaTexto(), Situacao.ParaTexto(), comentario, tipo, agora);

    private static (SituacaoDemanda Situacao, string Rotulo) ExigirMotivo(SituacaoDemanda situacao, string rotulo, string? motivo)
    {
        if (string.IsNullOrWhiteSpace(motivo))
            throw new RegraNegocioException("Informe o motivo.");
        if (motivo.Trim().Length > 2000)
            throw new RegraNegocioException("O motivo tem no máximo 2000 caracteres.");
        return (situacao, rotulo);
    }

    private void GarantirTransicao(SituacaoDemanda nova)
    {
        var permitida = (Situacao, nova) switch
        {
            (SituacaoDemanda.Novo, SituacaoDemanda.Recebido) => true,
            (SituacaoDemanda.Novo, SituacaoDemanda.AguardandoAprovacao) => true,
            (SituacaoDemanda.Novo, SituacaoDemanda.EmAndamento) => true,
            (SituacaoDemanda.Recebido, SituacaoDemanda.AguardandoAprovacao) => true,
            (SituacaoDemanda.Recebido, SituacaoDemanda.EmAndamento) => true,
            (SituacaoDemanda.EmAndamento, SituacaoDemanda.AguardandoValidacao) => true,
            (SituacaoDemanda.EmAndamento, SituacaoDemanda.Concluido) => true,
            (SituacaoDemanda.LiberadoParaExecucao, SituacaoDemanda.EmAndamento) => true,
            (SituacaoDemanda.LiberadoParaExecucao, SituacaoDemanda.AguardandoValidacao) => true,
            (SituacaoDemanda.LiberadoParaExecucao, SituacaoDemanda.Concluido) => true,
            (SituacaoDemanda.AguardandoValidacao, SituacaoDemanda.Concluido) => true,
            (SituacaoDemanda.AguardandoValidacao, SituacaoDemanda.EmAndamento) => true,
            _ => false
        };

        if (!permitida)
            throw new TransicaoInvalidaException($"Não é possível ir de {Situacao.ParaTexto()} para {nova.ParaTexto()}.");
    }

    private void RegistrarHistorico(
        Guid usuarioId,
        string? statusAnterior,
        SituacaoDemanda statusNovo,
        string comentario,
        string tipo,
        DateTime agora) =>
        RegistrarHistorico(usuarioId, statusAnterior, statusNovo.ParaTexto(), comentario, tipo, agora);

    private void RegistrarHistorico(
        Guid usuarioId,
        string? statusAnterior,
        string statusNovo,
        string comentario,
        string tipo,
        DateTime agora) =>
        _historico.Add(new HistoricoDemanda(Guid.NewGuid(), usuarioId, statusAnterior, statusNovo, comentario, tipo, agora));
}
