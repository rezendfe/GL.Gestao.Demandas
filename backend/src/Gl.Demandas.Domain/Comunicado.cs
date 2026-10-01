namespace Gl.Demandas.Domain;

public sealed class EventoComunicado
{
    public EventoComunicado(Guid id, Guid usuarioId, string tipo, string comentario, DateTime eventoEm)
    {
        Id = id;
        UsuarioId = usuarioId;
        Tipo = tipo;
        Comentario = comentario;
        EventoEm = eventoEm;
    }

    public Guid Id { get; }
    public Guid UsuarioId { get; }
    public string Tipo { get; }
    public string Comentario { get; }
    public DateTime EventoEm { get; }
}

public sealed class Comunicado
{
    private readonly List<EventoComunicado> _historico = [];
    private readonly HashSet<Guid> _leitores = [];

    private Comunicado()
    {
    }

    public Guid Id { get; private set; }
    public string Titulo { get; private set; } = "";
    public string Texto { get; private set; } = "";
    public bool Vigente { get; private set; }
    public DateTime PublicadoEm { get; private set; }
    public DateTime? EncerradoEm { get; private set; }
    public Guid AutorId { get; private set; }
    public IReadOnlyList<EventoComunicado> Historico => _historico;
    public IReadOnlySet<Guid> Leitores => _leitores;

    public string Situacao => Vigente ? "Vigente" : "Encerrado";

    public static Comunicado Publicar(Guid id, Guid autorId, string titulo, string texto, DateTime agora)
    {
        var comunicado = new Comunicado
        {
            Id = id,
            AutorId = autorId,
            Titulo = FormatoCampo.Texto(titulo, 2, 120, "O título tem de 2 a 120 caracteres."),
            Texto = FormatoCampo.Texto(texto, 2, 2000, "O texto tem de 2 a 2000 caracteres."),
            Vigente = true,
            PublicadoEm = agora
        };
        comunicado.Registrar(autorId, "PUBLICACAO", "Comunicado publicado.", agora);
        return comunicado;
    }

    public static Comunicado Carregar(
        Guid id,
        Guid autorId,
        string titulo,
        string texto,
        bool vigente,
        DateTime publicadoEm,
        DateTime? encerradoEm,
        IEnumerable<EventoComunicado> historico,
        IEnumerable<Guid> leitores)
    {
        var comunicado = new Comunicado
        {
            Id = id,
            AutorId = autorId,
            Titulo = titulo,
            Texto = texto,
            Vigente = vigente,
            PublicadoEm = publicadoEm,
            EncerradoEm = encerradoEm
        };
        comunicado._historico.AddRange(historico);
        foreach (var leitor in leitores)
            comunicado._leitores.Add(leitor);
        return comunicado;
    }

    public void Encerrar(Perfil perfil, Guid autorId, DateTime agora)
    {
        if (perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException("Quem publica e encerra o comunicado é o GL / Administrador.");
        if (!Vigente)
            throw new RegraNegocioException("Este comunicado já está encerrado.");
        Vigente = false;
        EncerradoEm = agora;
        Registrar(autorId, "ENCERRAMENTO", "Comunicado encerrado.", agora);
    }

    public void MarcarLido(Perfil perfil, Guid usuarioId, DateTime agora)
    {
        if (perfil != Perfil.Cessionario)
            throw new AcessoNegadoException("A leitura do comunicado é do Cessionário.");
        if (!Vigente)
            throw new RegraNegocioException("Comunicado encerrado não recebe leitura.");
        if (!_leitores.Add(usuarioId))
            return;
        Registrar(usuarioId, "LEITURA", "Leitura marcada.", agora);
    }

    private void Registrar(Guid usuarioId, string tipo, string comentario, DateTime agora) =>
        _historico.Add(new EventoComunicado(Guid.NewGuid(), usuarioId, tipo, comentario, agora));
}
