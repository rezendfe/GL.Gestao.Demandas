using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class LoginAplicacao(IUsuarios usuarios, ITokenEmissor token)
{
    public async Task<LoginResultadoDto> Entrar(string email, string senha, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(senha))
            throw new RegraNegocioException("Informe e-mail e senha.");

        var usuario = await usuarios.ObterPorEmail(email.Trim().ToLowerInvariant(), ct);
        if (usuario is null || usuario.SenhaHash != SenhaDemo.Hash(senha))
            throw new RegraNegocioException("E-mail ou senha não conferem.");

        return new LoginResultadoDto(token.Emitir(usuario), Mapear(usuario));
    }

    public async Task<UsuarioSessaoDto> Eu(Ator ator, CancellationToken ct)
    {
        var usuario = await usuarios.Obter(ator.Id, ct) ?? throw new NaoEncontradaException("Usuário não encontrado.");
        return Mapear(usuario);
    }

    public static UsuarioSessaoDto Mapear(Usuario usuario) =>
        new(
            usuario.Id,
            usuario.Nome,
            usuario.Email,
            PerfilTexto.ParaExibicao(usuario.Perfil),
            usuario.AreaId,
            usuario.Empresa,
            usuario.Sala,
            usuario.LogoEmpresa,
            usuario.Foto);
}
