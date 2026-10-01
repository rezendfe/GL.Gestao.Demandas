namespace Gl.Demandas.Domain;

public static class FormatoCampo
{
    public static string Email(string valor)
    {
        var email = valor.Trim().ToLowerInvariant();
        var arroba = email.IndexOf('@');
        var dominio = arroba > 0 && arroba < email.Length - 1 ? email[(arroba + 1)..] : "";
        var valido = arroba > 0
            && email.IndexOf('@', arroba + 1) < 0
            && !email.Contains(' ')
            && dominio.Contains('.')
            && !dominio.StartsWith('.')
            && !dominio.EndsWith('.')
            && !dominio.Contains("..");
        if (email.Length is < 6 or > 320 || !valido)
            throw new RegraNegocioException("Informe um e-mail válido.");
        return email;
    }

    public static string Telefone(string valor)
    {
        var digitos = new string(valor.Where(char.IsDigit).ToArray());
        if (digitos.StartsWith("55") && digitos.Length is 12 or 13)
            digitos = digitos[2..];
        if (digitos.Length is not (10 or 11))
            throw new RegraNegocioException("Informe um telefone com DDD, no formato (00) 00000-0000.");
        return digitos.Length == 11
            ? $"({digitos[..2]}) {digitos[2..7]}-{digitos[7..]}"
            : $"({digitos[..2]}) {digitos[2..6]}-{digitos[6..]}";
    }

    public static string CodigoEspaco(string valor)
    {
        var codigo = valor.Trim().ToUpperInvariant();
        if (codigo.Length is < 1 or > 40)
            throw new RegraNegocioException("Informe o código do espaço.");
        if (codigo.Any(caractere => !(char.IsAsciiLetterOrDigit(caractere) || caractere == '-')))
            throw new RegraNegocioException("O código do espaço usa letras, números e hífen.");
        return codigo;
    }

    public static string Texto(string valor, int minimo, int maximo, string mensagem)
    {
        var texto = valor.Trim();
        if (texto.Length < minimo || texto.Length > maximo)
            throw new RegraNegocioException(mensagem);
        return texto;
    }

    public static string Limitar(string valor, int maximo, string mensagem)
    {
        var texto = valor.Trim();
        if (texto.Length > maximo)
            throw new RegraNegocioException(mensagem);
        return texto;
    }
}
