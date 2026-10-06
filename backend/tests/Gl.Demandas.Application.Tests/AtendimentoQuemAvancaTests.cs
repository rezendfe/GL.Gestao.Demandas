using Gl.Demandas.Domain;

namespace Gl.Demandas.Application.Tests;

public sealed class AtendimentoQuemAvancaTests
{
    private static readonly Guid Area = Guid.Parse("22222222-2222-4222-8222-222222222205");
    private static readonly Guid OutraArea = Guid.Parse("22222222-2222-4222-8222-222222222201");
    private static readonly Guid CessionarioId = Guid.Parse("11111111-1111-4111-8111-111111111201");
    private static readonly DateTime Agora = new(2026, 10, 5, 21, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Responsavel_da_area_registra_o_atendimento_e_cessionario_so_valida()
    {
        var semFoto = EmAtendimento(comFoto: false);
        var semEvidencia = Assert.Throws<RegraNegocioException>(() =>
            semFoto.Avancar(Perfil.ResponsavelArea, Guid.NewGuid(), Area, CadeiaAtendimento.Padrao(), "Correspondência entregue.", null, null, Agora));
        Assert.Contains("foto", semEvidencia.Message, StringComparison.OrdinalIgnoreCase);

        var demanda = EmAtendimento(comFoto: true);
        Assert.Throws<AcessoNegadoException>(() =>
            demanda.Avancar(Perfil.Cessionario, CessionarioId, null, CadeiaAtendimento.Padrao(), "Eu confirmo.", null, null, Agora, CessionarioId));
        Assert.Throws<AcessoNegadoException>(() =>
            demanda.Avancar(Perfil.ResponsavelArea, Guid.NewGuid(), OutraArea, CadeiaAtendimento.Padrao(), "Não é a minha área.", null, null, Agora));

        var avancou = demanda.Avancar(
            Perfil.ResponsavelArea,
            Guid.NewGuid(),
            Area,
            CadeiaAtendimento.Padrao(),
            "Correspondência entregue na sala.",
            null,
            null,
            Agora);
        Assert.True(avancou.AguardaValidacao);
        Assert.Equal(SituacaoDemanda.AguardandoValidacao, demanda.Situacao);

        Assert.Throws<AcessoNegadoException>(() =>
            demanda.Avancar(Perfil.ResponsavelArea, Guid.NewGuid(), Area, CadeiaAtendimento.Padrao(), "ok", null, true, Agora));
        demanda.Avancar(Perfil.Cessionario, CessionarioId, null, CadeiaAtendimento.Padrao(), "Recebi.", null, true, Agora, CessionarioId);
        Assert.Equal(SituacaoDemanda.Concluido, demanda.Situacao);
    }

    private static Demanda EmAtendimento(bool comFoto)
    {
        var anexos = comFoto
            ? new[] { new Anexo(Guid.NewGuid(), "entrega.png", "entrega.png", "image/png", 12, Agora, finalidade: "obra") }
            : Array.Empty<Anexo>();
        return Demanda.Carregar(
            Guid.NewGuid(),
            "GL-2026-00999",
            CessionarioId,
            "Empresa Exemplo",
            "Sala 205",
            "Correspondência na recepção.",
            null,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Area,
            null,
            "Correspondências",
            "Recepção",
            SituacaoDemanda.EmAndamento,
            "Normal",
            3,
            "Alta",
            "Confirmada",
            FluxoDemanda.Atendimento,
            Agora,
            Agora,
            [],
            anexos,
            [],
            [],
            empresaCessionariaId: CessionarioId);
    }
}
