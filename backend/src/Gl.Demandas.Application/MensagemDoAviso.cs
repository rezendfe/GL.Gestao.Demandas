using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

internal static class MensagemDoAviso
{
    public static Guid? Resolver(Notificacao nota, Demanda? demanda)
    {
        if (demanda is null)
            return null;

        var texto = nota.Texto.Trim();
        var iguais = demanda.Mensagens
            .Where(m => string.Equals(m.Texto.Trim(), texto, StringComparison.Ordinal) && texto.Length > 0)
            .ToArray();
        if (iguais.Length == 1)
            return iguais[0].Id;

        var porTexto = MaisPerto(iguais, nota.CriadaEm, m => m.EnviadaEm);
        if (porTexto is not null)
            return porTexto.Id;

        var tipo = texto switch
        {
            "Áudio enviado." => "audio/",
            "Imagem enviada." => "image/",
            "Arquivo enviado." => "arquivo",
            _ => null
        };
        if (tipo is not null)
        {
            var anexos = demanda.Anexos
                .Where(a => a.MensagemId is not null && Combina(a.Tipo, tipo))
                .ToArray();
            if (anexos.Length == 1)
                return anexos[0].MensagemId;
            var anexo = MaisPerto(anexos, nota.CriadaEm, a => a.EnviadoEm);
            if (anexo is not null)
                return anexo.MensagemId;
        }

        if (texto.Contains("está em atendimento", StringComparison.Ordinal) || texto.Contains("aguarda a sua validação", StringComparison.Ordinal))
        {
            var mensageria = demanda.Mensagens.Where(m => m.Canal == "MENSAGERIA").ToArray();
            if (mensageria.Length == 1)
                return mensageria[0].Id;
            return MaisPerto(mensageria, nota.CriadaEm, m => m.EnviadaEm)?.Id;
        }

        return null;
    }

    private static bool Combina(string tipoMidia, string esperado)
    {
        if (esperado == "arquivo")
            return !tipoMidia.StartsWith("audio/", StringComparison.OrdinalIgnoreCase)
                && !tipoMidia.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
        return tipoMidia.StartsWith(esperado, StringComparison.OrdinalIgnoreCase);
    }

    private static T? MaisPerto<T>(IReadOnlyList<T> itens, DateTime quando, Func<T, DateTime> instante) where T : class
    {
        T? melhor = null;
        var menor = double.MaxValue;
        foreach (var item in itens)
        {
            var distancia = Math.Abs((instante(item) - quando).TotalSeconds);
            if (distancia > 120 || distancia >= menor)
                continue;
            menor = distancia;
            melhor = item;
        }
        return melhor;
    }
}
