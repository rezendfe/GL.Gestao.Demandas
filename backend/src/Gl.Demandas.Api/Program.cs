using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Threading.RateLimiting;
using Gl.Demandas.Api;
using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure;
using Gl.Demandas.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);
var desenvolvimento = builder.Environment.IsDevelopment();
var modoEntra = string.Equals(builder.Configuration["Auth:Mode"], "Entra", StringComparison.OrdinalIgnoreCase);

builder.Services.AddAplicacao();
builder.Services.AddInfraestrutura(builder.Configuration, desenvolvimento);
builder.Services.AddHealthChecks();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    var origens = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"];
    p.WithOrigins(origens).AllowAnyHeader().AllowAnyMethod();
}));

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
var autenticacao = builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme);
if (modoEntra)
{
    var instancia = builder.Configuration["Auth:Entra:Instance"] ?? "https://login.microsoftonline.com/";
    var tenant = builder.Configuration["Auth:Entra:TenantId"] ?? throw new InvalidOperationException("Defina Auth:Entra:TenantId.");
    autenticacao.AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.Authority = $"{instancia.TrimEnd('/')}/{tenant}/v2.0";
        o.Audience = builder.Configuration["Auth:Entra:Audience"];
    });
}
else
{
    var chave = TokenDemo.ResolverChave(builder.Configuration, desenvolvimento);
    autenticacao.AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = TokenDemo.Emissor,
            ValidateAudience = true,
            ValidAudience = TokenDemo.Audiencia,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chave)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
}

builder.Services.AddAuthorization();
if (!desenvolvimento)
{
    builder.Services.AddRateLimiter(o =>
    {
        o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
            RateLimitPartition.GetFixedWindowLimiter(
                ctx.Connection.RemoteIpAddress?.ToString() ?? "local",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    Window = TimeSpan.FromMinutes(1)
                }));
    });
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GL Demandas — POC Riocentro",
        Version = "v1",
        Description = """
            API da prova de conceito de gestão de demandas GL Eventos / Riocentro.
            Rotas autenticadas usam o JWT devolvido por POST /api/auth/login. No botão Authorize, informe só o token.
            Contas de demonstração, senha Demo@2026: joao.silva@empresaexemplo.com.br (Cessionário), patricia.lima@gleventos.com.br (GL / Administrador) e responsavel.01@gleventos.com.br (Responsável da Área).
            """
    });
    c.OperationFilter<SegurancaAnonimaFilter>();
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT do login demo ou do Entra ID."
    });
    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

var app = builder.Build();

app.Use(async (ctx, next) =>
{
    try
    {
        await next();
    }
    catch (AcessoNegadoException ex)
    {
        await Erro(ctx, StatusCodes.Status403Forbidden, "acesso_negado", ex.Message);
    }
    catch (NaoEncontradaException ex)
    {
        await Erro(ctx, StatusCodes.Status404NotFound, "nao_encontrado", ex.Message);
    }
    catch (TransicaoInvalidaException ex)
    {
        await Erro(ctx, StatusCodes.Status422UnprocessableEntity, "transicao_invalida", ex.Message);
    }
    catch (RegraNegocioException ex)
    {
        await Erro(ctx, StatusCodes.Status400BadRequest, "regra_negocio", ex.Message);
    }
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
if (!desenvolvimento)
    app.UseRateLimiter();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GL Demandas v1");
    c.RoutePrefix = "swagger";
    c.EnablePersistAuthorization();
});

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.MapGet("/health", async (HealthCheckService health, CancellationToken ct) =>
{
    var relatorio = await health.CheckHealthAsync(ct);
    var saudavel = relatorio.Status == HealthStatus.Healthy;
    return Results.Text(relatorio.Status.ToString(), "text/plain", statusCode: saudavel ? StatusCodes.Status200OK : StatusCodes.Status503ServiceUnavailable);
})
    .WithName("Health")
    .WithTags("Sistema")
    .WithSummary("Verifica se a API está no ar.")
    .AllowAnonymous();
app.MapGlEndpoints();

await PrepararDadosAsync(app);

app.Run();

static async Task Erro(HttpContext ctx, int status, string codigo, string mensagem)
{
    ctx.Response.StatusCode = status;
    await ctx.Response.WriteAsJsonAsync(new { codigo, mensagem });
}

static async Task PrepararDadosAsync(WebApplication app)
{
    await using var escopo = app.Services.CreateAsyncScope();
    var db = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!string.Equals(app.Configuration["Database:Provider"], "SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        db.Database.EnsureCreated();
        DemoSeed.Aplicar(db, DateTime.UtcNow);
        DemoSeed.GarantirCadeia(db);
    }

    var pasta = Path.GetFullPath(app.Configuration["Anexo:Pasta"] ?? "anexos-dev");
    var seed = Path.Combine(pasta, "seed");
    Directory.CreateDirectory(seed);
    var pdf = Path.Combine(seed, "Projeto_Fibra.pdf");
    if (!File.Exists(pdf))
    {
        await File.WriteAllTextAsync(pdf, "%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    }
}

file sealed class SegurancaAnonimaFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var anonima = context.ApiDescription.ActionDescriptor.EndpointMetadata.OfType<IAllowAnonymous>().Any();
        if (anonima)
            operation.Security = [];
    }
}
