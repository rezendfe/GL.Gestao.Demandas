using Gl.Demandas.Domain;

namespace Gl.Demandas.Application.Tests;

public sealed class AcessoCessionarioTests
{
    [Fact]
    public void Permissoes_efetivas_sao_a_uniao_das_funcoes_ativas()
    {
        var empresaId = Guid.NewGuid();
        var representante = NovoRepresentante(empresaId);
        var consulta = NovaFuncao(empresaId, PermissaoCessionario.ConsultarEmpresa);
        var abertura = NovaFuncao(empresaId, PermissaoCessionario.AbrirDemanda);
        representante.SubstituirFuncoes([consulta, abertura]);

        Assert.True(representante.Pode(PermissaoCessionario.ConsultarEmpresa));
        Assert.True(representante.Pode(PermissaoCessionario.AbrirDemanda));
        Assert.False(representante.Pode(PermissaoCessionario.AvaliarAtendimento));
    }

    [Fact]
    public void Funcao_de_outra_empresa_nao_pode_ser_associada()
    {
        var representante = NovoRepresentante(Guid.NewGuid());

        Assert.Throws<RegraNegocioException>(() =>
            representante.SubstituirFuncoes([NovaFuncao(Guid.NewGuid(), PermissaoCessionario.ConsultarEmpresa)]));
        Assert.False(representante.Pode(PermissaoCessionario.ConsultarEmpresa));
    }

    [Fact]
    public void Contato_principal_e_unico_por_canal()
    {
        var representante = NovoRepresentante(Guid.NewGuid());
        var emailPrincipal = new ContatoCessionario(Guid.NewGuid(), CanalContato.Email, "principal@example.com", true);
        var outroEmail = new ContatoCessionario(Guid.NewGuid(), CanalContato.Email, "outro@example.com", true);
        var telefonePrincipal = new ContatoCessionario(Guid.NewGuid(), CanalContato.Telefone, "+5521999999999", true);

        representante.SalvarContato(emailPrincipal);
        representante.SalvarContato(outroEmail);
        representante.SalvarContato(telefonePrincipal);

        Assert.False(representante.Contatos.Single(contato => contato.Id == emailPrincipal.Id).Principal);
        Assert.True(representante.Contatos.Single(contato => contato.Id == outroEmail.Id).Principal);
        Assert.True(representante.Contatos.Single(contato => contato.Id == telefonePrincipal.Id).Principal);
    }

    [Fact]
    public void Identidade_estavel_nao_pode_ser_trocada_apos_vinculacao()
    {
        var representante = NovoRepresentante(Guid.NewGuid());
        representante.VincularIdentidadeEstavel("entra-sub-1");

        Assert.Throws<RegraNegocioException>(() => representante.VincularIdentidadeEstavel("entra-sub-2"));
    }

    private static RepresentanteCessionario NovoRepresentante(Guid empresaId) =>
        new(Guid.NewGuid(), empresaId, Guid.NewGuid(), "representante@example.com");

    private static FuncaoCessionario NovaFuncao(Guid empresaId, params PermissaoCessionario[] permissoes) =>
        new(Guid.NewGuid(), empresaId, "Acesso demonstrativo", true, permissoes.ToHashSet());
}