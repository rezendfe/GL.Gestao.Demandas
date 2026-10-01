namespace Gl.Demandas.Infrastructure.Persistence;

internal sealed class AreaRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public string Nome { get; set; } = "";
    public string Status { get; set; } = "ATIVO";
}

internal sealed class CategoriaRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public string Nome { get; set; } = "";
    public int? PrazoHoras { get; set; }
    public string? AssuntoSugerido { get; set; }
    public string? PontoSugerido { get; set; }
    public string? PeriodoSugerido { get; set; }
    public string? ItensSugeridos { get; set; }
    public string Status { get; set; } = "ATIVO";
}

internal sealed class SubcategoriaRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long CategoriaIdInterno { get; set; }
    public CategoriaRegistro? Categoria { get; set; }
    public long AreaIdInterno { get; set; }
    public AreaRegistro? Area { get; set; }
    public string Nome { get; set; } = "";
    public string Fluxo { get; set; } = "";
    public string Status { get; set; } = "ATIVO";
}

internal sealed class UsuarioRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string? IdentidadeEstavel { get; set; }
    public string? SenhaHash { get; set; }
    public string Perfil { get; set; } = "";
    public string? Empresa { get; set; }
    public string? Sala { get; set; }
    public string? LogoEmpresa { get; set; }
    public string? Foto { get; set; }
    public long? AreaIdInterno { get; set; }
    public AreaRegistro? Area { get; set; }
    public long? EmpresaCessionariaIdInterno { get; set; }
    public EmpresaCessionariaRegistro? EmpresaCessionaria { get; set; }
    public string Status { get; set; } = "ATIVO";
}

internal sealed class EmpresaCessionariaRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public string Nome { get; set; } = "";
    public string Status { get; set; } = "ATIVO";
    public string? Logo { get; set; }
}

internal sealed class RepresentanteContatoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long UsuarioIdInterno { get; set; }
    public UsuarioRegistro? Usuario { get; set; }
    public string Canal { get; set; } = "";
    public string Valor { get; set; } = "";
    public bool Principal { get; set; }
}

internal sealed class FuncaoCessionarioRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long EmpresaIdInterno { get; set; }
    public EmpresaCessionariaRegistro? Empresa { get; set; }
    public string Nome { get; set; } = "";
    public string Status { get; set; } = "ATIVO";
    public List<FuncaoPermissaoRegistro> Permissoes { get; set; } = [];
}

internal sealed class FuncaoPermissaoRegistro
{
    public long FuncaoIdInterno { get; set; }
    public FuncaoCessionarioRegistro? Funcao { get; set; }
    public string Permissao { get; set; } = "";
}

internal sealed class RepresentanteFuncaoRegistro
{
    public long UsuarioIdInterno { get; set; }
    public UsuarioRegistro? Usuario { get; set; }
    public long FuncaoIdInterno { get; set; }
    public FuncaoCessionarioRegistro? Funcao { get; set; }
}

internal sealed class EspacoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public string Codigo { get; set; } = "";
    public string Nome { get; set; } = "";
    public string Localizacao { get; set; } = "";
    public string Descricao { get; set; } = "";
    public string Status { get; set; } = "ATIVO";
    public List<LocacaoRegistro> Locacoes { get; set; } = [];
}

internal sealed class LocacaoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long EspacoIdInterno { get; set; }
    public EspacoRegistro? Espaco { get; set; }
    public long EmpresaIdInterno { get; set; }
    public EmpresaCessionariaRegistro? Empresa { get; set; }
    public DateOnly Inicio { get; set; }
    public DateOnly? Termino { get; set; }
}

internal sealed class RegraRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public string Termo { get; set; } = "";
    public long SubcategoriaIdInterno { get; set; }
    public SubcategoriaRegistro? Subcategoria { get; set; }
    public string Servico { get; set; } = "";
    public string Destino { get; set; } = "";
    public string Resumo { get; set; } = "";
    public string Prioridade { get; set; } = "";
    public int OrdemPrioridade { get; set; }
    public string Confianca { get; set; } = "";
    public int Ordem { get; set; }
}

internal sealed class DemandaRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public string Protocolo { get; set; } = "";
    public long CessionarioIdInterno { get; set; }
    public UsuarioRegistro? Cessionario { get; set; }
    public long EmpresaCessionariaIdInterno { get; set; }
    public EmpresaCessionariaRegistro? EmpresaCessionaria { get; set; }
    public string Empresa { get; set; } = "";
    public string Sala { get; set; } = "";
    public string Descricao { get; set; } = "";
    public string? Ponto { get; set; }
    public long CategoriaIdInterno { get; set; }
    public CategoriaRegistro? Categoria { get; set; }
    public long SubcategoriaIdInterno { get; set; }
    public SubcategoriaRegistro? Subcategoria { get; set; }
    public long AreaIdInterno { get; set; }
    public AreaRegistro? Area { get; set; }
    public long? ResponsavelIdInterno { get; set; }
    public UsuarioRegistro? Responsavel { get; set; }
    public string Servico { get; set; } = "";
    public string Destino { get; set; } = "";
    public string Situacao { get; set; } = "";
    public string Prioridade { get; set; } = "";
    public int OrdemPrioridade { get; set; }
    public string Confianca { get; set; } = "";
    public string Classificacao { get; set; } = "";
    public string Fluxo { get; set; } = "";
    public DateTime AbertoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
    public DateTime? PrevisaoAtendimento { get; set; }
    public string Natureza { get; set; } = "Serviço";
    public int? NotaAvaliacao { get; set; }
    public string? ComentarioAvaliacao { get; set; }
    public DateTime? AvaliadaEm { get; set; }
    public List<MensagemRegistro> Mensagens { get; set; } = [];
    public List<AnexoRegistro> Anexos { get; set; } = [];
    public List<HistoricoRegistro> Historico { get; set; } = [];
    public List<DecisaoRegistro> Decisoes { get; set; } = [];
}

internal sealed class MensagemRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long DemandaIdInterno { get; set; }
    public DemandaRegistro? Demanda { get; set; }
    public long AutorIdInterno { get; set; }
    public UsuarioRegistro? Autor { get; set; }
    public string Texto { get; set; } = "";
    public string Canal { get; set; } = "";
    public string Finalidade { get; set; } = "mensagem";
    public DateTime EnviadaEm { get; set; }
}

internal sealed class AnexoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long DemandaIdInterno { get; set; }
    public DemandaRegistro? Demanda { get; set; }
    public string Nome { get; set; } = "";
    public string Caminho { get; set; } = "";
    public string Tipo { get; set; } = "";
    public long Tamanho { get; set; }
    public DateTime EnviadoEm { get; set; }
}

internal sealed class HistoricoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long DemandaIdInterno { get; set; }
    public DemandaRegistro? Demanda { get; set; }
    public long UsuarioIdInterno { get; set; }
    public UsuarioRegistro? Usuario { get; set; }
    public string? StatusAnterior { get; set; }
    public string StatusNovo { get; set; } = "";
    public string Comentario { get; set; } = "";
    public string TipoEvento { get; set; } = "";
    public DateTime EventoEm { get; set; }
}

internal sealed class DecisaoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long DemandaIdInterno { get; set; }
    public DemandaRegistro? Demanda { get; set; }
    public long UsuarioIdInterno { get; set; }
    public UsuarioRegistro? Usuario { get; set; }
    public string Decisao { get; set; } = "";
    public string? Motivo { get; set; }
    public DateTime DecididaEm { get; set; }
}

internal sealed class ObraRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public string Nome { get; set; } = "";
    public string Local { get; set; } = "";
    public string Descricao { get; set; } = "";
    public DateOnly InicioPrevisto { get; set; }
    public DateOnly TerminoPrevisto { get; set; }
    public string EmpresaExecutora { get; set; } = "";
    public string Responsavel { get; set; } = "";
    public string Contato { get; set; } = "";
    public string Etapa { get; set; } = "";
    public List<DocumentoObraRegistro> Documentos { get; set; } = [];
}

internal sealed class DocumentoObraRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long ObraIdInterno { get; set; }
    public ObraRegistro? Obra { get; set; }
    public string Nome { get; set; } = "";
    public string Situacao { get; set; } = "";
    public int Ordem { get; set; }
}

internal sealed class ComunicadoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long AutorIdInterno { get; set; }
    public UsuarioRegistro? Autor { get; set; }
    public string Titulo { get; set; } = "";
    public string Texto { get; set; } = "";
    public bool Vigente { get; set; }
    public DateTime PublicadoEm { get; set; }
    public DateTime? EncerradoEm { get; set; }
    public List<ComunicadoEventoRegistro> Eventos { get; set; } = [];
    public List<ComunicadoLeituraRegistro> Leituras { get; set; } = [];
}

internal sealed class ComunicadoEventoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long ComunicadoIdInterno { get; set; }
    public ComunicadoRegistro? Comunicado { get; set; }
    public long UsuarioIdInterno { get; set; }
    public UsuarioRegistro? Usuario { get; set; }
    public string Tipo { get; set; } = "";
    public string Comentario { get; set; } = "";
    public DateTime EventoEm { get; set; }
}

internal sealed class ComunicadoLeituraRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long ComunicadoIdInterno { get; set; }
    public ComunicadoRegistro? Comunicado { get; set; }
    public long UsuarioIdInterno { get; set; }
    public UsuarioRegistro? Usuario { get; set; }
    public DateTime LidaEm { get; set; }
}

internal sealed class NotificacaoRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long DemandaIdInterno { get; set; }
    public DemandaRegistro? Demanda { get; set; }
    public long UsuarioIdInterno { get; set; }
    public UsuarioRegistro? Usuario { get; set; }
    public string Texto { get; set; } = "";
    public string Leitura { get; set; } = "NAO_LIDA";
    public DateTime CriadaEm { get; set; }
}

internal sealed class InscricaoPushRegistro
{
    public long IdInterno { get; set; }
    public Guid Id { get; set; }
    public long UsuarioIdInterno { get; set; }
    public UsuarioRegistro? Usuario { get; set; }
    public string Endpoint { get; set; } = "";
    public string EndpointHash { get; set; } = "";
    public string ChaveP256dh { get; set; } = "";
    public string SegredoAuth { get; set; } = "";
    public DateTime CriadaEm { get; set; }
}

internal sealed class EtapaCadeiaRegistro
{
    public long IdInterno { get; set; }
    public long SubcategoriaIdInterno { get; set; }
    public SubcategoriaRegistro? Subcategoria { get; set; }
    public string Codigo { get; set; } = "";
    public string Nome { get; set; } = "";
    public int Ordem { get; set; }
    public bool Automatica { get; set; }
    public string Campos { get; set; } = "";
}
