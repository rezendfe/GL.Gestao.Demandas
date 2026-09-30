namespace Gl.Demandas.Domain;

public static class PrazoAtendimento
{
    public static bool EmAtraso(bool emAberto, DateTime abertoEm, DateTime? previsao, int? prazoHoras, DateTime agora)
    {
        if (!emAberto) return false;
        if (previsao is DateTime prevista) return prevista < agora;
        if (prazoHoras is not int horas || horas < 1) return false;
        return abertoEm.AddHours(horas) < agora;
    }
}
