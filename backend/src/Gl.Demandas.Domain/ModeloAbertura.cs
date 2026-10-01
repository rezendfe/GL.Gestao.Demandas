namespace Gl.Demandas.Domain;

public sealed class ModeloAbertura
{
    public static readonly string[] Periodos = ["Manhã", "Tarde", "Noite", "Qualquer horário"];

    ModeloAbertura(string? assunto, string? ponto, string? periodo, IReadOnlyList<string> itens)
    {
        Assunto = assunto;
        Ponto = ponto;
        Periodo = periodo;
        Itens = itens;
    }

    public string? Assunto { get; }
    public string? Ponto { get; }
    public string? Periodo { get; }
    public IReadOnlyList<string> Itens { get; }

    public string ItensTexto => string.Join('\n', Itens);

    public static ModeloAbertura? Interpretar(string? assunto, string? ponto, string? periodo, IEnumerable<string>? itens)
    {
        var assuntoLimpo = Limpar(assunto);
        var pontoLimpo = Limpar(ponto);
        var periodoLimpo = Limpar(periodo);
        var lista = new List<string>();
        foreach (var item in itens ?? [])
        {
            var nome = (item ?? "").Replace('\r', ' ').Replace('\n', ' ').Trim();
            if (nome.Length == 0) continue;
            if (lista.Any(existente => string.Equals(existente, nome, StringComparison.OrdinalIgnoreCase))) continue;
            lista.Add(nome);
        }

        if (assuntoLimpo is null && pontoLimpo is null && periodoLimpo is null && lista.Count == 0)
            return null;
        if (assuntoLimpo is { Length: > 120 })
            throw new RegraNegocioException("O assunto sugerido tem no máximo 120 caracteres.");
        if (pontoLimpo is { Length: > 200 })
            throw new RegraNegocioException("O ponto sugerido tem no máximo 200 caracteres.");
        if (periodoLimpo is not null && !Periodos.Contains(periodoLimpo))
            throw new RegraNegocioException("O período sugerido é manhã, tarde, noite ou qualquer horário.");
        if (lista.Count > 12 || lista.Any(item => item.Length > 80))
            throw new RegraNegocioException("Cada item sugerido tem no máximo 80 caracteres, até 12 itens.");

        return new ModeloAbertura(assuntoLimpo, pontoLimpo, periodoLimpo, lista);
    }

    public static ModeloAbertura? Ler(string? assunto, string? ponto, string? periodo, string? itens) =>
        Interpretar(assunto, ponto, periodo, (itens ?? "").Split('\n'));

    static string? Limpar(string? valor)
    {
        var texto = valor?.Trim();
        return string.IsNullOrEmpty(texto) ? null : texto;
    }
}
