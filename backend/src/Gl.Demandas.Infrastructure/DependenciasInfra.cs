using Gl.Demandas.Application;
using Gl.Demandas.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Gl.Demandas.Infrastructure;

public static class DependenciasInfra
{
    public static IServiceCollection AddInfraestrutura(this IServiceCollection services, IConfiguration configuracao, bool desenvolvimento)
    {
        var provedor = configuracao["Database:Provider"] ?? "SqlServer";
        if (!string.Equals(provedor, "SqlServer", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("A API usa somente o SQL Server do catálogo gl-demandas.");

        var conexaoSql = configuracao.GetConnectionString("Sql");
        if (string.IsNullOrWhiteSpace(conexaoSql))
            throw new InvalidOperationException("Defina ConnectionStrings:Sql para o catálogo gl-demandas.");

        services.AddDbContext<AppDbContext>(o => o.UseSqlServer(conexaoSql));

        services.AddScoped<GlRepositorio>();
        services.AddScoped<IUsuarios>(sp => sp.GetRequiredService<GlRepositorio>());
        services.AddScoped<ICatalogo>(sp => sp.GetRequiredService<GlRepositorio>());
        services.AddScoped<IDemandas>(sp => sp.GetRequiredService<GlRepositorio>());
        services.AddScoped<IObras>(sp => sp.GetRequiredService<GlRepositorio>());
        services.AddScoped<INotificacoes>(sp => sp.GetRequiredService<GlRepositorio>());
        services.AddScoped<ICadeia>(sp => sp.GetRequiredService<GlRepositorio>());
        services.AddScoped<IInventarioEspacos>(sp => sp.GetRequiredService<GlRepositorio>());
        services.AddScoped<IGestaoCessionarios>(sp => sp.GetRequiredService<GlRepositorio>());
        services.AddScoped<IClassificadorDemanda, ClassificadorDemanda>();
        services.AddHttpClient<IExtratorSolicitacao, ExtratorOpenAi>(cliente =>
        {
            cliente.BaseAddress = new Uri("https://api.openai.com/v1/");
            cliente.Timeout = TimeSpan.FromSeconds(25);
        });
        services.AddSingleton<IRelogio, RelogioSistema>();

        if (string.Equals(configuracao["Anexo:Provider"], "Blob", StringComparison.OrdinalIgnoreCase))
        {
            var conexao = configuracao["Anexo:ConnectionString"]
                ?? throw new InvalidOperationException("Defina Anexo:ConnectionString.");
            var container = configuracao["Anexo:Container"] ?? "anexos";
            services.AddSingleton<IAnexoStorage>(_ => new ArmazenamentoBlob(conexao, container));
        }
        else
        {
            var pasta = configuracao["Anexo:Pasta"] ?? "anexos-dev";
            services.AddSingleton<IAnexoStorage>(_ => new ArmazenamentoLocal(Path.GetFullPath(pasta)));
        }

        if (!string.Equals(configuracao["Auth:Mode"], "Entra", StringComparison.OrdinalIgnoreCase))
        {
            var chave = TokenDemo.ResolverChave(configuracao, desenvolvimento);
            services.AddSingleton<ITokenEmissor>(_ => new EmissorTokenDemo(chave));
        }
        else
        {
            services.AddSingleton<ITokenEmissor>(_ => throw new InvalidOperationException("Login demo está desligado quando Auth:Mode=Entra."));
        }

        return services;
    }
}
