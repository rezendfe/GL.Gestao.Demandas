using Gl.Demandas.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace Gl.Demandas.Application.Tests;

internal sealed class BancoDeTeste : IAsyncDisposable, IDisposable
{
    public AppDbContext Contexto { get; }

    public BancoDeTeste()
    {
        var nome = "gldtest_" + Guid.NewGuid().ToString("N");
        Contexto = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(ConexaoPara(nome)).Options);
        Contexto.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Contexto.Database.EnsureDeleted();
        Contexto.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        await Contexto.Database.EnsureDeletedAsync();
        await Contexto.DisposeAsync();
    }

    private static string ConexaoPara(string catalogo)
    {
        var informada = Environment.GetEnvironmentVariable("GL_TEST_SQL");
        var baseCs = string.IsNullOrWhiteSpace(informada)
            ? @"Server=(localdb)\MSSQLLocalDB;Integrated Security=true;TrustServerCertificate=True"
            : informada;
        var builder = new SqlConnectionStringBuilder(baseCs);
        if (builder.DataSource.Contains("smartezy.database.windows.net", StringComparison.OrdinalIgnoreCase)
            || string.Equals(builder.InitialCatalog, "gl-demandas", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Os testes usam um SQL Server isolado. O catálogo gl-demandas não entra nessa execução.");

        builder.InitialCatalog = catalogo;
        return builder.ConnectionString;
    }
}
