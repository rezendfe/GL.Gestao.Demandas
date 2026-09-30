using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Gl.Demandas.Infrastructure;

public static class TokenDemo
{
    public const string ChaveDesenvolvimento = "poc-dev-signing-key-change-me-32b!";
    public const string Emissor = "gl-demandas-poc";
    public const string Audiencia = "gl-demandas-portal";

    public static string ResolverChave(IConfiguration configuracao, bool desenvolvimento)
    {
        var chave = configuracao["Auth:SigningKey"];
        if (!string.IsNullOrWhiteSpace(chave))
            return chave;
        if (desenvolvimento)
            return ChaveDesenvolvimento;
        throw new InvalidOperationException("Defina Auth:SigningKey para publicar a POC em modo Demo.");
    }
}

public sealed class EmissorTokenDemo(string chave) : ITokenEmissor
{
    public string Emitir(Usuario usuario)
    {
        var credenciais = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chave)),
            SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new("name", usuario.Nome),
            new("perfil", PerfilTexto.ParaExibicao(usuario.Perfil))
        };
        if (usuario.AreaId is Guid area)
            claims.Add(new Claim("area", area.ToString()));

        var token = new JwtSecurityToken(
            TokenDemo.Emissor,
            TokenDemo.Audiencia,
            claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credenciais);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public sealed class RelogioSistema : IRelogio
{
    public DateTime UtcNow => DateTime.UtcNow;
}
