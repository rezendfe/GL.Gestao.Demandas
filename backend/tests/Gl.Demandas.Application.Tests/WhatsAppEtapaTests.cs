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
        var texto = TextoWhatsAppDemanda.MontarStatus("GL-2026-00134", "Correspondências", "Aguardando validação", VinculoWhatsApp.Abriu);

        Assert.Contains("GL-2026-00134", texto);
        Assert.Contains("status Aguardando validação", texto);
        Assert.Contains("que você abriu", texto);
        Assert.DoesNotContain("A etapa", texto);

        var doResponsavel = TextoWhatsAppDemanda.MontarStatus("GL-2026-00134", "Correspondências", "Aguardando validação", VinculoWhatsApp.Trabalha);
        Assert.Contains("que você está trabalhando", doResponsavel);

        var acompanhando = TextoWhatsAppDemanda.MontarStatus("GL-2026-00134", "Correspondências", "Em andamento", VinculoWhatsApp.Acompanha);
        Assert.Contains("que você está acompanhando", acompanhando);
    }

    [Fact]
    public void Aviso_mantem_a_frase_e_acrescenta_alteracao_e_link()
    {
        var id = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        var link = LinkChamado.Montar(null, id);
        var texto = TextoWhatsAppDemanda.MontarAviso(
            "GL-2026-00132",
            "Fibra",
            "Liberado para execução",
            VinculoWhatsApp.Abriu,
            "pode executar",
            link);

        Assert.StartsWith("Chamado GL-2026-00132 (Fibra), que você abriu, está com o status Liberado para execução.", texto);
        Assert.Contains("pode executar", texto);
        Assert.Contains($"Abrir o chamado: {LinkChamado.PortalPadrao}/demandas/{id}", texto);
        Assert.Null(ComplementoWhatsApp.Texto("Aprovada."));
        Assert.Equal("pode executar", ComplementoWhatsApp.Texto("Aprovada. pode executar"));
        Assert.Null(ComplementoWhatsApp.Texto("Avançou para Atendimento."));
    }

    [Fact]
    public void Midia_de_imagem_e_audio_reproduzivel_tem_o_tipo_do_provedor()
    {
        var foto = CorpoMensagemWhatsApp.JsonMidia("5521994684864", "image", "midia-1", "obra.jpg");
        var audio = CorpoMensagemWhatsApp.JsonMidia("5521994684864", "audio", "midia-2", "fala.mp3");
        var arquivo = CorpoMensagemWhatsApp.JsonMidia("5521994684864", "document", "midia-3", "fala webm.webm");

        Assert.Contains("\"type\":\"image\"", foto);
        Assert.Contains("\"type\":\"audio\"", audio);
        Assert.Contains("\"filename\":\"fala-webm.webm\"", arquivo);
        var um = new byte[] { 1 };
        Assert.Equal("image", CorpoMensagemWhatsApp.TipoDeEnvio(new MidiaWhatsApp("obra.jpg", "image/jpeg", um, false)));
        Assert.Equal("audio", CorpoMensagemWhatsApp.TipoDeEnvio(new MidiaWhatsApp("fala.mp3", "audio/mpeg", um, true)));
        Assert.Equal("document", CorpoMensagemWhatsApp.TipoDeEnvio(new MidiaWhatsApp("fala.webm", "audio/webm", um, true)));
    }

    [Fact]
    public void Anexos_da_alteracao_ficam_na_janela_da_mudanca()
    {
        var agora = new DateTime(2026, 10, 16, 15, 0, 0, DateTimeKind.Utc);
        var historico = new[]
        {
            new HistoricoDemanda(Guid.NewGuid(), Guid.NewGuid(), "Aguardando aprovação", "Liberado para execução", "Aprovada. pode executar", "APROVACAO", agora)
        };
        var foto = new Anexo(Guid.NewGuid(), "obra.jpg", "obra.jpg", "image/jpeg", 10, agora.AddSeconds(-20));
        var audio = new Anexo(Guid.NewGuid(), "fala.mp3", "fala.mp3", "audio/mpeg", 10, agora.AddSeconds(-10));
        var antigo = new Anexo(Guid.NewGuid(), "velha.jpg", "velha.jpg", "image/jpeg", 10, agora.AddMinutes(-10));

        var anexos = ComplementoWhatsApp.AnexosDaMudanca(historico, [foto, audio, antigo]);

        Assert.Equal("pode executar", ComplementoWhatsApp.ComentarioDaMudanca(historico));
        Assert.Equal(2, anexos.Count);
        Assert.Contains(anexos, item => item.Nome == "obra.jpg");
        Assert.Contains(anexos, item => item.Nome == "fala.mp3");
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
    public async Task Publicar_envia_alteracao_link_foto_e_audio_depois_da_frase()
    {
        var enviados = new List<(string Telefone, string Texto)>();
        var midias = new List<(string Telefone, string Nome)>();
        var aviso = new AvisoWhatsAppEtapa(
            new DestinosFixos([new DestinoWhatsApp(Guid.NewGuid(), "5521994684864", VinculoWhatsApp.Abriu)]),
            new EnvioMemoria(enviados, midias));

        await aviso.Publicar(
            new AvisoDemandaWhatsApp(
                "GL-2026-00132",
                "Fibra",
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                "pode executar",
                "https://gray-bay-0ad3ef71e.1.azurestaticapps.net/demandas/abc",
                [
                    new MidiaWhatsApp("obra.jpg", "image/jpeg", new byte[] { 1 }, false),
                    new MidiaWhatsApp("fala.mp3", "audio/mpeg", new byte[] { 1 }, true)
                ]),
            SituacaoDemanda.AguardandoAprovacao,
            SituacaoDemanda.LiberadoParaExecucao,
            Cadeia(),
            false,
            CancellationToken.None);

        var texto = Assert.Single(enviados).Texto;
        Assert.StartsWith("Chamado GL-2026-00132 (Fibra), que você abriu, está com o status Liberado para execução.", texto);
        Assert.Contains("pode executar", texto);
        Assert.Contains("Abrir o chamado: https://gray-bay-0ad3ef71e.1.azurestaticapps.net/demandas/abc", texto);
        Assert.Equal(["obra.jpg", "fala.mp3"], midias.Select(item => item.Nome).ToArray());
    }

    [Fact]
    public async Task Publicar_envia_o_status_para_os_demandantes_mesmo_sem_marca_na_etapa()
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
            Cadeia(),
            true,
            CancellationToken.None);

        Assert.Equal(2, enviados.Count);
        Assert.Contains(enviados, item => item.Telefone == "5521994684864" && item.Texto.Contains("que você abriu") && item.Texto.Contains("Aguardando validação"));
        Assert.Contains(enviados, item => item.Telefone == "5521988887777" && item.Texto.Contains("que você está acompanhando"));
        Assert.DoesNotContain(enviados, item => item.Telefone == "5521977776666");
        Assert.All(enviados, item => Assert.DoesNotContain("A etapa", item.Texto));
    }

    [Fact]
    public async Task Publicar_nao_reenvia_quando_o_status_nao_muda()
    {
        var enviados = new List<(string Telefone, string Texto)>();
        var aviso = new AvisoWhatsAppEtapa(
            new DestinosFixos([new DestinoWhatsApp(Guid.NewGuid(), "5521994684864", VinculoWhatsApp.Abriu)]),
            new EnvioMemoria(enviados));

        await aviso.Publicar(
            new AvisoDemandaWhatsApp("GL-2026-00134", "Correspondências", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()),
            SituacaoDemanda.EmAndamento,
            SituacaoDemanda.EmAndamento,
            Cadeia(abrirAtendimento: true),
            false,
            CancellationToken.None);

        Assert.Empty(enviados);
    }

    private sealed class DestinosFixos(IReadOnlyList<DestinoWhatsApp> destinos) : IDestinosWhatsApp
    {
        public Task<IReadOnlyList<DestinoWhatsApp>> DaDemanda(Guid cessionarioId, Guid? empresaId, Guid? responsavelId, Guid areaId, CancellationToken ct) =>
            Task.FromResult(destinos);
    }

    private sealed class EnvioMemoria(List<(string Telefone, string Texto)> enviados, List<(string Telefone, string Nome)>? midias = null) : IEnvioWhatsApp
    {
        public Task Enviar(string telefone, string texto, CancellationToken ct)
        {
            enviados.Add((telefone, texto));
            return Task.CompletedTask;
        }

        public Task EnviarMidia(string telefone, MidiaWhatsApp midia, CancellationToken ct)
        {
            midias?.Add((telefone, midia.Nome));
            return Task.CompletedTask;
        }
    }
}
