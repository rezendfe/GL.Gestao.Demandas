using System.IO.Compression;
using System.Text;

namespace Gl.Demandas.Api;

static class ArquivosDemonstracao
{
    public static async Task Garantir(string pastaSeed)
    {
        Directory.CreateDirectory(pastaSeed);
        await GravarSePequeno(Path.Combine(pastaSeed, "Projeto_Fibra.pdf"), Pdf("Projeto de fibra da loja. Documento de demonstracao."));
        await Gravar(Path.Combine(pastaSeed, "Memorial_Loja.docx"), Docx("Memorial da loja para locacao no shopping. Fachada, interior e area informados na ficha."));
        await Gravar(Path.Combine(pastaSeed, "Planilha_Areas.xlsx"), Xlsx());
        await Gravar(Path.Combine(pastaSeed, "Recado_Loja.wav"), Wav());
        var origem = Path.Combine(AppContext.BaseDirectory, "Demo", "vitrine-loja.jpg");
        var destino = Path.Combine(pastaSeed, "Vitrine_Loja.jpg");
        if (File.Exists(origem) && (!File.Exists(destino) || File.GetLastWriteTimeUtc(origem) > File.GetLastWriteTimeUtc(destino)))
            File.Copy(origem, destino, true);
    }

    private static async Task Gravar(string caminho, byte[] conteudo)
    {
        if (!File.Exists(caminho))
            await File.WriteAllBytesAsync(caminho, conteudo);
    }

    private static async Task GravarSePequeno(string caminho, byte[] conteudo)
    {
        if (!File.Exists(caminho) || new FileInfo(caminho).Length < 400)
            await File.WriteAllBytesAsync(caminho, conteudo);
    }

    private static byte[] Pdf(string texto)
    {
        var seguro = texto.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
        var fluxo = $"BT /F1 16 Tf 40 140 Td ({seguro}) Tj ET";
        var objetos = new[]
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 480 240] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
            $"<< /Length {Encoding.ASCII.GetByteCount(fluxo)} >>\nstream\n{fluxo}\nendstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
        };
        var corpo = new StringBuilder("%PDF-1.4\n");
        var offsets = new int[objetos.Length + 1];
        for (var i = 0; i < objetos.Length; i++)
        {
            offsets[i + 1] = Encoding.ASCII.GetByteCount(corpo.ToString());
            corpo.Append(i + 1).Append(" 0 obj\n").Append(objetos[i]).Append("\nendobj\n");
        }
        var xref = Encoding.ASCII.GetByteCount(corpo.ToString());
        corpo.Append("xref\n0 ").Append(objetos.Length + 1).Append("\n");
        corpo.Append("0000000000 65535 f \n");
        for (var i = 1; i <= objetos.Length; i++)
            corpo.Append(offsets[i].ToString("D10")).Append(" 00000 n \n");
        corpo.Append("trailer << /Size ").Append(objetos.Length + 1).Append(" /Root 1 0 R >>\nstartxref\n");
        corpo.Append(xref).Append("\n%%EOF");
        return Encoding.ASCII.GetBytes(corpo.ToString());
    }

    private static byte[] Docx(string texto)
    {
        using var memoria = new MemoryStream();
        using (var zip = new ZipArchive(memoria, ZipArchiveMode.Create, true))
        {
            Escrever(zip, "[Content_Types].xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                  <Default Extension="xml" ContentType="application/xml"/>
                  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
                </Types>
                """);
            Escrever(zip, "_rels/.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
                </Relationships>
                """);
            Escrever(zip, "word/document.xml", $"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                  <w:body><w:p><w:r><w:t>{System.Security.SecurityElement.Escape(texto)}</w:t></w:r></w:p></w:body>
                </w:document>
                """);
        }
        return memoria.ToArray();
    }

    private static byte[] Xlsx()
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
                  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
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
                  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
                </Relationships>
                """);
            Escrever(zip, "xl/workbook.xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                  <sheets><sheet name="Lojas" sheetId="1" r:id="rId1"/></sheets>
                </workbook>
                """);
            Escrever(zip, "xl/sharedStrings.xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6">
                  <si><t>Loja</t></si><si><t>Uso</t></si><si><t>Area m2</t></si>
                  <si><t>Loja 205</t></si><si><t>Moda</t></si><si><t>86</t></si>
                </sst>
                """);
            Escrever(zip, "xl/worksheets/sheet1.xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
                  <sheetData>
                    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>
                    <row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c><c r="C2" t="s"><v>5</v></c></row>
                  </sheetData>
                </worksheet>
                """);
        }
        return memoria.ToArray();
    }

    private static byte[] Wav()
    {
        const int taxa = 8000;
        const int amostras = 9600;
        var pcm = new byte[amostras * 2];
        for (var i = 0; i < amostras; i++)
        {
            var valor = (short)(Math.Sin(2 * Math.PI * 440 * i / taxa) * 7000);
            pcm[i * 2] = (byte)(valor & 0xff);
            pcm[i * 2 + 1] = (byte)((valor >> 8) & 0xff);
        }
        using var memoria = new MemoryStream();
        using var escrita = new BinaryWriter(memoria);
        escrita.Write("RIFF"u8);
        escrita.Write(36 + pcm.Length);
        escrita.Write("WAVEfmt "u8);
        escrita.Write(16);
        escrita.Write((short)1);
        escrita.Write((short)1);
        escrita.Write(taxa);
        escrita.Write(taxa * 2);
        escrita.Write((short)2);
        escrita.Write((short)16);
        escrita.Write("data"u8);
        escrita.Write(pcm.Length);
        escrita.Write(pcm);
        return memoria.ToArray();
    }

    private static void Escrever(ZipArchive zip, string nome, string conteudo)
    {
        var item = zip.CreateEntry(nome);
        using var fluxo = item.Open();
        using var escritor = new StreamWriter(fluxo, new UTF8Encoding(false));
        escritor.Write(conteudo);
    }
}
