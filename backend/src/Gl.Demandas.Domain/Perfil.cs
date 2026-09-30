namespace Gl.Demandas.Domain;

public enum Perfil
{
    Cessionario,
    GlAdministrador,
    ResponsavelArea
}

public static class PerfilTexto
{
    public const string Cessionario = "Cessionário";
    public const string GlAdministrador = "GL / Administrador";
    public const string ResponsavelArea = "Responsável da Área";

    public static string ParaExibicao(Perfil perfil) => perfil switch
    {
        Perfil.Cessionario => Cessionario,
        Perfil.GlAdministrador => GlAdministrador,
        Perfil.ResponsavelArea => ResponsavelArea,
        _ => throw new ArgumentOutOfRangeException(nameof(perfil))
    };

    public static string ParaCodigo(Perfil perfil) => perfil switch
    {
        Perfil.Cessionario => "CESSIONARIO",
        Perfil.GlAdministrador => "GL_ADMINISTRADOR",
        Perfil.ResponsavelArea => "RESPONSAVEL_AREA",
        _ => throw new ArgumentOutOfRangeException(nameof(perfil))
    };

    public static Perfil ParaPerfil(string texto) => texto switch
    {
        Cessionario or "CESSIONARIO" => Perfil.Cessionario,
        GlAdministrador or "GL_ADMINISTRADOR" => Perfil.GlAdministrador,
        ResponsavelArea or "RESPONSAVEL_AREA" => Perfil.ResponsavelArea,
        _ => throw new ArgumentOutOfRangeException(nameof(texto), texto, "Perfil desconhecido.")
    };
}
