namespace Gl.Demandas.Domain;

public static class Protocolo
{
    public const int PrimeiroNumeroDaPoc = 128;

    public static string Montar(int ano, int numero) => $"GL-{ano}-{numero:00000}";

    public static int Proximo(IEnumerable<string> existentes, int ano)
    {
        var prefixo = $"GL-{ano}-";
        var usados = new HashSet<int>();
        foreach (var protocolo in existentes)
        {
            if (protocolo.StartsWith(prefixo, StringComparison.Ordinal)
                && int.TryParse(protocolo.AsSpan(prefixo.Length), out var numero))
            {
                usados.Add(numero);
            }
        }

        var candidato = PrimeiroNumeroDaPoc;
        while (usados.Contains(candidato))
            candidato++;

        return candidato;
    }
}
