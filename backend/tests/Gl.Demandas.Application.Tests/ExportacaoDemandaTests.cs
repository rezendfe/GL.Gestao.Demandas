using System.Text;
using Gl.Demandas.Application;

namespace Gl.Demandas.Application.Tests;

public sealed class ExportacaoDemandaTests
{
    [Fact]
    public void Planilha_e_pdf_trazem_os_campos_do_protocolo()
    {
        var linha = new LinhaExportacao(
            "GL-2026-00128",
            "Empresa Exemplo",
            "Sala 205",
            "Manutenção",
            "Novo",
            "Água no teto; perto da janela");

        var csv = Encoding.UTF8.GetString(ExportacaoDemanda.Planilha([linha]));
        Assert.StartsWith("protocolo;empresa;local;categoria;situacao;descricao", csv.TrimStart('\uFEFF'));
        Assert.Contains("GL-2026-00128;Empresa Exemplo;Sala 205;Manutenção;Novo;", csv);
        Assert.Contains("\"Água no teto; perto da janela\"", csv);

        var pdf = Encoding.Latin1.GetString(ExportacaoDemanda.Protocolo(linha));
        Assert.StartsWith("%PDF", pdf);
        Assert.Contains("GL-2026-00128", pdf);
        Assert.Contains("Empresa Exemplo", pdf);
        Assert.Contains("Sala 205", pdf);
        Assert.Contains("Manutenção", pdf);
        Assert.Contains("Novo", pdf);
        Assert.Contains("Água no teto", pdf);
    }
}
