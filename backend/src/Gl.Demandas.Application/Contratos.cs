namespace Gl.Demandas.Application;

public sealed record UsuarioSessaoDto(
    Guid Id,
    string Nome,
    string Email,
    string Perfil,
    Guid? AreaId,
    string? Empresa,
    string? Sala,
    string? LogoEmpresa,
    string? Foto);

public sealed record LoginResultadoDto(string Token, UsuarioSessaoDto Usuario);

public sealed record PreenchimentoDto(
    string? Assunto,
    string? Sala,
    string? Ponto,
    string? DataDesejada,
    string? Periodo,
    string? Telefone,
    IReadOnlyList<string> Itens,
    bool? AutorizaAcesso,
    SugestaoDto? Sugestao,
    string Origem,
    string Aviso);

public sealed record SugestaoDto(
    Guid CategoriaId,
    string Categoria,
    Guid SubcategoriaId,
    string Subcategoria,
    Guid AreaId,
    string Servico,
    string DestinoSugerido,
    string Confianca,
    string Prioridade,
    string Fluxo,
    string Resumo);

public sealed record AbrirComando(string Descricao, string Sala, string? Ponto, Guid SubcategoriaId, string Canal, bool Reclamacao = false);

public sealed record AndamentoComando(string Comentario, string Situacao);

public sealed record AvancarComando(string? Comentario, DateTime? Previsao, bool? Confirmacao);

public sealed record TarefaCadeiaDto(string Codigo, bool Obrigatoria);

public sealed record EtapaCadeiaDto(string Codigo, string Nome, int Ordem, bool Automatica, IReadOnlyList<string> Campos, IReadOnlyList<TarefaCadeiaDto> Tarefas);

public sealed record CadeiaTipoDto(Guid SubcategoriaId, string Categoria, string Tipo, IReadOnlyList<EtapaCadeiaDto> Etapas);

public sealed record AprovacaoComando(string Decisao, string? Motivo);
public sealed record CancelamentoComando(string Motivo);

public sealed record RedirecionarComando(Guid AreaId, Guid? ResponsavelId);

public sealed record MensagemComando(string Texto, bool Complemento = false);

public sealed record PrevisaoComando(DateTime Quando);

public sealed record AvaliacaoComando(int Nota, string? Comentario);

public sealed record RespostaNotificacaoComando(string Texto);

public sealed record FilaItemDto(
    Guid Id,
    string Protocolo,
    string Cessionario,
    string Servico,
    string Situacao,
    string Responsavel,
    string Prioridade,
    DateTime AbertoEm,
    string Fluxo,
    DateTime? PrevisaoAtendimento,
    int Pendencias,
    IReadOnlyList<string> Complementos,
    string Natureza,
    int? NotaAvaliacao,
    string? ComentarioAvaliacao,
    Guid SubcategoriaId,
    int? PrazoCategoriaHoras,
    string Local);

public sealed record PessoaDto(Guid Id, string Nome, string? Empresa, string? Sala);

public sealed record MensagemDto(Guid Id, string Autor, string Texto, string Canal, DateTime EnviadaEm, string Finalidade);

public sealed record AnexoDto(Guid Id, string Nome, string Tipo, long Tamanho);

public sealed record HistoricoDto(
    Guid Id,
    string Autor,
    string? StatusAnterior,
    string StatusNovo,
    string Comentario,
    string Tipo,
    DateTime EventoEm);

public sealed record DetalheDemandaDto(
    Guid Id,
    string Protocolo,
    PessoaDto Cessionario,
    string Descricao,
    string? Ponto,
    Guid CategoriaId,
    string Categoria,
    Guid SubcategoriaId,
    string Subcategoria,
    Guid AreaId,
    string Area,
    string Servico,
    string Destino,
    string Situacao,
    string Prioridade,
    string Confianca,
    string Classificacao,
    string Fluxo,
    PessoaDto? Responsavel,
    DateTime AbertoEm,
    DateTime AtualizadoEm,
    DateTime? PrevisaoAtendimento,
    IReadOnlyList<MensagemDto> Mensagens,
    IReadOnlyList<AnexoDto> Anexos,
    IReadOnlyList<HistoricoDto> Historico,
    int NaoLidas,
    string Natureza,
    int? NotaAvaliacao,
    string? ComentarioAvaliacao);

public sealed record ModeloAberturaDto(string? Assunto, string? Ponto, string? Periodo, IReadOnlyList<string> Itens);

public sealed record CategoriaDto(Guid Id, string Nome, bool Ativa, int? PrazoHoras, IReadOnlyList<SubcategoriaDto> Subcategorias, ModeloAberturaDto? Modelo);

public sealed record SubcategoriaDto(Guid Id, string Nome, Guid AreaId, string Fluxo, bool Ativa);

public sealed record AreaDto(Guid Id, string Nome, bool Ativa);

public sealed record ResponsavelDto(Guid Id, string Nome, string Email, Guid? AreaId, bool Ativo);

public sealed record CatalogoDto(
    IReadOnlyList<CategoriaDto> Categorias,
    IReadOnlyList<AreaDto> Areas,
    IReadOnlyList<ResponsavelDto> Responsaveis);

public sealed record DocumentoObraDto(Guid Id, string Nome, string Situacao, int Ordem);

public sealed record ObraDto(
    Guid Id,
    string Nome,
    string Local,
    string Descricao,
    DateOnly InicioPrevisto,
    DateOnly TerminoPrevisto,
    string EmpresaExecutora,
    string Responsavel,
    string Contato,
    string EtapaAtual,
    IReadOnlyList<string> Etapas,
    IReadOnlyList<DocumentoObraDto> Documentos);

public sealed record ItemAgendaDto(string Origem, Guid Id, string Titulo, string Situacao, string Marco, DateOnly Data);

public sealed record NotificacaoDto(Guid Id, Guid DemandaId, string Protocolo, string Texto, bool Lida, DateTime CriadaEm);

public sealed record ChavePushDto(string ChavePublica);

public sealed record InscricaoPushComando(string Endpoint, string ChaveP256dh, string SegredoAuth);

public sealed record NotificacaoPush(Guid UsuarioId, Guid NotificacaoId, Guid DemandaId, string Protocolo, string Texto, string? Url = null);

public sealed record PublicarComunicadoComando(string Titulo, string Texto, bool AvisarCelular);

public sealed record ComunicadoResumoDto(Guid Id, string Titulo, string Situacao, bool Lido, DateTime PublicadoEm);

public sealed record EventoComunicadoDto(Guid Id, string Autor, string Tipo, string Comentario, DateTime EventoEm);

public sealed record ComunicadoDetalheDto(
    Guid Id,
    string Titulo,
    string Texto,
    string Situacao,
    bool Lido,
    DateTime PublicadoEm,
    DateTime? EncerradoEm,
    IReadOnlyList<EventoComunicadoDto> Historico);

public sealed record AnexoConteudo(string Nome, string Tipo, Stream Conteudo);
