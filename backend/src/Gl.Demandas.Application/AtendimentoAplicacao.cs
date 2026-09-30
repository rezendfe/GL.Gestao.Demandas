using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed class AtendimentoAplicacao(
    IDemandas demandas,
    IUsuarios usuarios,
    ICatalogo catalogo,
    INotificacoes notificacoes,
    IAnexoStorage armazenamento,
    IRelogio relogio,
    IClassificadorDemanda classificador,
    IExtratorSolicitacao extrator,
    ICadeia cadeia)
{
    private const long TamanhoMaximo = 5 * 1024 * 1024;
    private static readonly HashSet<string> Extensoes = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".pdf"
    };

    public async Task<SugestaoDto> Sugerir(string texto, CancellationToken ct)
    {
        var sugestao = await classificador.Sugerir(texto, ct)
            ?? throw new RegraNegocioException("Não foi possível sugerir uma classificação. Corrija escolhendo a categoria.");
        return Mapear(sugestao);
    }

    public async Task<PreenchimentoDto> Preencher(string texto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(texto))
            throw new RegraNegocioException("Descreva o que está acontecendo antes de preencher os campos.");

        var hoje = CalendarioSolicitacao.HojeEmSaoPaulo(relogio.UtcNow);
        var limitado = texto.Trim();
        if (limitado.Length > 4000)
            limitado = limitado[..4000];

        var leituraModelo = await extrator.Extrair(limitado, hoje, ct);
        var usouModelo = leituraModelo is not null && !leituraModelo.Vazia;
        var leitura = usouModelo ? leituraModelo! : LeitorSolicitacao.Ler(limitado, hoje);
        var sugestao = await SugestaoDoPreenchimento(limitado, leitura.Subcategoria, ct);

        return new PreenchimentoDto(
            leitura.Assunto,
            leitura.Sala,
            leitura.Ponto,
            leitura.DataDesejada?.ToString("yyyy-MM-dd"),
            leitura.Periodo,
            leitura.Telefone,
            leitura.Itens,
            leitura.AutorizaAcesso,
            sugestao,
            usouModelo ? "modelo" : "leitura-local",
            usouModelo
                ? "Campos preenchidos a partir da fala. Revise antes de abrir o chamado. A classificação é uma sugestão."
                : "A leitura automática preencheu o que reconheceu no texto. Revise antes de abrir o chamado. A classificação é uma sugestão.");
    }

    public async Task<DetalheDemandaDto> Abrir(Ator ator, AbrirComando comando, CancellationToken ct)
    {
        if (ator.Perfil != Perfil.Cessionario || !Pode(ator, PermissaoCessionario.AbrirDemanda) || ator.EmpresaId is null)
            throw new AcessoNegadoException("A abertura do chamado é feita pelo Cessionário.");

        var cessionario = await usuarios.Obter(ator.Id, ct) ?? throw new NaoEncontradaException("Usuário não encontrado.");
        var sub = await catalogo.ObterSubcategoria(comando.SubcategoriaId, ct)
            ?? throw new RegraNegocioException("Selecione uma categoria válida.");
        var categorias = await catalogo.ListarCategorias(ct);
        if (!sub.Ativa || !categorias.Any(c => c.Id == sub.CategoriaId && c.Ativa))
            throw new RegraNegocioException("O tipo de atendimento selecionado está inativo.");
        var areas = await catalogo.ListarAreas(ct);
        var categoria = categorias.First(c => c.Id == sub.CategoriaId);
        var area = areas.First(a => a.Id == sub.AreaId);
        var sugestao = await classificador.Sugerir(comando.Descricao, ct);
        var confirmouSugestao = sugestao is not null && sugestao.SubcategoriaId == sub.Id;

        var agora = relogio.UtcNow;
        var numero = Protocolo.Proximo(await demandas.ListarProtocolos(ct), agora.Year);
        var demanda = Demanda.Abrir(
            Guid.NewGuid(),
            Protocolo.Montar(agora.Year, numero),
            cessionario.Id,
            cessionario.Empresa ?? cessionario.Nome,
            string.IsNullOrWhiteSpace(comando.Sala) ? cessionario.Sala ?? "" : comando.Sala,
            comando.Descricao,
            comando.Ponto,
            categoria.Id,
            sub.Id,
            area.Id,
            confirmouSugestao ? sugestao!.Servico : sub.Nome,
            confirmouSugestao ? sugestao!.Destino : area.Nome,
            confirmouSugestao ? sugestao!.Prioridade : "Normal",
            confirmouSugestao ? sugestao!.OrdemPrioridade : 3,
            confirmouSugestao ? sugestao!.Confianca : "Média",
            sub.Fluxo,
            ajustadaPeloCessionario: !confirmouSugestao,
            comando.Canal,
            agora,
            comando.Reclamacao,
            await AprovacaoAutomatica(sub.Id, ct),
            ator.EmpresaId);

        await demandas.Adicionar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<IReadOnlyList<FilaItemDto>> Listar(Ator ator, CancellationToken ct)
    {
        if (ator.Perfil == Perfil.Cessionario && !Pode(ator, PermissaoCessionario.ConsultarEmpresa))
            throw new AcessoNegadoException("A função do representante não permite consultar demandas da empresa.");
        var pessoas = (await usuarios.Listar(ct)).ToDictionary(u => u.Id);
        var itens = await demandas.Listar(ct);
        return itens
            .Where(d => Visivel(d, ator))
            .OrderBy(d => d.OrdemPrioridade)
            .ThenByDescending(d => d.AbertoEm)
            .Select(d => new FilaItemDto(
                d.Id,
                d.Protocolo,
                d.Empresa,
                d.Servico,
                d.Situacao.ParaTexto(),
                d.ResponsavelId is Guid responsavel && pessoas.TryGetValue(responsavel, out var pessoa)
                    ? pessoa.Nome
                    : "A definir",
                d.Prioridade,
                d.AbertoEm,
                d.Fluxo.ParaTexto(),
                d.PrevisaoAtendimento,
                d.PendenciasAbertas(),
                d.ComplementosPendentes(),
                d.Natureza,
                d.NotaAvaliacao,
                d.ComentarioAvaliacao,
                d.SubcategoriaId))
            .ToArray();
    }

    public async Task<DetalheDemandaDto> Obter(Ator ator, Guid id, CancellationToken ct)
    {
        if (ator.Perfil == Perfil.Cessionario && !Pode(ator, PermissaoCessionario.ConsultarEmpresa))
            throw new AcessoNegadoException("A função do representante não permite consultar demandas da empresa.");
        var demanda = await Exigir(id, ct);
        demanda.GarantirLeitura(ator.Perfil, ator.Id, ator.AreaId, ator.EmpresaId);
        return await Detalhe(demanda, ct);
    }

    public async Task<DetalheDemandaDto> Classificar(Ator ator, Guid id, Guid subcategoriaId, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        var sub = await catalogo.ObterSubcategoria(subcategoriaId, ct)
            ?? throw new RegraNegocioException("Selecione uma categoria válida.");
        var categoria = (await catalogo.ListarCategorias(ct)).FirstOrDefault(item => item.Id == sub.CategoriaId);
        if (!sub.Ativa || categoria is not { Ativa: true })
            throw new RegraNegocioException("O tipo de atendimento selecionado está inativo.");
        var areas = await catalogo.ListarAreas(ct);
        var area = areas.First(a => a.Id == sub.AreaId);
        var mesma = demanda.SubcategoriaId == sub.Id;
        demanda.ConfirmarClassificacao(
            ator.Perfil,
            ator.Id,
            sub,
            mesma ? demanda.Servico : sub.Nome,
            mesma ? demanda.Destino : area.Nome,
            demanda.Prioridade,
            demanda.OrdemPrioridade,
            sub.Fluxo,
            relogio.UtcNow,
            await AprovacaoAutomatica(sub.Id, ct));
        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<DetalheDemandaDto> Redirecionar(Ator ator, Guid id, RedirecionarComando comando, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        var areas = await catalogo.ListarAreas(ct);
        var area = areas.FirstOrDefault(a => a.Id == comando.AreaId)
            ?? throw new RegraNegocioException("Selecione a área de destino.");
        if (comando.ResponsavelId is Guid responsavelId)
        {
            var responsavel = await usuarios.Obter(responsavelId, ct)
                ?? throw new RegraNegocioException("Responsável não encontrado.");
            if (responsavel.Perfil != Perfil.ResponsavelArea)
                throw new RegraNegocioException("O destino precisa ser um Responsável da Área.");
        }

        demanda.Redirecionar(ator.Perfil, ator.Id, area.Id, comando.ResponsavelId, area.Nome, relogio.UtcNow);
        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<DetalheDemandaDto> Andamento(Ator ator, Guid id, AndamentoComando comando, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        var nova = SituacaoDemandaTexto.ParaSituacao(comando.Situacao);
        var entrouEmAtendimento = demanda.RegistrarAndamento(
            ator.Perfil,
            ator.Id,
            ator.AreaId,
            nova,
            comando.Comentario,
            relogio.UtcNow);

        if (entrouEmAtendimento)
        {
            var agora = relogio.UtcNow;
            var textoPortal = $"Sua solicitação {demanda.Protocolo} está em atendimento.";
            var textoMensageria = $"Sua solicitação {demanda.Protocolo} teve uma atualização. Acompanhe os detalhes no portal GL.";
            await notificacoes.Adicionar(Notificacao.Criar(demanda.Id, demanda.CessionarioId, textoPortal, agora), ct);
            demanda.IncluirMensagem(ator.Id, textoMensageria, "MENSAGERIA", agora);
            demanda.RegistrarEvento(ator.Id, "Notificação complementar registrada para o cessionário.", "NOTIFICACAO", agora);
        }

        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<DetalheDemandaDto> Avancar(Ator ator, Guid id, AvancarComando comando, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        if (ator.Perfil == Perfil.Cessionario)
        {
            ExigirEmpresaDaDemanda(ator, demanda);
            ExigirPermissao(ator, PermissaoCessionario.ValidarServico);
        }
        var etapas = await cadeia.Obter(demanda.SubcategoriaId, ct);
        var resultado = demanda.Avancar(
            ator.Perfil,
            ator.Id,
            ator.AreaId,
            etapas,
            comando.Comentario,
            comando.Previsao,
            comando.Confirmacao,
            relogio.UtcNow,
            ator.EmpresaId);

        if (resultado.EntrouEmAtendimento)
        {
            var texto = $"Sua solicitação {demanda.Protocolo} está em atendimento.";
            await notificacoes.Adicionar(Notificacao.Criar(demanda.Id, demanda.CessionarioId, texto, relogio.UtcNow), ct);
            demanda.IncluirMensagem(ator.Id, texto, "MENSAGERIA", relogio.UtcNow);
            demanda.RegistrarEvento(ator.Id, "Notificação complementar registrada para o cessionário.", "NOTIFICACAO", relogio.UtcNow);
        }

        if (resultado.AguardaValidacao)
        {
            var texto = $"Sua solicitação {demanda.Protocolo} aguarda a sua validação.";
            await notificacoes.Adicionar(Notificacao.Criar(demanda.Id, demanda.CessionarioId, texto, relogio.UtcNow), ct);
            demanda.IncluirMensagem(ator.Id, texto, "MENSAGERIA", relogio.UtcNow);
            demanda.RegistrarEvento(ator.Id, "Validação do Cessionário solicitada.", "NOTIFICACAO", relogio.UtcNow);
        }

        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    private async Task<bool> AprovacaoAutomatica(Guid subcategoriaId, CancellationToken ct) =>
        (await cadeia.Obter(subcategoriaId, ct)).First(etapa => etapa.Codigo == CadeiaAtendimento.Aprovacao).Automatica;

    public async Task<DetalheDemandaDto> DefinirPrevisao(Ator ator, Guid id, PrevisaoComando comando, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        demanda.DefinirPrevisao(ator.Perfil, ator.Id, ator.AreaId, comando.Quando, relogio.UtcNow);
        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<DetalheDemandaDto> Mensagem(Ator ator, Guid id, MensagemComando comando, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        if (ator.Perfil == Perfil.Cessionario)
        {
            ExigirEmpresaDaDemanda(ator, demanda);
            ExigirPermissao(ator, PermissaoCessionario.ResponderComplementar);
        }
        var finalidade = comando.Complemento ? "complemento" : "mensagem";
        demanda.AdicionarMensagem(ator.Perfil, ator.Id, ator.AreaId, comando.Texto, "PORTAL", relogio.UtcNow, finalidade, ator.EmpresaId);
        await AvisarCelular(demanda, ator.Id, comando.Texto, ct);
        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<DetalheDemandaDto> ResponderNotificacao(Ator ator, Guid notificacaoId, RespostaNotificacaoComando comando, CancellationToken ct)
    {
        if (ator.Perfil != Perfil.Cessionario)
            throw new AcessoNegadoException("A resposta no celular é do Cessionário.");
        ExigirPermissao(ator, PermissaoCessionario.ResponderComplementar);

        var nota = await notificacoes.Obter(notificacaoId, ct)
            ?? throw new NaoEncontradaException("Notificação não encontrada.");
        var demanda = await Exigir(nota.DemandaId, ct);
        ExigirEmpresaDaDemanda(ator, demanda);
        if (nota.UsuarioId == ator.Id)
            nota.MarcarLida(ator.Id);
        if (!demanda.EmAberto)
            throw new RegraNegocioException("Este chamado já foi encerrado.");

        demanda.AdicionarMensagem(ator.Perfil, ator.Id, ator.AreaId, comando.Texto, "CELULAR", relogio.UtcNow, empresaCessionariaId: ator.EmpresaId);
        await demandas.Salvar(demanda, ct);
        await notificacoes.Salvar(nota, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<DetalheDemandaDto> Anexar(Ator ator, Guid id, string nome, string tipo, Stream conteudo, long tamanho, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        if (ator.Perfil == Perfil.Cessionario)
        {
            ExigirEmpresaDaDemanda(ator, demanda);
            ExigirPermissao(ator, PermissaoCessionario.AnexarDocumento);
        }
        var extensao = Path.GetExtension(nome);
        if (!Extensoes.Contains(extensao))
            throw new RegraNegocioException("Envie uma foto JPG, PNG, WEBP ou um PDF.");
        if (tamanho <= 0 || tamanho > TamanhoMaximo)
            throw new RegraNegocioException("O arquivo deve ter até 5 MB.");

        var caminho = await armazenamento.Salvar(demanda.Id, nome, conteudo, ct);
        var anexo = new Anexo(Guid.NewGuid(), Path.GetFileName(nome), caminho, tipo, tamanho, relogio.UtcNow);
        demanda.AdicionarAnexo(ator.Perfil, ator.Id, ator.AreaId, anexo, relogio.UtcNow, ator.EmpresaId);
        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<AnexoConteudo> Baixar(Ator ator, Guid demandaId, Guid anexoId, CancellationToken ct)
    {
        var demanda = await Exigir(demandaId, ct);
        if (ator.Perfil == Perfil.Cessionario)
            ExigirPermissao(ator, PermissaoCessionario.ConsultarEmpresa);
        demanda.GarantirLeitura(ator.Perfil, ator.Id, ator.AreaId, ator.EmpresaId);
        var anexo = demanda.Anexos.FirstOrDefault(a => a.Id == anexoId)
            ?? throw new NaoEncontradaException("Anexo não encontrado.");
        var stream = await armazenamento.Abrir(anexo.Caminho, ct)
            ?? throw new NaoEncontradaException("O arquivo não está disponível no storage.");
        return new AnexoConteudo(anexo.Nome, anexo.Tipo, stream);
    }

    public async Task<DetalheDemandaDto> Aprovar(Ator ator, Guid id, AprovacaoComando comando, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        demanda.Decidir(ator.Perfil, ator.Id, comando.Decisao, comando.Motivo, relogio.UtcNow);
        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    public async Task<DetalheDemandaDto> Avaliar(Ator ator, Guid id, AvaliacaoComando comando, CancellationToken ct)
    {
        var demanda = await Exigir(id, ct);
        if (ator.Perfil == Perfil.Cessionario)
        {
            ExigirEmpresaDaDemanda(ator, demanda);
            ExigirPermissao(ator, PermissaoCessionario.AvaliarAtendimento);
        }
        demanda.Avaliar(ator.Perfil, ator.Id, comando.Nota, comando.Comentario, relogio.UtcNow, ator.EmpresaId);
        await demandas.Salvar(demanda, ct);
        return await Detalhe(demanda, ct);
    }

    private async Task AvisarCelular(Demanda demanda, Guid autorId, string texto, CancellationToken ct)
    {
        if (autorId == demanda.CessionarioId || !demanda.EmAberto)
            return;

        var aviso = texto.Trim();
        if (aviso.Length > 500)
            aviso = aviso[..500];
        await notificacoes.Adicionar(Notificacao.Criar(demanda.Id, demanda.CessionarioId, aviso, relogio.UtcNow), ct);
    }

    private async Task<Demanda> Exigir(Guid id, CancellationToken ct) =>
        await demandas.Obter(id, ct) ?? throw new NaoEncontradaException("Demanda não encontrada.");

    private async Task<DetalheDemandaDto> Detalhe(Demanda demanda, CancellationToken ct)
    {
        var pessoas = (await usuarios.Listar(ct)).ToDictionary(u => u.Id);
        var categorias = (await catalogo.ListarCategorias(ct)).ToDictionary(c => c.Id);
        var subcategorias = (await catalogo.ListarSubcategorias(ct)).ToDictionary(s => s.Id);
        var areas = (await catalogo.ListarAreas(ct)).ToDictionary(a => a.Id);
        var notas = await notificacoes.ListarDoUsuario(demanda.CessionarioId, ct);
        var naoLidas = notas.Count(n => n.DemandaId == demanda.Id && !n.Lida);

        PessoaDto Pessoa(Guid id)
        {
            var pessoa = pessoas[id];
            return new PessoaDto(pessoa.Id, pessoa.Nome, pessoa.Empresa, pessoa.Sala);
        }

        return new DetalheDemandaDto(
            demanda.Id,
            demanda.Protocolo,
            Pessoa(demanda.CessionarioId),
            demanda.Descricao,
            demanda.Ponto,
            demanda.CategoriaId,
            categorias[demanda.CategoriaId].Nome,
            demanda.SubcategoriaId,
            subcategorias[demanda.SubcategoriaId].Nome,
            demanda.AreaId,
            areas[demanda.AreaId].Nome,
            demanda.Servico,
            demanda.Destino,
            demanda.Situacao.ParaTexto(),
            demanda.Prioridade,
            demanda.Confianca,
            demanda.Classificacao,
            demanda.Fluxo.ParaTexto(),
            demanda.ResponsavelId is Guid responsavel ? Pessoa(responsavel) : null,
            demanda.AbertoEm,
            demanda.AtualizadoEm,
            demanda.PrevisaoAtendimento,
            demanda.Mensagens
                .OrderBy(m => m.EnviadaEm)
                .Select(m => new MensagemDto(m.Id, pessoas[m.AutorId].Nome, m.Texto, m.Canal, m.EnviadaEm, m.Finalidade))
                .ToArray(),
            demanda.Anexos
                .OrderBy(a => a.EnviadoEm)
                .Select(a => new AnexoDto(a.Id, a.Nome, a.Tipo, a.Tamanho))
                .ToArray(),
            demanda.Historico
                .OrderBy(h => h.EventoEm)
                .Select(h => new HistoricoDto(
                    h.Id,
                    pessoas[h.UsuarioId].Nome,
                    h.StatusAnterior,
                    h.StatusNovo,
                    h.Comentario,
                    h.TipoEvento,
                    h.EventoEm))
                .ToArray(),
            naoLidas,
            demanda.Natureza,
            demanda.NotaAvaliacao,
            demanda.ComentarioAvaliacao);
    }

    private static bool Visivel(Demanda demanda, Ator ator) => ator.Perfil switch
    {
        Perfil.GlAdministrador => true,
        Perfil.Cessionario => Pode(ator, PermissaoCessionario.ConsultarEmpresa) &&
            ator.EmpresaId is Guid empresaId && demanda.EmpresaCessionariaId == empresaId,
        Perfil.ResponsavelArea => demanda.AreaId == ator.AreaId,
        _ => false
    };

    private static bool Pode(Ator ator, PermissaoCessionario permissao) =>
        ator.Permissoes?.Contains(permissao) == true;

    private static void ExigirPermissao(Ator ator, PermissaoCessionario permissao)
    {
        if (!Pode(ator, permissao))
            throw new AcessoNegadoException("A função do representante não permite esta ação.");
    }

    private static void ExigirEmpresaDaDemanda(Ator ator, Demanda demanda)
    {
        if (ator.Perfil != Perfil.Cessionario || ator.EmpresaId is not Guid empresaId || demanda.EmpresaCessionariaId != empresaId)
            throw new AcessoNegadoException();
    }

    private async Task<SugestaoDto?> SugestaoDoPreenchimento(string texto, string? subcategoriaNome, CancellationToken ct)
    {
        var porRegra = await classificador.Sugerir(texto, ct);
        if (string.IsNullOrWhiteSpace(subcategoriaNome))
            return porRegra is null ? null : Mapear(porRegra);

        var subcategorias = await catalogo.ListarSubcategorias(ct);
        var alvo = Texto.Normalizar(subcategoriaNome);
        var sub = subcategorias.FirstOrDefault(item => Texto.Normalizar(item.Nome) == alvo);
        if (sub is null)
            return porRegra is null ? null : Mapear(porRegra);
        if (porRegra is not null && porRegra.SubcategoriaId == sub.Id)
            return Mapear(porRegra);

        var categoria = (await catalogo.ListarCategorias(ct)).First(item => item.Id == sub.CategoriaId);
        var area = (await catalogo.ListarAreas(ct)).First(item => item.Id == sub.AreaId);
        return new SugestaoDto(
            categoria.Id,
            categoria.Nome,
            sub.Id,
            sub.Nome,
            area.Id,
            sub.Nome,
            area.Nome,
            "Média",
            "Normal",
            sub.Fluxo.ParaTexto(),
            $"{categoria.Nome} > {sub.Nome}");
    }

    private static SugestaoDto Mapear(SugestaoClassificacao sugestao) =>
        new(
            sugestao.CategoriaId,
            sugestao.Categoria,
            sugestao.SubcategoriaId,
            sugestao.Subcategoria,
            sugestao.AreaId,
            sugestao.Servico,
            sugestao.Destino,
            sugestao.Confianca,
            sugestao.Prioridade,
            sugestao.Fluxo.ParaTexto(),
            sugestao.Resumo);
}
