using Microsoft.Extensions.DependencyInjection;

namespace Gl.Demandas.Application;

public static class Dependencias
{
    public static IServiceCollection AddAplicacao(this IServiceCollection services)
    {
        services.AddScoped<LoginAplicacao>();
        services.AddScoped<CatalogoAplicacao>();
        services.AddScoped<CatalogoAdministracaoAplicacao>();
        services.AddScoped<AtendimentoAplicacao>();
        services.AddScoped<CadeiaAplicacao>();
        services.AddScoped<ObrasAplicacao>();
        services.AddScoped<AgendaAplicacao>();
        services.AddScoped<NotificacaoAplicacao>();
        services.AddScoped<EspacosAplicacao>();
        services.AddScoped<GestaoCessionariosAplicacao>();
        return services;
    }
}
