using Gl.Demandas.Application;
using Gl.Demandas.Domain;

namespace Gl.Demandas.Application.Tests;

public class WhatsAppEtapaTests
{
    private static EtapaCadeia Etapa(string codigo, string nome, int ordem, bool abrir = false, bool concluir = false, bool automatica = false) =>
        new(codigo, nome, ordem, automatica, [], enviarAoAbrir: abrir, enviarAoConcluir: concluir);

    private static IReadOnlyList<EtapaCadeia> Cadeia(bool abrirAtendimento = false, bool concluirAtendimento = false, bool abrirValidacao = false) =>
    [
        Etapa("solicitacao", "Solicitação", 1),
        Etapa("aprovacao", "Aprovação", 2),
        Etapa("atendimento", "Atendimento", 3, abrirAtendimento, concluirAtendimento),
        Etapa("validacao", "Validação do cliente", 4, abrirValidacao),
        Etapa("conclusao", "Conclusão", 5)
    ];

    [Fact]
    public void Telefone_do_cliente_vai_com_o_codigo_do_Brasil()
    {
        Assert.Equal("5521994684864", TelefoneWhatsApp.Normalizar("(21) 99468-4864"));
        Assert.Equal("5521994684864", TelefoneWhatsApp.Normalizar("5521994684864"));
        Assert.Null(TelefoneWhatsApp.Normalizar("123"));
    }

    [Fact]
    public void Texto_traz_o_status_e_o_vinculo_de_quem_recebe()
    {
        var aberta = new EventoEtapaWhatsApp("Validação do cliente", true);
        var texto = TextoWhatsAppDemanda.Montar("GL-2026-00134", "Correspondências", "Aguardando validação", aberta, VinculoWhatsApp.Abriu);

        Assert.Contains("GL-2026-00134", texto);
        Assert.Contains("status Aguardando validação", texto);
        Assert.Contains("que você abriu", texto);
        Assert.Contains("A etapa Validação do cliente foi aberta.", texto);

        var concluida = new EventoEtapaWhatsApp("Atendimento", false);
        var doResponsavel = TextoWhatsAppDemanda.Montar("GL-2026-00134", "Correspondências", "Aguardando validação", concluida, VinculoWhatsApp.Trabalha);
        Assert.Contains("que você está trabalhando", doResponsavel);
        Assert.Contains("A etapa Atendimento foi concluída.", doResponsavel);

        var acompanhando = TextoWhatsAppDemanda.Montar("GL-2026-00134", "Correspondências", "Em andamento", aberta, VinculoWhatsApp.Acompanha);
        Assert.Contains("que você está acompanhando", acompanhando);
    }

    [Fact]
    public void Corpo_da_mensagem_usa_o_telefone_e_o_texto_do_status()
    {
        var json = CorpoMensagemWhatsApp.Json("5521994684864", "Chamado GL-2026-00134 está com o status Em andamento.");

        Assert.Contains("\"messaging_product\":\"whatsapp\"", json);
        Assert.Contains("\"to\":\"5521994684864\"", json);
        Assert.Contains("\"type\":\"text\"", json);
        Assert.Contains("status Em andamento", json);
    }

    [Fact]
    public void Ao_abrir_o_chamado_so_avisa_se_a_etapa_atual_esta_marcada()
    {
        var semMarca = MudancaDeEtapa.Listar(null, SituacaoDemanda.Novo, Cadeia(), false);
        Assert.Empty(semMarca);

        var cadeia = Cadeia();
        var marcada = cadeia.Select(etapa => etapa.Codigo == "solicitacao"
            ? new EtapaCadeia(etapa.Codigo, etapa.Nome, etapa.Ordem, etapa.Automatica, etapa.Campos, etapa.Tarefas, true, false)
            : etapa).ToArray();

        var eventos = MudancaDeEtapa.Listar(null, SituacaoDemanda.Novo, marcada, false);
        var evento = Assert.Single(eventos);
        Assert.Equal("Solicitação", evento.Nome);
        Assert.True(evento.Aberta);
    }

    [Fact]
    public void Avanco_avisa_a_etapa_concluida_e_a_etapa_aberta_quando_marcadas()
    {
        var eventos = MudancaDeEtapa.Listar(
            SituacaoDemanda.EmAndamento,
            SituacaoDemanda.AguardandoValidacao,
            Cadeia(concluirAtendimento: true, abrirValidacao: true),
            true);

        Assert.Equal(2, eventos.Count);
        Assert.Equal(("Atendimento", false), (eventos[0].Nome, eventos[0].Aberta));
        Assert.Equal(("Validação do cliente", true), (eventos[1].Nome, eventos[1].Aberta));
    }

    [Fact]
    public void Etapa_sem_marca_nao_gera_aviso()
    {
        var eventos = MudancaDeEtapa.Listar(
            SituacaoDemanda.EmAndamento,
            SituacaoDemanda.AguardandoValidacao,
            Cadeia(),
            true);

        Assert.Empty(eventos);
    }

    [Fact]
    public void Volta_da_validacao_reabre_o_atendimento_e_nao_marca_conclusao()
    {
        var eventos = MudancaDeEtapa.Listar(
            SituacaoDemanda.AguardandoValidacao,
            SituacaoDemanda.EmAndamento,
            Cadeia(abrirAtendimento: true, concluirAtendimento: true),
            true);

        var evento = Assert.Single(eventos);
        Assert.Equal("Atendimento", evento.Nome);
        Assert.True(evento.Aberta);
    }

    [Fact]
    public async Task Publicar_envia_o_status_para_quem_abriu_acompanha_ou_trabalha()
    {
        var enviados = new List<(string Telefone, string Texto)>();
        var aviso = new AvisoWhatsAppEtapa(
            new DestinosFixos(
            [
                new DestinoWhatsApp(Guid.NewGuid(), "5521994684864", VinculoWhatsApp.Abriu),
                new DestinoWhatsApp(Guid.NewGuid(), "5521988887777", VinculoWhatsApp.Acompanha),
                new DestinoWhatsApp(Guid.NewGuid(), "5521977776666", VinculoWhatsApp.Trabalha)
            ]),
            new EnvioMemoria(enviados));

        await aviso.Publicar(
            new AvisoDemandaWhatsApp("GL-2026-00134", "Correspondências", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()),
            SituacaoDemanda.EmAndamento,
            SituacaoDemanda.AguardandoValidacao,
            Cadeia(concluirAtendimento: true),
            true,
            CancellationToken.None);

        Assert.Equal(3, enviados.Count);
        Assert.Contains(enviados, item => item.Telefone == "5521994684864" && item.Texto.Contains("que você abriu") && item.Texto.Contains("Aguardando validação"));
        Assert.Contains(enviados, item => item.Telefone == "5521988887777" && item.Texto.Contains("que você está acompanhando"));
        Assert.Contains(enviados, item => item.Telefone == "5521977776666" && item.Texto.Contains("que você está trabalhando"));
    }

    private sealed class DestinosFixos(IReadOnlyList<DestinoWhatsApp> destinos) : IDestinosWhatsApp
    {
        public Task<IReadOnlyList<DestinoWhatsApp>> DaDemanda(Guid cessionarioId, Guid? empresaId, Guid? responsavelId, Guid areaId, CancellationToken ct) =>
            Task.FromResult(destinos);
    }

    private sealed class EnvioMemoria(List<(string Telefone, string Texto)> enviados) : IEnvioWhatsApp
    {
        public Task Enviar(string telefone, string texto, CancellationToken ct)
        {
            enviados.Add((telefone, texto));
            return Task.CompletedTask;
        }
    }
}
