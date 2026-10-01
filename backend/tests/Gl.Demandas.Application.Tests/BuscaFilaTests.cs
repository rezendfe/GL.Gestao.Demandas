using Gl.Demandas.Domain;

namespace Gl.Demandas.Application.Tests;

public sealed class BuscaFilaTests
{
    [Fact]
    public void Encontra_protocolo_empresa_e_espaco_somente_na_fila_autorizada()
    {
        var autorizada = new[]
        {
            ("GL-2026-00120", "Empresa Exemplo", "Sala 205"),
        };
        var outraEmpresa = ("GL-2026-00999", "Empresa B", "Sala 102");

        Assert.True(BuscaFila.Corresponde("GL-2026-00120", "Empresa Exemplo", "Sala 205", "00120"));
        Assert.True(BuscaFila.Corresponde("GL-2026-00120", "Empresa Exemplo", "Sala 205", "empresa exemplo"));
        Assert.True(BuscaFila.Corresponde("GL-2026-00120", "Empresa Exemplo", "Sala 205", "sala 205"));
        Assert.False(BuscaFila.Corresponde("GL-2026-00120", "Empresa Exemplo", "Sala 205", "infiltração"));

        Assert.Single(BuscaFila.DentroDaFila(autorizada, item => item.Item1, item => item.Item2, item => item.Item3, "Sala 205"));
        Assert.Empty(BuscaFila.DentroDaFila(autorizada, item => item.Item1, item => item.Item2, item => item.Item3, "Empresa B"));
        Assert.Single(BuscaFila.DentroDaFila(autorizada.Append(outraEmpresa), item => item.Item1, item => item.Item2, item => item.Item3, "Empresa B"));
    }
}
