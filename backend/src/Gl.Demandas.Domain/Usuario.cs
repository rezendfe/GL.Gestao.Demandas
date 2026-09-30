namespace Gl.Demandas.Domain;

public sealed class Usuario
{
    public Usuario(
        Guid id,
        string nome,
        string email,
        string? senhaHash,
        Perfil perfil,
        string? empresa,
        string? sala,
        Guid? areaId,
        string? logoEmpresa = null,
        string? foto = null,
        Guid? empresaCessionariaId = null,
        string? identidadeEstavel = null,
        bool ativo = true,
        bool empresaAtiva = true)
    {
        Id = id;
        Nome = nome;
        Email = email;
        SenhaHash = senhaHash;
        Perfil = perfil;
        Empresa = empresa;
        Sala = sala;
        AreaId = areaId;
        LogoEmpresa = logoEmpresa;
        Foto = foto;
        EmpresaCessionariaId = empresaCessionariaId;
        IdentidadeEstavel = identidadeEstavel;
        Ativo = ativo;
        EmpresaAtiva = empresaAtiva;
    }

    public Guid Id { get; }
    public string Nome { get; }
    public string Email { get; }
    public string? SenhaHash { get; }
    public Perfil Perfil { get; }
    public string? Empresa { get; }
    public string? Sala { get; }
    public Guid? AreaId { get; }
    public string? LogoEmpresa { get; }
    public string? Foto { get; }
    public Guid? EmpresaCessionariaId { get; }
    public string? IdentidadeEstavel { get; }
    public bool Ativo { get; }
    public bool EmpresaAtiva { get; }
}
