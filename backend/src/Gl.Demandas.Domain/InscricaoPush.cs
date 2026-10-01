namespace Gl.Demandas.Domain;

public sealed class InscricaoPush
{
    public InscricaoPush(Guid id, Guid usuarioId, string endpoint, string chaveP256dh, string segredoAuth, DateTime criadaEm)
    {
        if (usuarioId == Guid.Empty)
            throw new RegraNegocioException("A inscrição deste aparelho precisa de um usuário.");
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var endereco) || endereco.Scheme != Uri.UriSchemeHttps || endpoint.Length > 2000)
            throw new RegraNegocioException("A inscrição deste aparelho é inválida.");
        if (string.IsNullOrWhiteSpace(chaveP256dh) || chaveP256dh.Length > 200
            || string.IsNullOrWhiteSpace(segredoAuth) || segredoAuth.Length > 200)
            throw new RegraNegocioException("A inscrição deste aparelho é inválida.");

        Id = id;
        UsuarioId = usuarioId;
        Endpoint = endpoint;
        ChaveP256dh = chaveP256dh;
        SegredoAuth = segredoAuth;
        CriadaEm = criadaEm;
    }

    public Guid Id { get; }
    public Guid UsuarioId { get; }
    public string Endpoint { get; }
    public string ChaveP256dh { get; }
    public string SegredoAuth { get; }
    public DateTime CriadaEm { get; }

    public static InscricaoPush Criar(Guid usuarioId, string endpoint, string chaveP256dh, string segredoAuth, DateTime agora) =>
        new(Guid.NewGuid(), usuarioId, endpoint.Trim(), chaveP256dh.Trim(), segredoAuth.Trim(), agora);
}
