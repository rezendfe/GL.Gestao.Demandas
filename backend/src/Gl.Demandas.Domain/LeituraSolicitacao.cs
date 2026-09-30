using System.Globalization;
using System.Text.RegularExpressions;

namespace Gl.Demandas.Domain;

public sealed record LeituraSolicitacao(
    string? Assunto,
    string? Sala,
    string? Ponto,
    DateOnly? DataDesejada,
    string? Periodo,
    string? Telefone,
    IReadOnlyList<string> Itens,
    bool? AutorizaAcesso,
    string? Subcategoria)
{
    public bool Vazia =>
        Assunto is null
        && Sala is null
        && Ponto is null
        && DataDesejada is null
        && Periodo is null
        && Telefone is null
        && Itens.Count == 0
        && AutorizaAcesso is null
        && Subcategoria is null;
}

public static class CalendarioSolicitacao
{
    public static DateOnly HojeEmSaoPaulo(DateTime utc)
    {
        var instante = DateTime.SpecifyKind(utc, DateTimeKind.Utc);
        var zona = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(instante, zona));
    }

    public static DateOnly? Interpretar(string? valor, DateOnly hoje)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;

        var texto = valor.Trim();
        if (DateOnly.TryParseExact(texto, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var iso))
            return CorrigirAno(iso, hoje);

        var barra = Regex.Match(texto, @"^(\d{1,2})/(\d{1,2})/(\d{2,4})$");
        if (!barra.Success)
            return null;

        if (!int.TryParse(barra.Groups[1].Value, out var dia)
            || !int.TryParse(barra.Groups[2].Value, out var mes)
            || !int.TryParse(barra.Groups[3].Value, out var ano))
            return null;

        if (ano < 100)
            ano += 2000;

        try
        {
            return CorrigirAno(new DateOnly(ano, mes, dia), hoje);
        }
        catch (ArgumentOutOfRangeException)
        {
            return null;
        }
    }

    public static DateOnly? CorrigirAno(DateOnly data, DateOnly hoje)
    {
        if (data >= hoje && data.Year >= hoje.Year - 1)
            return data;

        var seculoTrocado = data.Year <= hoje.Year - 10;
        if (!seculoTrocado)
            return data >= hoje ? data : null;

        DateOnly candidata;
        try
        {
            candidata = new DateOnly(hoje.Year, data.Month, data.Day);
        }
        catch (ArgumentOutOfRangeException)
        {
            return null;
        }

        if (candidata < hoje)
            candidata = candidata.AddYears(1);

        return candidata <= hoje.AddDays(400) ? candidata : null;
    }
}

public static class NormalizadorSolicitacao
{
    public static readonly string[] Periodos = ["Manhã", "Tarde", "Noite", "Qualquer horário"];

    private static readonly (string Termo, string Item)[] ItensConhecidos =
    [
        ("infiltracao", "Infiltração"),
        ("eletrica", "Elétrica"),
        ("ar-condicionado", "Ar-condicionado"),
        ("ar condicionado", "Ar-condicionado"),
        ("vaga", "Vaga"),
        ("correspondencia", "Correspondência"),
        ("liberacao de area", "Liberação de área"),
        ("liberacao", "Liberação de área")
    ];

    public static LeituraSolicitacao Aplicar(
        string? assunto,
        string? sala,
        string? ponto,
        string? dataDesejada,
        string? periodo,
        string? telefone,
        IReadOnlyList<string>? itens,
        bool? autorizaAcesso,
        string? subcategoria,
        DateOnly hoje)
    {
        return new LeituraSolicitacao(
            Titulo(assunto),
            Local(sala),
            Referencia(ponto),
            CalendarioSolicitacao.Interpretar(dataDesejada, hoje),
            Periodo(periodo),
            Telefone(telefone),
            Itens(itens),
            autorizaAcesso == true ? true : null,
            Subcategoria(subcategoria));
    }

    public static string? Titulo(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;
        var titulo = Regex.Replace(valor.Trim(), @"\s+", " ");
        return titulo.Length <= 120 ? titulo : titulo[..120].TrimEnd();
    }

    public static string? Local(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;
        var texto = Regex.Replace(valor.Trim(), @"\s+", " ");
        var numero = Regex.Match(texto, @"\b(\d{1,6}[A-Za-z]?)\b");
        if (Regex.IsMatch(Texto.Normalizar(texto), @"\bsala\b") && numero.Success)
            return $"Sala {numero.Groups[1].Value}";
        return texto.Length <= 80 ? texto : texto[..80].TrimEnd();
    }

    public static string? Referencia(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;
        var texto = Regex.Replace(valor.Trim(), @"\s+", " ").Trim(' ', '.', ',');
        if (texto.Length == 0)
            return null;
        var ajustado = char.ToUpper(texto[0], new CultureInfo("pt-BR")) + texto[1..];
        return ajustado.Length <= 120 ? ajustado : ajustado[..120].TrimEnd();
    }

    public static string? Periodo(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;
        var normalizado = Texto.Normalizar(valor);
        if (normalizado.Contains("qualquer", StringComparison.Ordinal))
            return "Qualquer horário";
        if (Palavra(normalizado, "manha"))
            return "Manhã";
        if (Palavra(normalizado, "tarde"))
            return "Tarde";
        if (Palavra(normalizado, "noite"))
            return "Noite";
        return Periodos.FirstOrDefault(opcao => Texto.Normalizar(opcao) == normalizado);
    }

    public static string? Telefone(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;
        var digitos = new string(valor.Where(char.IsDigit).ToArray());
        if (digitos.Length is 12 or 13 && digitos.StartsWith("55", StringComparison.Ordinal))
            digitos = digitos[2..];
        if (digitos.Length == 11)
            return $"({digitos[..2]}) {digitos[2..7]}-{digitos[7..]}";
        if (digitos.Length == 10)
            return $"({digitos[..2]}) {digitos[2..6]}-{digitos[6..]}";
        return null;
    }

    public static IReadOnlyList<string> Itens(IReadOnlyList<string>? itens)
    {
        if (itens is null || itens.Count == 0)
            return [];

        var resultado = new List<string>();
        foreach (var item in itens)
            Incluir(resultado, item);
        return resultado;
    }

    public static IReadOnlyList<string> ItensDoTexto(string normalizado)
    {
        var resultado = new List<string>();
        var ocorrencias = ItensConhecidos
            .Select(par => (par.Item, Indice: normalizado.IndexOf(par.Termo, StringComparison.Ordinal)))
            .Where(par => par.Indice >= 0)
            .GroupBy(par => par.Item)
            .Select(grupo => grupo.OrderBy(par => par.Indice).First())
            .OrderBy(par => par.Indice);
        foreach (var ocorrencia in ocorrencias)
            Incluir(resultado, ocorrencia.Item);
        return resultado;
    }

    private static void Incluir(List<string> resultado, string? item)
    {
        if (string.IsNullOrWhiteSpace(item) || resultado.Count == 8)
            return;
        var texto = Regex.Replace(item.Trim(), @"\s+", " ");
        var conhecido = ItensConhecidos.FirstOrDefault(par => Texto.Normalizar(texto).Contains(par.Termo, StringComparison.Ordinal)).Item;
        var nome = conhecido ?? (texto.Length <= 40 ? texto : null);
        if (nome is null)
            return;
        if (resultado.Any(existente => Texto.Normalizar(existente) == Texto.Normalizar(nome)))
            return;
        resultado.Add(nome);
    }

    public static string? Subcategoria(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;
        var parte = valor.Split(['>', '·', '/'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).Last();
        return parte.Length is > 0 and <= 40 ? parte : null;
    }

    public static bool Palavra(string normalizado, string termo) =>
        Regex.IsMatch(normalizado, $@"(?<![a-z]){Regex.Escape(termo)}(?![a-z])");
}

public static class LeitorSolicitacao
{
    private static readonly Regex SalaRegex = new(
        @"\b(?:sala|loja|unidade)\s*(?:n[ºo°.]*)?\s*(\d{1,6}[A-Za-z]?)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex PontoRegex = new(
        @"pr[oó]xim[oa]\s+(?:ao|à|aos|às|a|do|da|de)\s+(.+?)(?=\s+n[eé]\b|\s+e\s+cara|\s+amanh|\s+dia\b|[.,;]|$)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex DataRegex = new(
        @"\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex TelefoneRegex = new(
        @"(?<!\d)(\d{2})\s*(\d{4,5})[-\s]?(\d{4})(?!\d)",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static LeituraSolicitacao Ler(string texto, DateOnly hoje)
    {
        var limpo = Regex.Replace(texto, @"\s+", " ").Trim();
        var normalizado = Texto.Normalizar(limpo);
        var itens = NormalizadorSolicitacao.ItensDoTexto(normalizado);

        return new LeituraSolicitacao(
            Assunto(normalizado),
            Sala(limpo),
            Ponto(limpo),
            Data(limpo, normalizado, hoje),
            Periodo(normalizado),
            Telefone(limpo),
            itens,
            Acesso(normalizado),
            null);
    }

    private static string? Assunto(string normalizado)
    {
        if (normalizado.Contains("vazamento", StringComparison.Ordinal) && normalizado.Contains("ar condicionado", StringComparison.Ordinal))
            return "Vazamento do ar-condicionado";
        if (NormalizadorSolicitacao.Palavra(normalizado, "infiltracao"))
            return "Infiltração";
        if (normalizado.Contains("ar condicionado", StringComparison.Ordinal))
            return "Ar-condicionado";
        if (NormalizadorSolicitacao.Palavra(normalizado, "eletrica"))
            return "Problema elétrico";
        return null;
    }

    private static string? Sala(string texto)
    {
        var sala = SalaRegex.Match(texto);
        return sala.Success ? $"Sala {sala.Groups[1].Value}" : null;
    }

    private static string? Ponto(string texto)
    {
        var ponto = PontoRegex.Match(texto);
        if (!ponto.Success)
            return null;
        var referencia = Regex.Replace(ponto.Groups[1].Value, @"\s+", " ").Trim(' ', '.', ',');
        if (referencia.Length < 3)
            return null;
        return NormalizadorSolicitacao.Referencia($"Próximo ao {referencia}");
    }

    private static DateOnly? Data(string texto, string normalizado, DateOnly hoje)
    {
        var explicita = DataRegex.Match(texto);
        if (explicita.Success)
        {
            var interpretada = CalendarioSolicitacao.Interpretar(explicita.Value, hoje);
            if (interpretada is not null)
                return interpretada;
        }

        if (NormalizadorSolicitacao.Palavra(normalizado, "depois de amanha"))
            return hoje.AddDays(2);
        if (NormalizadorSolicitacao.Palavra(normalizado, "amanha"))
            return hoje.AddDays(1);
        if (NormalizadorSolicitacao.Palavra(normalizado, "hoje"))
            return hoje;
        return null;
    }

    private static string? Periodo(string normalizado)
    {
        if (normalizado.Contains("qualquer horario", StringComparison.Ordinal))
            return "Qualquer horário";
        if (NormalizadorSolicitacao.Palavra(normalizado, "manha"))
            return "Manhã";
        if (NormalizadorSolicitacao.Palavra(normalizado, "tarde"))
            return "Tarde";
        if (NormalizadorSolicitacao.Palavra(normalizado, "noite"))
            return "Noite";
        return null;
    }

    private static string? Telefone(string texto)
    {
        var telefone = TelefoneRegex.Match(texto);
        return telefone.Success
            ? NormalizadorSolicitacao.Telefone(telefone.Groups[1].Value + telefone.Groups[2].Value + telefone.Groups[3].Value)
            : null;
    }

    private static bool? Acesso(string normalizado)
    {
        var autoriza = normalizado.Contains("autorizad", StringComparison.Ordinal)
            && (normalizado.Contains("entrar", StringComparison.Ordinal)
                || normalizado.Contains("acesso", StringComparison.Ordinal)
                || normalizado.Contains("equipe", StringComparison.Ordinal));
        return autoriza ? true : null;
    }
}
