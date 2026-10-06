using System.Globalization;
using System.IO.Compression;
using System.Text;

namespace Gl.Demandas.Application;

public static class PlanilhaAuditoria
{
    private static readonly string[] Colunas = ["Quando", "Pessoa", "Perfil", "Ação", "Referência", "Situação anterior", "Situação nova", "Comentário", "Origem"];

    private static readonly Dictionary<string, string> Rotulos = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ABERTURA"] = "Abriu o chamado",
        ["RECLAMACAO"] = "Registrou reclamação",
        ["CLASSIFICACAO"] = "Classificou o atendimento",
        ["REDIRECIONAMENTO"] = "Direcionou o atendimento",
        ["ANDAMENTO"] = "Atualizou o andamento",
        ["VALIDACAO"] = "Validou o atendimento",
        ["CADEIA"] = "Avançou na cadeia",
        ["PREVISAO"] = "Definiu a previsão",
        ["AVALIACAO"] = "Avaliou o atendimento",
        ["MENSAGEM"] = "Enviou uma mensagem",
        ["ANEXO"] = "Anexou um documento",
        ["ENCERRAMENTO"] = "Encerrou",
        ["CANCELAMENTO"] = "Cancelou o chamado",
        ["APROVACAO"] = "Registrou uma decisão",
        ["NOTIFICACAO"] = "Registrou uma notificação",
        ["PUBLICACAO"] = "Publicou um comunicado",
        ["LEITURA"] = "Leu um comunicado"
    };

    public static byte[] Gerar(IReadOnlyList<LinhaAuditoria> linhas)
    {
        using var memoria = new MemoryStream();
        using (var zip = new ZipArchive(memoria, ZipArchiveMode.Create, true))
        {
            Escrever(zip, "[Content_Types].xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                  <Default Extension="xml" ContentType="application/xml"/>
                  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
                  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
                </Types>
                """);
            Escrever(zip, "_rels/.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
                </Relationships>
                """);
            Escrever(zip, "xl/_rels/workbook.xml.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
                </Relationships>
                """);
            Escrever(zip, "xl/workbook.xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                  <sheets><sheet name="Auditoria" sheetId="1" r:id="rId1"/></sheets>
                </workbook>
                """);
            Escrever(zip, "xl/worksheets/sheet1.xml", Planilha(linhas));
        }

        return memoria.ToArray();
    }

    private static string Planilha(IReadOnlyList<LinhaAuditoria> linhas)
    {
        var xml = new StringBuilder();
        xml.Append("""
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
            """);
        xml.Append(Linha(1, Colunas));
        for (var i = 0; i < linhas.Count; i++)
        {
            var linha = linhas[i];
            xml.Append(Linha(i + 2,
            [
                Quando(linha.EventoEm),
                linha.Autor,
                linha.Perfil,
                Rotulos.TryGetValue(linha.Tipo, out var rotulo) ? rotulo : "Registrou uma ação",
                linha.Referencia,
                linha.StatusAnterior ?? "",
                linha.StatusNovo,
                linha.Comentario,
                linha.Origem == "comunicado" ? "Comunicado" : "Chamado"
            ]));
        }

        xml.Append("</sheetData></worksheet>");
        return xml.ToString();
    }

    private static string Linha(int numero, IReadOnlyList<string> valores)
    {
        var xml = new StringBuilder();
        xml.Append("<row r=\"").Append(numero).Append("\">");
        for (var i = 0; i < valores.Count; i++)
        {
            var celula = Coluna(i) + numero;
            xml.Append("<c r=\"").Append(celula).Append("\" t=\"inlineStr\"><is><t xml:space=\"preserve\">");
            xml.Append(Escapar(valores[i]));
            xml.Append("</t></is></c>");
        }

        xml.Append("</row>");
        return xml.ToString();
    }

    private static string Quando(DateTime eventoEm)
    {
        var zona = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        var utc = DateTime.SpecifyKind(eventoEm, DateTimeKind.Utc);
        var local = TimeZoneInfo.ConvertTimeFromUtc(utc, zona);
        return local.ToString("dd/MM/yyyy HH:mm", CultureInfo.GetCultureInfo("pt-BR"));
    }

    private static string Coluna(int indice)
    {
        var nome = "";
        var numero = indice + 1;
        while (numero > 0)
        {
            numero--;
            nome = (char)('A' + numero % 26) + nome;
            numero /= 26;
        }

        return nome;
    }

    private static string Escapar(string? valor)
    {
        if (string.IsNullOrEmpty(valor))
            return "";

        var limpo = new string(valor.Where(caractere => caractere is '\t' or '\n' or '\r' || caractere >= ' ').ToArray());
        return System.Security.SecurityElement.Escape(limpo) ?? "";
    }

    private static void Escrever(ZipArchive zip, string caminho, string conteudo)
    {
        var entrada = zip.CreateEntry(caminho, CompressionLevel.Fastest);
        using var escrita = new StreamWriter(entrada.Open(), new UTF8Encoding(false));
        escrita.Write(conteudo);
    }
}
