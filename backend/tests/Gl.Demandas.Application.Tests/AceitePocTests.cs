using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure;
using Gl.Demandas.Infrastructure.Persistence;

namespace Gl.Demandas.Application.Tests;

public sealed class AceitePocTests : IDisposable
{
    private readonly BancoDeTeste _banco;
    private readonly AppDbContext _db;
    private readonly AtendimentoAplicacao _atendimento;
    private readonly ObrasAplicacao _obras;
    private readonly NotificacaoAplicacao _notificacoes;
    private readonly LoginAplicacao _login;
    private readonly string _pasta;

    public AceitePocTests()
    {
        _banco = new BancoDeTeste();
        _db = _banco.Contexto;
        var agora = new DateTime(2026, 9, 28, 15, 0, 0, DateTimeKind.Utc);
        DemoSeed.Aplicar(_db, agora);
        var repo = new GlRepositorio(_db);
        _pasta = Path.Combine(Path.GetTempPath(), "gl-poc-tests", Guid.NewGuid().ToString("N"));
        var relogio = new RelogioFixo(agora);
        _atendimento = new AtendimentoAplicacao(repo, repo, repo, repo, new ArmazenamentoLocal(_pasta), relogio, new ClassificadorDemanda(repo), new ExtratorNulo(), repo, new EnvioPushNulo());
        _obras = new ObrasAplicacao(repo);
        _notificacoes = new NotificacaoAplicacao(repo, repo, repo, new ConfiguracaoPushMemoria(null), relogio);
        _login = new LoginAplicacao(repo, new EmissorTokenDemo(TokenDemo.ChaveDesenvolvimento));
    }

    [Fact]
    public async Task Infiltracao_gera_protocolo_na_fila_do_gl()
    {
        var joao = Cessionario(DemoIds.Joao);
        var sugestao = await _atendimento.Sugerir("Estou com uma infiltração no teto da sala 205.", CancellationToken.None);

        Assert.Equal(DemoIds.SubCivil, sugestao.SubcategoriaId);
        Assert.Equal("Manutenção > Civil > Infiltração", sugestao.Resumo);

        var detalhe = await _atendimento.Abrir(
            joao,
            new AbrirComando(sugestao.Resumo is not null ? "Estou com uma infiltração no teto da sala 205." : "", "Sala 205", "Teto, próximo à janela", sugestao.SubcategoriaId, "PORTAL"),
            CancellationToken.None);

        Assert.Equal("GL-2026-00128", detalhe.Protocolo);
        Assert.Equal("Novo", detalhe.Situacao);
        Assert.Equal("Civil / Infiltração", detalhe.Servico);

        var fila = await _atendimento.Listar(new Ator(DemoIds.Gl, Perfil.GlAdministrador, null), CancellationToken.None);
        Assert.Contains(fila, item => item.Protocolo == "GL-2026-00128");
    }

    [Fact]
    public async Task Exportacao_fica_na_fila_visivel()
    {
        var detalhe = await AbrirInfiltracao();
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var planilha = await _atendimento.ExportarPlanilha(gl, CancellationToken.None);
        var csv = System.Text.Encoding.UTF8.GetString(planilha.Conteudo);
        Assert.Contains(detalhe.Protocolo, csv);
        Assert.Contains("Sala 205", csv);
        Assert.StartsWith("protocolo;empresa;local;categoria;situacao;descricao", csv.TrimStart('\uFEFF'));

        var recepcao = new Ator(DemoIds.Resp02, Perfil.ResponsavelArea, DemoIds.AreaRecepcao);
        var csvRecepcao = System.Text.Encoding.UTF8.GetString((await _atendimento.ExportarPlanilha(recepcao, CancellationToken.None)).Conteudo);
        Assert.DoesNotContain(detalhe.Protocolo, csvRecepcao);
        await Assert.ThrowsAsync<AcessoNegadoException>(() => _atendimento.ExportarProtocolo(recepcao, detalhe.Id, CancellationToken.None));

        var outraEmpresa = Cessionario(DemoIds.EmpresaB);
        var csvOutra = System.Text.Encoding.UTF8.GetString((await _atendimento.ExportarPlanilha(outraEmpresa, CancellationToken.None)).Conteudo);
        Assert.DoesNotContain(detalhe.Protocolo, csvOutra);
        await Assert.ThrowsAsync<AcessoNegadoException>(() => _atendimento.ExportarProtocolo(outraEmpresa, detalhe.Id, CancellationToken.None));

        var antes = await _atendimento.Obter(gl, detalhe.Id, CancellationToken.None);
        var pdf = await _atendimento.ExportarProtocolo(gl, detalhe.Id, CancellationToken.None);
        var depois = await _atendimento.Obter(gl, detalhe.Id, CancellationToken.None);
        Assert.Equal(antes.Situacao, depois.Situacao);
        Assert.Equal(antes.Historico.Count, depois.Historico.Count);
        Assert.Equal("application/pdf", pdf.Tipo);
        var corpo = System.Text.Encoding.Latin1.GetString(pdf.Conteudo);
        Assert.StartsWith("%PDF", corpo);
        Assert.Contains(detalhe.Protocolo, corpo);
        Assert.Contains("Sala 205", corpo);
        Assert.Contains(detalhe.Cessionario.Empresa ?? "", corpo);
        Assert.Contains(detalhe.Categoria, corpo);
        Assert.Contains(detalhe.Situacao, corpo);
    }

    [Fact]
    public async Task Agenda_mostra_so_a_fila_autorizada_e_recusa_o_cessionario()
    {
        var detalhe = await AbrirInfiltracao();
        var joao = Cessionario(DemoIds.Joao);
        await _atendimento.Mensagem(joao, detalhe.Id, new MensagemComando("Data desejada: 15/10/2026."), CancellationToken.None);
        var manutencao = new Ator(DemoIds.Resp01, Perfil.ResponsavelArea, DemoIds.AreaManutencao);
        await _atendimento.DefinirPrevisao(manutencao, detalhe.Id, new PrevisaoComando(new DateTime(2026, 10, 8, 14, 0, 0, DateTimeKind.Utc)), CancellationToken.None);

        var agenda = new AgendaAplicacao(new GlRepositorio(_db), new GlRepositorio(_db));
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var doGl = await agenda.Listar(gl, CancellationToken.None);
        Assert.Contains(doGl, item => item.Id == detalhe.Id && item.Marco == "previsao" && item.Data == new DateOnly(2026, 10, 8) && item.Situacao == "Novo");
        Assert.Contains(doGl, item => item.Id == detalhe.Id && item.Marco == "data-desejada" && item.Data == new DateOnly(2026, 10, 15));
        Assert.Contains(doGl, item => item.Origem == "obra" && item.Id == DemoIds.ObraFoyer && item.Marco == "inicio" && item.Data == new DateOnly(2026, 10, 6));
        Assert.Contains(doGl, item => item.Origem == "obra" && item.Id == DemoIds.ObraFoyer && item.Marco == "termino");

        var daArea = await agenda.Listar(manutencao, CancellationToken.None);
        Assert.Contains(daArea, item => item.Id == detalhe.Id && item.Marco == "previsao");
        Assert.Contains(daArea, item => item.Id == detalhe.Id && item.Marco == "data-desejada");
        Assert.DoesNotContain(daArea, item => item.Origem == "obra");

        var recepcao = new Ator(DemoIds.Resp02, Perfil.ResponsavelArea, DemoIds.AreaRecepcao);
        var daRecepcao = await agenda.Listar(recepcao, CancellationToken.None);
        Assert.DoesNotContain(daRecepcao, item => item.Id == detalhe.Id);
        Assert.DoesNotContain(daRecepcao, item => item.Origem == "obra");

        await Assert.ThrowsAsync<AcessoNegadoException>(() => agenda.Listar(joao, CancellationToken.None));
    }

    [Fact]
    public async Task Classificador_cobre_refrigeracao_e_fibra()
    {
        var refrigeracao = await _atendimento.Sugerir("Ar-condicionado parou de funcionar.", CancellationToken.None);
        var fibra = await _atendimento.Sugerir("Preciso instalar fibra na sala.", CancellationToken.None);

        Assert.Equal("Refrigeração", refrigeracao.Subcategoria);
        Assert.Equal("Aprovação", fibra.Fluxo);
        Assert.Equal(DemoIds.SubFibra, fibra.SubcategoriaId);
    }

    [Fact]
    public async Task Responsavel_de_outra_area_nao_ve_o_chamado_e_o_da_area_registra_historico()
    {
        var detalhe = await AbrirInfiltracao();
        var recepcao = new Ator(DemoIds.Resp02, Perfil.ResponsavelArea, DemoIds.AreaRecepcao);
        var filaRecepcao = await _atendimento.Listar(recepcao, CancellationToken.None);
        Assert.DoesNotContain(filaRecepcao, item => item.Id == detalhe.Id);
        await Assert.ThrowsAsync<AcessoNegadoException>(() => _atendimento.Obter(recepcao, detalhe.Id, CancellationToken.None));

        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        await _atendimento.Redirecionar(gl, detalhe.Id, new RedirecionarComando(DemoIds.AreaManutencao, DemoIds.Resp01), CancellationToken.None);

        var manutencao = new Ator(DemoIds.Resp01, Perfil.ResponsavelArea, DemoIds.AreaManutencao);
        var atualizado = await _atendimento.Andamento(
            manutencao,
            detalhe.Id,
            new AndamentoComando("Vistoria realizada. Identificada necessidade de intervenção hidráulica.", "Em andamento"),
            CancellationToken.None);

        Assert.Equal("Em andamento", atualizado.Situacao);
        Assert.Contains(atualizado.Historico, h =>
            h.Autor == "Responsável 01" &&
            h.StatusAnterior == "Recebido" &&
            h.StatusNovo == "Em andamento" &&
            h.Comentario.Contains("Vistoria realizada"));

        var notas = await _notificacoes.Listar(Cessionario(DemoIds.Joao), CancellationToken.None);
        var avisoAtendimento = Assert.Single(notas, n => n.DemandaId == detalhe.Id && !n.Lida && n.Texto.Contains("está em atendimento"));
        Assert.Contains(atualizado.Mensagens, m => m.Id == avisoAtendimento.MensagemId);

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Obter(Cessionario(DemoIds.EmpresaB), detalhe.Id, CancellationToken.None));
    }

    [Fact]
    public async Task Representante_da_mesma_empresa_consulta_e_empresa_estranha_ou_sem_permissao_e_negada()
    {
        var outroRepresentante = new Ator(
            Guid.NewGuid(),
            Perfil.Cessionario,
            null,
            DemoIds.EmpresaExemplo,
            new HashSet<PermissaoCessionario> { PermissaoCessionario.ConsultarEmpresa });

        var detalhe = await _atendimento.Obter(outroRepresentante, DemoIds.Demanda120, CancellationToken.None);

        Assert.Equal("GL-2026-00120", detalhe.Protocolo);

        var semPermissao = new Ator(
            DemoIds.Joao,
            Perfil.Cessionario,
            null,
            DemoIds.EmpresaExemplo,
            new HashSet<PermissaoCessionario>());
        await Assert.ThrowsAsync<AcessoNegadoException>(() => _atendimento.Listar(semPermissao, CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() => _atendimento.Obter(
            new Ator(Guid.NewGuid(), Perfil.Cessionario, null, DemoIds.EmpresaBId, new HashSet<PermissaoCessionario> { PermissaoCessionario.ConsultarEmpresa }),
            DemoIds.Demanda120,
            CancellationToken.None));
    }

    [Fact]
    public async Task Somente_gl_aprova_fibra()
    {
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var aprovada = await _atendimento.Aprovar(gl, DemoIds.Demanda131, new AprovacaoComando("Aprovar", null), CancellationToken.None);

        Assert.Equal("Liberado para execução", aprovada.Situacao);
        Assert.Contains(aprovada.Historico, h => h.Tipo == "APROVACAO" && h.Autor == "Patrícia Lima");

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Aprovar(Cessionario(DemoIds.Joao), DemoIds.Demanda131, new AprovacaoComando("Aprovar", null), CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Aprovar(new Ator(DemoIds.Resp01, Perfil.ResponsavelArea, DemoIds.AreaManutencao), DemoIds.Demanda131, new AprovacaoComando("Reprovar", "fora de escopo"), CancellationToken.None));
    }

    [Fact]
    public async Task Obra_expoe_checklist_e_etapa()
    {
        var obra = await _obras.Obter(DemoIds.ObraFoyer, CancellationToken.None);

        Assert.Equal("Análise", obra.EtapaAtual);
        Assert.Contains("Projeto", obra.Etapas);
        Assert.Contains("Conclusão", obra.Etapas);
        Assert.Equal("Recebido", obra.Documentos.Single(d => d.Nome == "Projeto Executivo").Situacao);
        Assert.Equal(3, obra.Documentos.Count(d => d.Situacao == "Pendente"));
    }

    [Fact]
    public async Task Login_demo_emite_token_do_cessionario()
    {
        var sessao = await _login.Entrar("joao.silva@empresaexemplo.com.br", "Demo@2026", CancellationToken.None);
        Assert.Equal("Cessionário", sessao.Usuario.Perfil);
        Assert.Equal("Empresa Exemplo", sessao.Usuario.Empresa);
        Assert.Equal("/marcas/empresa-exemplo.svg", sessao.Usuario.LogoEmpresa);
        Assert.False(string.IsNullOrWhiteSpace(sessao.Usuario.Foto));
        Assert.False(string.IsNullOrWhiteSpace(sessao.Token));
    }

    [Fact]
    public async Task Cessionario_avalia_servico_concluido_uma_vez()
    {
        var joao = Cessionario(DemoIds.Joao);
        var avaliado = await _atendimento.Avaliar(
            joao,
            DemoIds.Demanda118,
            new AvaliacaoComando(9, "A credencial chegou no prazo."),
            CancellationToken.None);

        Assert.Equal(9, avaliado.NotaAvaliacao);
        Assert.Equal("A credencial chegou no prazo.", avaliado.ComentarioAvaliacao);
        Assert.Contains(avaliado.Historico, h => h.Tipo == "AVALIACAO" && h.Autor == "João Silva");

        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Avaliar(joao, DemoIds.Demanda118, new AvaliacaoComando(8, null), CancellationToken.None));
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Avaliar(joao, DemoIds.Demanda120, new AvaliacaoComando(10, null), CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Avaliar(new Ator(DemoIds.Gl, Perfil.GlAdministrador, null), DemoIds.Demanda125, new AvaliacaoComando(10, null), CancellationToken.None));
    }

    [Fact]
    public async Task Operacao_mostra_atraso_e_reclamacao_na_fila_do_gl()
    {
        var agora = new DateTime(2026, 9, 28, 15, 0, 0, DateTimeKind.Utc);
        var fila = await _atendimento.Listar(new Ator(DemoIds.Gl, Perfil.GlAdministrador, null), CancellationToken.None);
        var atraso = fila.Single(item => item.Protocolo == "GL-2026-00127");
        var reclamacao = fila.Single(item => item.Protocolo == "GL-2026-00121");

        Assert.True(atraso.PrevisaoAtendimento < agora);
        Assert.Null(atraso.PrazoCategoriaHoras);
        Assert.Equal("Em andamento", atraso.Situacao);
        Assert.Equal("Reclamação", reclamacao.Natureza);
        Assert.True(reclamacao.PrevisaoAtendimento < agora);

        var manutencao = await _atendimento.Listar(new Ator(DemoIds.Resp01, Perfil.ResponsavelArea, DemoIds.AreaManutencao), CancellationToken.None);
        Assert.Contains(manutencao, item => item.Protocolo == "GL-2026-00121");
        Assert.DoesNotContain(manutencao, item => item.Protocolo == "GL-2026-00126");

        var aberto = await _atendimento.Abrir(
            Cessionario(DemoIds.Joao),
            new AbrirComando("Quero reclamar do horário da vistoria.", "Sala 205", null, DemoIds.SubCivil, "PORTAL", true),
            CancellationToken.None);
        Assert.Equal("Reclamação", aberto.Natureza);
        Assert.Equal("GL-2026-00128", aberto.Protocolo);
    }

    [Fact]
    public async Task Resumo_do_cessionario_traz_previsao_pendencia_e_esconde_a_gestao_no_contrato()
    {
        var joao = Cessionario(DemoIds.Joao);
        var fila = await _atendimento.Listar(joao, CancellationToken.None);
        var aberto = fila.Single(item => item.Protocolo == "GL-2026-00120");

        Assert.Equal("Em andamento", aberto.Situacao);
        Assert.Equal("Responsável 01", aberto.Responsavel);
        Assert.NotNull(aberto.PrevisaoAtendimento);
        Assert.Equal(1, aberto.Pendencias);
        Assert.Contains(aberto.Complementos, texto => texto.Contains("foto do ponto"));
        Assert.DoesNotContain(fila, item => item.Cessionario != "Empresa Exemplo");
    }

    [Fact]
    public async Task Mensagem_da_gestao_e_resposta_do_celular_ficam_no_chamado()
    {
        var joao = Cessionario(DemoIds.Joao);
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var textoGestao = "A gestão da GL confirma o horário de amanhã.";

        var aposGestao = await _atendimento.Mensagem(gl, DemoIds.Demanda120, new MensagemComando(textoGestao), CancellationToken.None);
        Assert.Contains(aposGestao.Mensagens, m => m.Autor == "Patrícia Lima" && m.Texto == textoGestao && m.Canal == "PORTAL");

        var notas = await _notificacoes.Listar(joao, CancellationToken.None);
        var aviso = notas.Single(n => n.Texto == textoGestao && !n.Lida);
        Assert.Equal(aposGestao.Mensagens.Single(m => m.Texto == textoGestao).Id, aviso.MensagemId);

        var aposResposta = await _atendimento.ResponderNotificacao(
            joao,
            aviso.Id,
            new RespostaNotificacaoComando("Pode vir às 14h. A foto segue em anexo."),
            CancellationToken.None);

        Assert.Contains(aposResposta.Mensagens, m => m.Canal == "CELULAR" && m.Texto.Contains("14h"));
        Assert.Contains(aposResposta.Mensagens, m => m.Texto == textoGestao);

        var fila = await _atendimento.Listar(joao, CancellationToken.None);
        Assert.Equal(0, fila.Single(item => item.Id == DemoIds.Demanda120).Pendencias);

        var manutencao = new Ator(DemoIds.Resp01, Perfil.ResponsavelArea, DemoIds.AreaManutencao);
        var complemento = await _atendimento.Mensagem(
            manutencao,
            DemoIds.Demanda123,
            new MensagemComando("Confirme o horário em que a sala pode ser acessada.", true),
            CancellationToken.None);
        Assert.Contains(complemento.Mensagens, m => m.Finalidade == "complemento" && m.Autor == "Responsável 01");

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Mensagem(joao, DemoIds.Demanda123, new MensagemComando("eu mesmo peço complemento", true), CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.DefinirPrevisao(joao, DemoIds.Demanda123, new PrevisaoComando(new DateTime(2026, 9, 30, 9, 0, 0, DateTimeKind.Utc)), CancellationToken.None));
    }

    [Fact]
    public async Task Conversa_aceita_imagem_com_ou_sem_texto()
    {
        var joao = Cessionario(DemoIds.Joao);
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        await using var png = new MemoryStream([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        var somenteImagem = await _atendimento.MensagemComAnexo(gl, DemoIds.Demanda120, "", "ponto.png", "image/png", png, png.Length, CancellationToken.None);
        var mensagem = Assert.Single(somenteImagem.Mensagens, m => m.AnexoId is not null);
        Assert.Equal("", mensagem.Texto);
        Assert.Contains(somenteImagem.Anexos, a => a.Id == mensagem.AnexoId && a.Nome == "ponto.png");

        var notas = await _notificacoes.Listar(joao, CancellationToken.None);
        var avisoImagem = Assert.Single(notas, n => n.Texto == "Imagem enviada." && !n.Lida);
        Assert.Equal(mensagem.Id, avisoImagem.MensagemId);

        await using var jpg = new MemoryStream([0xFF, 0xD8, 0xFF, 0xD9]);
        var comTexto = await _atendimento.MensagemComAnexo(gl, DemoIds.Demanda120, "Foto do ponto.", "ponto.jpg", "image/jpeg", jpg, jpg.Length, CancellationToken.None);
        Assert.Contains(comTexto.Mensagens, m => m.Texto == "Foto do ponto." && m.AnexoId is not null);

        await using var pdf = new MemoryStream([0x25, 0x50, 0x44, 0x46]);
        var documento = await _atendimento.MensagemComAnexo(gl, DemoIds.Demanda120, "documento", "doc.pdf", "application/pdf", pdf, pdf.Length, CancellationToken.None);
        Assert.Contains(documento.Mensagens, m => m.Texto == "documento" && m.AnexoId is not null);

        await using var webm = new MemoryStream([0x1A, 0x45, 0xDF, 0xA3]);
        var audio = await _atendimento.MensagemComAnexo(gl, DemoIds.Demanda120, "", "recado.webm", "audio/webm", webm, webm.Length, CancellationToken.None);
        var anexoAudio = Assert.Single(audio.Anexos, a => a.Nome == "recado.webm");
        var mensagemAudio = Assert.Single(audio.Mensagens, m => m.AnexoId == anexoAudio.Id);
        var notasAudio = await _notificacoes.Listar(joao, CancellationToken.None);
        var avisoAudio = Assert.Single(notasAudio, n => n.Texto == "Áudio enviado." && !n.Lida);
        Assert.Equal(mensagemAudio.Id, avisoAudio.MensagemId);

        await using var exe = new MemoryStream([0x4D, 0x5A]);
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.MensagemComAnexo(gl, DemoIds.Demanda120, "arquivo", "virus.exe", "application/octet-stream", exe, exe.Length, CancellationToken.None));
    }

    [Fact]
    public async Task Cadeia_do_quadro_e_por_tipo_de_atendimento()
    {
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var responsavel = new Ator(DemoIds.Resp01, Perfil.ResponsavelArea, DemoIds.AreaManutencao);
        var repo = new GlRepositorio(_db);
        var cadeiaApp = new CadeiaAplicacao(repo, repo);
        var tipos = await cadeiaApp.Listar(CancellationToken.None);
        var refrigeracao = tipos.Single(tipo => tipo.SubcategoriaId == DemoIds.SubRefrigeracao);
        var fibra = tipos.Single(tipo => tipo.SubcategoriaId == DemoIds.SubFibra);
        var eletrica = tipos.Single(tipo => tipo.SubcategoriaId == DemoIds.SubEletrica);
        Assert.Contains(refrigeracao.Etapas, etapa => etapa.Codigo == "aprovacao" && etapa.Automatica);
        Assert.Contains(fibra.Etapas, etapa => etapa.Codigo == "aprovacao" && etapa.Automatica == false);
        Assert.Contains(eletrica.Etapas, etapa => etapa.Codigo == "aprovacao" && etapa.Automatica == false);

        var quando = new DateTime(2026, 9, 30, 14, 0, 0, DateTimeKind.Utc);
        var saltou = await _atendimento.Avancar(
            responsavel,
            DemoIds.Demanda123,
            new AvancarComando("Vamos atender a refrigeração.", quando, null),
            CancellationToken.None);
        Assert.Equal("Em andamento", saltou.Situacao);
        Assert.Contains(saltou.Historico, h => h.Comentario.Contains("Aprovação automática"));

        var infiltracao = await AbrirInfiltracao();
        var paraAprovacao = await _atendimento.Avancar(
            gl,
            infiltracao.Id,
            new AvancarComando("Segue para aprovação da solicitação.", null, null),
            CancellationToken.None);
        Assert.Equal("Aguardando aprovação", paraAprovacao.Situacao);

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Avancar(responsavel, DemoIds.Demanda131, new AvancarComando("não", null, null), CancellationToken.None));

        var aprovada = await _atendimento.Avancar(
            gl,
            DemoIds.Demanda131,
            new AvancarComando("Aprovado para instalar a fibra.", quando, null),
            CancellationToken.None);
        Assert.Equal("Liberado para execução", aprovada.Situacao);

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Avancar(Cessionario(DemoIds.Marina), DemoIds.Demanda131, new AvancarComando("Fibra instalada e testada.", null, null), CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Avancar(responsavel, DemoIds.Demanda131, new AvancarComando("Fibra instalada e testada.", null, null), CancellationToken.None));

        var semFoto = await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Avancar(gl, DemoIds.Demanda131, new AvancarComando("Fibra instalada e testada.", null, null), CancellationToken.None));
        Assert.Contains("foto", semFoto.Message, StringComparison.OrdinalIgnoreCase);

        await using var pdfObra = new MemoryStream([0x25, 0x50, 0x44, 0x46]);
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Anexar(gl, DemoIds.Demanda131, "obra.pdf", "application/pdf", pdfObra, pdfObra.Length, CancellationToken.None, "obra"));

        await using var pngObra = new MemoryStream([0x89, 0x50, 0x4E, 0x47]);
        var comFoto = await _atendimento.Anexar(gl, DemoIds.Demanda131, "obra-executada.png", "image/png", pngObra, pngObra.Length, CancellationToken.None, "obra");
        Assert.Contains(comFoto.Anexos, a => a.Finalidade == "obra" && a.Nome == "obra-executada.png");
        Assert.Contains(comFoto.Historico, h => h.Comentario.Contains("Foto da obra executada"));

        var emValidacao = await _atendimento.Avancar(
            new Ator(Guid.NewGuid(), Perfil.ResponsavelArea, DemoIds.AreaInfra),
            DemoIds.Demanda131,
            new AvancarComando("Fibra instalada e testada.", null, null),
            CancellationToken.None);
        Assert.Equal("Aguardando validação", emValidacao.Situacao);

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Avancar(gl, DemoIds.Demanda131, new AvancarComando("ok", null, true), CancellationToken.None));

        var concluida = await _atendimento.Avancar(
            Cessionario(DemoIds.Marina),
            DemoIds.Demanda131,
            new AvancarComando("Ficou como combinado.", null, true),
            CancellationToken.None);
        Assert.Equal("Concluído", concluida.Situacao);
        Assert.Contains(concluida.Historico, h => h.Tipo == "VALIDACAO" && h.Autor == "Marina Costa");

        var invalida = fibra.Etapas.Select(etapa => etapa.Codigo == "aprovacao" ? etapa with { Automatica = true } : etapa).ToArray();
        var recusa = await Assert.ThrowsAsync<RegraNegocioException>(() => cadeiaApp.Salvar(gl, DemoIds.SubFibra, invalida, CancellationToken.None));
        Assert.Contains("não pode exigir", recusa.Message);

        var automatica = fibra.Etapas.Select(etapa =>
        {
            var salta = etapa.Codigo == "aprovacao" || etapa.Automatica;
            var tarefas = salta
                ? etapa.Tarefas.Select(tarefa => tarefa with { Obrigatoria = false }).ToArray()
                : etapa.Tarefas.ToArray();
            return etapa with { Automatica = salta, Tarefas = tarefas, Campos = tarefas.Select(tarefa => tarefa.Codigo).ToArray() };
        }).ToArray();
        await Assert.ThrowsAsync<AcessoNegadoException>(() => cadeiaApp.Salvar(responsavel, DemoIds.SubFibra, automatica, CancellationToken.None));
        var salva = await cadeiaApp.Salvar(gl, DemoIds.SubFibra, automatica, CancellationToken.None);
        Assert.Contains(salva, etapa => etapa.Codigo == "aprovacao" && etapa.Automatica);

        var depois = await cadeiaApp.Listar(CancellationToken.None);
        Assert.Contains(
            depois.Single(tipo => tipo.SubcategoriaId == DemoIds.SubEletrica).Etapas,
            etapa => etapa.Codigo == "aprovacao" && etapa.Automatica == false);
        Assert.Contains(
            depois.Single(tipo => tipo.SubcategoriaId == DemoIds.SubRefrigeracao).Etapas,
            etapa => etapa.Codigo == "aprovacao" && etapa.Automatica);

        var comPrevisaoOpcional = salva.Select(etapa =>
        {
            if (etapa.Codigo != "atendimento") return etapa;
            var tarefas = new[]
            {
                new TarefaCadeiaDto("comentario", true),
                new TarefaCadeiaDto("previsao", false)
            };
            return etapa with { Tarefas = tarefas, Campos = tarefas.Select(tarefa => tarefa.Codigo).ToArray() };
        }).ToArray();
        await cadeiaApp.Salvar(gl, DemoIds.SubFibra, comPrevisaoOpcional, CancellationToken.None);
        var fibraDepois = (await cadeiaApp.Listar(CancellationToken.None)).Single(tipo => tipo.SubcategoriaId == DemoIds.SubFibra);
        var atendimento = fibraDepois.Etapas.Single(etapa => etapa.Codigo == "atendimento");
        Assert.Contains(atendimento.Tarefas, tarefa => tarefa.Codigo == "previsao" && tarefa.Obrigatoria == false);
        Assert.Contains(atendimento.Tarefas, tarefa => tarefa.Codigo == "comentario" && tarefa.Obrigatoria);
        var etapaAtendimento = new EtapaCadeia(
            "atendimento",
            "Atendimento",
            3,
            false,
            ["comentario", "previsao"],
            [new TarefaCadeia("comentario", true), new TarefaCadeia("previsao", false)]);
        CadeiaAtendimento.ExigirCampos(etapaAtendimento, "Fibra conferida.", null, null, false);
        Assert.Contains(
            (await cadeiaApp.Listar(CancellationToken.None)).Single(tipo => tipo.SubcategoriaId == DemoIds.SubEletrica).Etapas.Single(etapa => etapa.Codigo == "atendimento").Tarefas,
            tarefa => tarefa.Codigo == "previsao" && tarefa.Obrigatoria);
    }

    private static Ator Cessionario(Guid usuarioId)
    {
        var empresaId = usuarioId switch
        {
            var id when id == DemoIds.Joao => DemoIds.EmpresaExemplo,
            var id when id == DemoIds.EmpresaB => DemoIds.EmpresaBId,
            var id when id == DemoIds.EmpresaC => DemoIds.EmpresaCId,
            var id when id == DemoIds.EmpresaD => DemoIds.EmpresaDId,
            var id when id == DemoIds.Marina => DemoIds.EmpresaConecta,
            _ => throw new ArgumentOutOfRangeException(nameof(usuarioId))
        };
        return new Ator(usuarioId, Perfil.Cessionario, null, empresaId, Enum.GetValues<PermissaoCessionario>().ToHashSet());
    }

    private async Task<DetalheDemandaDto> AbrirInfiltracao()
    {
        var sugestao = await _atendimento.Sugerir("Tem água entrando pelo teto.", CancellationToken.None);
        return await _atendimento.Abrir(
            Cessionario(DemoIds.Joao),
            new AbrirComando("Tem água entrando pelo teto.", "Sala 205", "Teto", sugestao.SubcategoriaId, "PORTAL"),
            CancellationToken.None);
    }

    [Fact]
    public async Task Gl_encerra_concluido_e_cancela_em_aberto()
    {
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var responsavel = new Ator(DemoIds.Resp02, Perfil.ResponsavelArea, DemoIds.AreaRecepcao);
        var joao = Cessionario(DemoIds.Joao);

        var concluidaRecusada = await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Mensagem(gl, DemoIds.Demanda118, new MensagemComando("Ainda concluído."), CancellationToken.None));
        Assert.Contains("não aceita alterações", concluidaRecusada.Message);

        var encerrada = await _atendimento.Encerrar(gl, DemoIds.Demanda118, CancellationToken.None);
        Assert.Equal("Encerrada", encerrada.Situacao);
        Assert.Contains(encerrada.Historico, item => item.StatusAnterior == "Concluído" && item.StatusNovo == "Encerrada" && item.Tipo == "ENCERRAMENTO");

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Encerrar(joao, DemoIds.Demanda122, CancellationToken.None));
        await Assert.ThrowsAsync<TransicaoInvalidaException>(() =>
            _atendimento.Encerrar(gl, DemoIds.Demanda119, CancellationToken.None));

        var avaliada = await _atendimento.Avaliar(joao, DemoIds.Demanda118, new AvaliacaoComando(9, "Depois do encerramento."), CancellationToken.None);
        Assert.Equal(9, avaliada.NotaAvaliacao);

        var mensagemRecusada = await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Mensagem(gl, DemoIds.Demanda118, new MensagemComando("Depois do encerramento."), CancellationToken.None));
        Assert.Contains("não aceita alterações", mensagemRecusada.Message);
        await using var pngEncerrado = new MemoryStream([0x89, 0x50, 0x4E, 0x47]);
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Anexar(gl, DemoIds.Demanda118, "depois.png", "image/png", pngEncerrado, pngEncerrado.Length, CancellationToken.None));
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.DefinirPrevisao(gl, DemoIds.Demanda118, new PrevisaoComando(DateTime.UtcNow.AddDays(1)), CancellationToken.None));

        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Cancelar(gl, DemoIds.Demanda119, new CancelamentoComando("  "), CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            _atendimento.Cancelar(responsavel, DemoIds.Demanda119, new CancelamentoComando("Não vamos seguir."), CancellationToken.None));
        var cancelada = await _atendimento.Cancelar(gl, DemoIds.Demanda119, new CancelamentoComando("O cessionário desistiu do pedido."), CancellationToken.None);
        Assert.Equal("Cancelada", cancelada.Situacao);
        Assert.Contains(cancelada.Historico, item => item.Tipo == "CANCELAMENTO" && item.Comentario == "O cessionário desistiu do pedido.");
        await Assert.ThrowsAsync<TransicaoInvalidaException>(() =>
            _atendimento.Cancelar(gl, DemoIds.Demanda118, new CancelamentoComando("Tarde demais."), CancellationToken.None));
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _atendimento.Mensagem(gl, DemoIds.Demanda119, new MensagemComando("Depois do cancelamento."), CancellationToken.None));
    }

    [Fact]
    public async Task Fila_recebe_a_meta_de_prazo_da_categoria()
    {
        var gl = new Ator(DemoIds.Gl, Perfil.GlAdministrador, null);
        var admin = new CatalogoAdministracaoAplicacao(new GlRepositorio(_db), new GlRepositorio(_db));
        await admin.SalvarCategoria(gl, DemoIds.CatManutencao, "Manutenção", true, 48, null, CancellationToken.None);

        var fila = await _atendimento.Listar(gl, CancellationToken.None);
        Assert.Contains(fila, item => item.SubcategoriaId == DemoIds.SubCivil && item.PrazoCategoriaHoras == 48);
        Assert.Contains(fila, item => item.SubcategoriaId == DemoIds.SubFibra && item.PrazoCategoriaHoras is null);
    }

    public void Dispose()
    {
        _banco.Dispose();
        if (Directory.Exists(_pasta))
            Directory.Delete(_pasta, true);
    }

    private sealed class RelogioFixo(DateTime agora) : IRelogio
    {
        public DateTime UtcNow => agora;
    }

    private sealed class ExtratorNulo : IExtratorSolicitacao
    {
        public Task<LeituraSolicitacao?> Extrair(string texto, DateOnly hoje, CancellationToken ct) =>
            Task.FromResult<LeituraSolicitacao?>(null);
    }
}
