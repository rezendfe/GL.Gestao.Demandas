namespace Gl.Demandas.Domain;

public sealed class Notificacao
{
    public Notificacao(Guid id, Guid demandaId, Guid usuarioId, string texto, bool lida, DateTime criadaEm, Guid? mensagemId = null)
    {
        Id = id;
        DemandaId = demandaId;
        UsuarioId = usuarioId;
        Texto = texto;
        Lida = lida;
        CriadaEm = criadaEm;
        MensagemId = mensagemId;
    }

    public Guid Id { get; }
    public Guid DemandaId { get; }
    public Guid UsuarioId { get; }
    public string Texto { get; }
    public bool Lida { get; private set; }
    public DateTime CriadaEm { get; }
    public Guid? MensagemId { get; }

    public static Notificacao Criar(Guid demandaId, Guid usuarioId, string texto, DateTime agora, Guid? mensagemId = null) =>
        new(Guid.NewGuid(), demandaId, usuarioId, texto, false, agora, mensagemId);

    public void MarcarLida(Guid usuarioId)
    {
        if (usuarioId != UsuarioId)
            throw new AcessoNegadoException();

        Lida = true;
    }
}
