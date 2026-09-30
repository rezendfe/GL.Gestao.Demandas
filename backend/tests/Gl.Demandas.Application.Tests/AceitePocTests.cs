using Gl.Demandas.Application;
using Gl.Demandas.Domain;
using Gl.Demandas.Infrastructure;
using Gl.Demandas.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gl.Demandas.Application.Tests;

public sealed class AceitePocTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AtendimentoAplicacao _atendimento;
    private readonly ObrasAplicacao _obras;
    private readonly NotificacaoAplicacao _notificacoes;
    private readonly LoginAplicacao _login;
    private readonly string _pasta;

    public AceitePocTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        var agora = new DateTime(2026, 9, 28, 15, 0, 0, DateTimeKind.Utc);
        DemoSeed.Aplicar(_db, agora);
        var repo = new GlRepositorio(_db);
        _pasta = Path.Combine(Path.GetTempPath(), "gl-poc-tests", Guid.NewGuid().ToString("N"));
        var relogio = new RelogioFixo(agora);
        _atendimento = new AtendimentoAplicacao(repo, repo, repo, repo, new ArmazenamentoLocal(_pasta), relogio, new ClassificadorDemanda(repo), new ExtratorNulo(), repo);
        _obras = new ObrasAplicacao(repo);
        _notificacoes = new NotificacaoAplicacao(repo, repo);
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
        Assert.Contains(notas, n => n.DemandaId == detalhe.Id && !n.Lida && n.Texto.Contains("está em atendimento"));

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

        var emValidacao = await _atendimento.Avancar(
            gl,
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

        var automatica = fibra.Etapas.Select(etapa => etapa with { Automatica = etapa.Codigo == "aprovacao" || etapa.Automatica }).ToArray();
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

    public void Dispose()
    {
        _db.Dispose();
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
