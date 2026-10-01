using System.Text;

namespace Gl.Demandas.Application;

public sealed record LinhaExportacao(
    string Protocolo,
    string Empresa,
    string Local,
    string Categoria,
    string Situacao,
    string Descricao);

public sealed record ArquivoExportado(string Nome, string Tipo, byte[] Conteudo);

public static class ExportacaoDemanda
{
    private static readonly Encoding Latino = Encoding.Latin1;

    public static byte[] Planilha(IReadOnlyList<LinhaExportacao> linhas)
    {
        var texto = new StringBuilder();
        texto.Append("protocolo;empresa;local;categoria;situacao;descricao\r\n");
        foreach (var linha in linhas)
        {
            texto.Append(Celula(linha.Protocolo)).Append(';')
                .Append(Celula(linha.Empresa)).Append(';')
                .Append(Celula(linha.Local)).Append(';')
                .Append(Celula(linha.Categoria)).Append(';')
                .Append(Celula(linha.Situacao)).Append(';')
                .Append(Celula(linha.Descricao)).Append("\r\n");
        }

        return new UTF8Encoding(encoderShouldEmitUTF8Identifier: true).GetBytes(texto.ToString());
    }

    public static byte[] Protocolo(LinhaExportacao linha)
    {
        var blocos = new (string Rotulo, string Valor)[]
        {
            ("Protocolo", linha.Protocolo),
            ("Empresa", linha.Empresa),
            ("Local", linha.Local),
            ("Categoria", linha.Categoria),
            ("Situação", linha.Situacao),
            ("Descrição", linha.Descricao),
        };
        var linhas = new List<string>();
        foreach (var bloco in blocos)
        {
            linhas.Add(bloco.Rotulo);
            linhas.AddRange(Quebrar(bloco.Valor, 85));
            linhas.Add("");
        }

        var paginas = new List<byte[]>();
        var atual = new List<string>();
        foreach (var item in linhas)
        {
            if (atual.Count >= 42)
            {
                paginas.Add(Pagina(atual));
                atual = [];
            }
            atual.Add(item);
        }
        paginas.Add(Pagina(atual));
        return Documento(paginas);
    }

    private static string Celula(string valor)
    {
        var texto = (valor ?? "").Replace("\r\n", " ").Replace('\r', ' ').Replace('\n', ' ');
        if (texto.Contains(';') || texto.Contains('"'))
            return $"\"{texto.Replace("\"", "\"\"")}\"";
        return texto;
    }

    private static IEnumerable<string> Quebrar(string valor, int largura)
    {
        var texto = string.IsNullOrWhiteSpace(valor) ? "—" : valor.Replace("\r\n", " ").Replace('\r', ' ').Replace('\n', ' ').Trim();
        if (texto.Length <= largura)
        {
            yield return texto;
            yield break;
        }

        var resto = texto;
        while (resto.Length > largura)
        {
            var corte = resto.LastIndexOf(' ', largura);
            if (corte < 20) corte = largura;
            yield return resto[..corte].TrimEnd();
            resto = resto[corte..].TrimStart();
        }
        if (resto.Length > 0) yield return resto;
    }

    private static byte[] Pagina(IReadOnlyList<string> linhas)
    {
        var comandos = new StringBuilder();
        comandos.Append("BT /F1 11 Tf 48 800 Td ");
        for (var i = 0; i < linhas.Count; i++)
        {
            if (i > 0) comandos.Append("0 -16 Td ");
            comandos.Append('(').Append(Escapar(linhas[i])).Append(") Tj ");
        }
        comandos.Append("ET");
        return Latino.GetBytes(comandos.ToString());
    }

    private static string Escapar(string valor)
    {
        var bytes = Latino.GetBytes(valor ?? "");
        var texto = new StringBuilder();
        foreach (var b in bytes)
        {
            if (b is (byte)'(' or (byte)')' or (byte)'\\') texto.Append('\\');
            if (b < 32) texto.Append(' ');
            else texto.Append((char)b);
        }
        return texto.ToString();
    }

    private static byte[] Documento(IReadOnlyList<byte[]> paginas)
    {
        var objetos = new List<byte[]>();
        objetos.Add(Latin1("<< /Type /Catalog /Pages 2 0 R >>"));
        var kids = string.Join(' ', paginas.Select((_, indice) => $"{3 + indice * 2} 0 R"));
        objetos.Add(Latin1($"<< /Type /Pages /Count {paginas.Count} /Kids [{kids}] >>"));
        var fonte = 3 + paginas.Count * 2;
        for (var i = 0; i < paginas.Count; i++)
        {
            var pagina = 3 + i * 2;
            var conteudo = pagina + 1;
            objetos.Add(Latin1($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents {conteudo} 0 R /Resources << /Font << /F1 {fonte} 0 R >> >> >>"));
            objetos.Add(Stream(paginas[i]));
        }
        objetos.Add(Latin1("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));

        var saida = new MemoryStream();
        var cabecalho = Latin1("%PDF-1.4\n");
        saida.Write(cabecalho);
        var offsets = new int[objetos.Count + 1];
        for (var i = 0; i < objetos.Count; i++)
        {
            offsets[i + 1] = (int)saida.Length;
            saida.Write(Latin1($"{i + 1} 0 obj\n"));
            saida.Write(objetos[i]);
            saida.Write(Latin1("\nendobj\n"));
        }

        var xref = (int)saida.Length;
        var tabela = new StringBuilder();
        tabela.Append($"xref\n0 {objetos.Count + 1}\n");
        tabela.Append("0000000000 65535 f \n");
        for (var i = 1; i <= objetos.Count; i++)
            tabela.Append(offsets[i].ToString("D10")).Append(" 00000 n \n");
        tabela.Append($"trailer << /Size {objetos.Count + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF");
        var fim = Latin1(tabela.ToString());
        saida.Write(fim);
        return saida.ToArray();
    }

    private static byte[] Stream(byte[] conteudo)
    {
        var prefixo = Latin1($"<< /Length {conteudo.Length} >>\nstream\n");
        var sufixo = Latin1("\nendstream");
        var tudo = new byte[prefixo.Length + conteudo.Length + sufixo.Length];
        prefixo.CopyTo(tudo, 0);
        conteudo.CopyTo(tudo, prefixo.Length);
        sufixo.CopyTo(tudo, prefixo.Length + conteudo.Length);
        return tudo;
    }

    private static byte[] Latin1(string texto) => Latino.GetBytes(texto);
}
