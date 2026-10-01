using System.Globalization;
using System.Text;

namespace Gl.Demandas.Domain;

public static class BuscaFila
{
    public static bool Corresponde(string protocolo, string empresa, string local, string termo)
    {
        if (string.IsNullOrWhiteSpace(termo)) return true;
        var texto = Normalizar(termo);
        return Contem(protocolo, texto) || Contem(empresa, texto) || Contem(local, texto);
    }

    public static IReadOnlyList<T> DentroDaFila<T>(
        IEnumerable<T> filaAutorizada,
        Func<T, string> protocolo,
        Func<T, string> empresa,
        Func<T, string> local,
        string termo) =>
        filaAutorizada.Where(item => Corresponde(protocolo(item), empresa(item), local(item), termo)).ToArray();

    static bool Contem(string valor, string texto) => Normalizar(valor).Contains(texto, StringComparison.Ordinal);

    static string Normalizar(string? valor)
    {
        var forma = (valor ?? "").Normalize(NormalizationForm.FormD);
        var texto = new StringBuilder(forma.Length);
        foreach (var caractere in forma)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(caractere) != UnicodeCategory.NonSpacingMark)
                texto.Append(char.ToLowerInvariant(caractere));
        }
        return texto.ToString().Normalize(NormalizationForm.FormC);
    }
}
