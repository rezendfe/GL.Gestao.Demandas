using Gl.Demandas.Application;
using Microsoft.Extensions.Configuration;

namespace Gl.Demandas.Infrastructure.WhatsApp;

public sealed class EnderecoPortal(IConfiguration configuracao) : IEnderecoPortal
{
    public string? BaseUrl => configuracao["Portal:PublicUrl"];
}
