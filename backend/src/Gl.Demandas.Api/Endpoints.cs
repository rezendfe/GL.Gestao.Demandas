using System.Security.Claims;
using Gl.Demandas.Application;
using Gl.Demandas.Domain;

namespace Gl.Demandas.Api;

public static class Endpoints
{
    public static void MapGlEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");
        auth.MapPost("/login", async (LoginPedido pedido, LoginAplicacao login, CancellationToken ct) =>
            Results.Ok(await login.Entrar(pedido.Email, pedido.Senha, ct)))
            .WithName("LoginDemo")
            .WithSummary("Autentica um usuário de demonstração e devolve o JWT.")
            .AllowAnonymous();

        auth.MapGet("/eu", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, LoginAplicacao login, CancellationToken ct) =>
            Results.Ok(await login.Eu(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("Eu")
            .WithSummary("Devolve o perfil da sessão atual.")
            .RequireAuthorization();

        app.MapPost("/api/classificacao/sugerir", async (SugestaoPedido pedido, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Sugerir(pedido.Texto, ct)))
            .WithName("SugerirClassificacao")
            .WithTags("Classificação")
            .WithSummary("Sugere categoria, subcategoria e destino a partir do texto livre.")
            .RequireAuthorization();

        app.MapPost("/api/solicitacoes/preencher", async (PreencherPedido pedido, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Preencher(pedido.Texto, ct)))
            .WithName("PreencherSolicitacao")
            .WithTags("Classificação")
            .WithSummary("Lê a descrição ditada e devolve os campos do formulário de abertura.")
            .RequireAuthorization();

        app.MapGet("/api/catalogo", async (CatalogoAplicacao catalogo, CancellationToken ct) =>
            Results.Ok(await catalogo.Obter(ct)))
            .WithName("ObterCatalogo")
            .WithTags("Catálogo")
            .WithSummary("Lista categorias, áreas e responsáveis para a correção da classificação.")
            .RequireAuthorization();

        var catalogoAdmin = app.MapGroup("/api/catalogo").WithTags("Catálogo").RequireAuthorization();
        catalogoAdmin.MapPost("/categorias", async (CategoriaCadastroPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, CatalogoAdministracaoAplicacao appCaso, CatalogoAplicacao catalogo, CancellationToken ct) =>
        {
            await appCaso.SalvarCategoria(await AtorAtual(user, usuarios, config, ct), pedido.Id, pedido.Nome, pedido.Ativa, pedido.PrazoHoras, ModeloAbertura.Interpretar(pedido.Modelo?.Assunto, pedido.Modelo?.Ponto, pedido.Modelo?.Periodo, pedido.Modelo?.Itens), ct);
            return Results.Ok(await catalogo.Obter(ct));
        })
            .WithName("SalvarCategoriaCatalogo")
            .WithSummary("GL / Administrador cadastra ou atualiza uma categoria.");
        catalogoAdmin.MapPost("/tipos-atendimento", async (TipoAtendimentoCadastroPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, CatalogoAdministracaoAplicacao appCaso, CatalogoAplicacao catalogo, CancellationToken ct) =>
        {
            await appCaso.SalvarTipo(await AtorAtual(user, usuarios, config, ct), pedido.Id, pedido.CategoriaId, pedido.AreaId, pedido.Nome, pedido.Fluxo, pedido.Ativo, ct);
            return Results.Ok(await catalogo.Obter(ct));
        })
            .WithName("SalvarTipoAtendimentoCatalogo")
            .WithSummary("GL / Administrador cadastra ou atualiza um tipo de atendimento.");
        catalogoAdmin.MapPost("/areas", async (AreaCadastroPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, CatalogoAdministracaoAplicacao appCaso, CatalogoAplicacao catalogo, CancellationToken ct) =>
        {
            await appCaso.SalvarArea(await AtorAtual(user, usuarios, config, ct), pedido.Id, pedido.Nome, pedido.Ativa, ct);
            return Results.Ok(await catalogo.Obter(ct));
        })
            .WithName("SalvarAreaCatalogo")
            .WithSummary("GL / Administrador cadastra ou atualiza uma área.");
        catalogoAdmin.MapPost("/responsaveis", async (ResponsavelCadastroPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, CatalogoAdministracaoAplicacao appCaso, CatalogoAplicacao catalogo, CancellationToken ct) =>
        {
            await appCaso.SalvarResponsavel(await AtorAtual(user, usuarios, config, ct), pedido.Id, pedido.Nome, pedido.Email, pedido.AreaId, pedido.Ativo, ct);
            return Results.Ok(await catalogo.Obter(ct));
        })
            .WithName("SalvarResponsavelCatalogo")
            .WithSummary("GL / Administrador cadastra ou atualiza um Responsável da Área.");

        var espacos = app.MapGroup("/api/espacos").WithTags("Espaços").RequireAuthorization();
        espacos.MapGet("/", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, EspacosAplicacao espacosApp, CancellationToken ct) =>
            Results.Ok(await espacosApp.Listar(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("ListarEspacos")
            .WithSummary("GL / Administrador consulta o inventário e o histórico de locações.");
        espacos.MapPost("/", async (EspacoSalvarPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, EspacosAplicacao espacosApp, CancellationToken ct) =>
            Results.Ok(await espacosApp.Salvar(
                await AtorAtual(user, usuarios, config, ct),
                new EspacoComando(null, pedido.Codigo, pedido.Nome, pedido.Localizacao, pedido.Descricao, pedido.Ativo),
                ct)))
            .WithName("CadastrarEspaco")
            .WithSummary("GL / Administrador cadastra um espaço locável.");
        espacos.MapPut("/{id:guid}", async (Guid id, EspacoSalvarPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, EspacosAplicacao espacosApp, CancellationToken ct) =>
            Results.Ok(await espacosApp.Salvar(
                await AtorAtual(user, usuarios, config, ct),
                new EspacoComando(id, pedido.Codigo, pedido.Nome, pedido.Localizacao, pedido.Descricao, pedido.Ativo),
                ct)))
            .WithName("AtualizarEspaco")
            .WithSummary("GL / Administrador atualiza os dados ou a situação de um espaço.");
        espacos.MapPost("/{id:guid}/locacoes", async (Guid id, IniciarLocacaoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, EspacosAplicacao espacosApp, CancellationToken ct) =>
            Results.Ok(await espacosApp.IniciarLocacao(
                await AtorAtual(user, usuarios, config, ct),
                new IniciarLocacaoComando(id, pedido.EmpresaId, pedido.Inicio),
                ct)))
            .WithName("IniciarLocacaoEspaco")
            .WithSummary("GL / Administrador associa uma empresa Cessionária a um espaço disponível.");
        espacos.MapPost("/{id:guid}/locacao/encerramento", async (Guid id, EncerrarLocacaoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, EspacosAplicacao espacosApp, CancellationToken ct) =>
            Results.Ok(await espacosApp.EncerrarLocacao(
                await AtorAtual(user, usuarios, config, ct), id, pedido.Termino, ct)))
            .WithName("EncerrarLocacaoEspaco")
            .WithSummary("GL / Administrador encerra a locação vigente sem apagar seu histórico.");

        var empresas = app.MapGroup("/api/empresas-cessionarias").WithTags("Empresas Cessionárias").RequireAuthorization();
        empresas.MapGet("/", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, EspacosAplicacao espacosApp, CancellationToken ct) =>
            Results.Ok(await espacosApp.ListarEmpresas(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("ListarEmpresasCessionarias")
            .WithSummary("GL / Administrador lista empresas disponíveis para locação.");
        empresas.MapGet("/administracao", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, GestaoCessionariosAplicacao gestao, CancellationToken ct) =>
            Results.Ok(await gestao.Listar(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("ListarEmpresasCessionariasAdministracao")
            .WithSummary("GL / Administrador consulta empresas, representantes, contatos e funções.");
        empresas.MapPost("/", async (SalvarEmpresaPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, GestaoCessionariosAplicacao gestao, CancellationToken ct) =>
            Results.Ok(await gestao.SalvarEmpresa(await AtorAtual(user, usuarios, config, ct), new SalvarEmpresaComando(null, pedido.Nome, pedido.Ativa, pedido.Logo), ct)))
            .WithName("CadastrarEmpresaCessionaria")
            .WithSummary("GL / Administrador cadastra uma empresa Cessionária.");
        empresas.MapPut("/{id:guid}", async (Guid id, SalvarEmpresaPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, GestaoCessionariosAplicacao gestao, CancellationToken ct) =>
            Results.Ok(await gestao.SalvarEmpresa(await AtorAtual(user, usuarios, config, ct), new SalvarEmpresaComando(id, pedido.Nome, pedido.Ativa, pedido.Logo), ct)))
            .WithName("AtualizarEmpresaCessionaria")
            .WithSummary("GL / Administrador atualiza uma empresa Cessionária.");
        empresas.MapPost("/{empresaId:guid}/representantes", async (Guid empresaId, SalvarRepresentantePedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, GestaoCessionariosAplicacao gestao, CancellationToken ct) =>
            Results.Ok(await gestao.SalvarRepresentante(
                await AtorAtual(user, usuarios, config, ct),
                empresaId,
                new SalvarRepresentanteComando(pedido.UsuarioId, pedido.Nome, pedido.Email, pedido.Ativo, pedido.Contatos.Select(contato => new ContatoComando(contato.Id, contato.Canal, contato.Valor, contato.Principal)).ToArray(), pedido.Funcoes),
                ct)))
            .WithName("CadastrarRepresentanteCessionario")
            .WithSummary("GL / Administrador associa um login Entra e mantém os contatos/funções do representante.");
        empresas.MapPut("/{empresaId:guid}/representantes/{usuarioId:guid}", async (Guid empresaId, Guid usuarioId, SalvarRepresentantePedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, GestaoCessionariosAplicacao gestao, CancellationToken ct) =>
            Results.Ok(await gestao.SalvarRepresentante(
                await AtorAtual(user, usuarios, config, ct),
                empresaId,
                new SalvarRepresentanteComando(usuarioId, pedido.Nome, pedido.Email, pedido.Ativo, pedido.Contatos.Select(contato => new ContatoComando(contato.Id, contato.Canal, contato.Valor, contato.Principal)).ToArray(), pedido.Funcoes),
                ct)))
            .WithName("AtualizarRepresentanteCessionario")
            .WithSummary("GL / Administrador atualiza representante, contatos e funções.");
        empresas.MapPost("/{empresaId:guid}/funcoes", async (Guid empresaId, SalvarFuncaoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, GestaoCessionariosAplicacao gestao, CancellationToken ct) =>
            Results.Ok(await gestao.SalvarFuncao(await AtorAtual(user, usuarios, config, ct), empresaId, new SalvarFuncaoComando(null, pedido.Nome, pedido.Ativa, pedido.Permissoes), ct)))
            .WithName("CadastrarFuncaoCessionario")
            .WithSummary("GL / Administrador cadastra função e permissões para uma empresa.");
        empresas.MapPut("/{empresaId:guid}/funcoes/{id:guid}", async (Guid empresaId, Guid id, SalvarFuncaoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, GestaoCessionariosAplicacao gestao, CancellationToken ct) =>
            Results.Ok(await gestao.SalvarFuncao(await AtorAtual(user, usuarios, config, ct), empresaId, new SalvarFuncaoComando(id, pedido.Nome, pedido.Ativa, pedido.Permissoes), ct)))
            .WithName("AtualizarFuncaoCessionario")
            .WithSummary("GL / Administrador atualiza nome, estado e permissões da função.");

        app.MapGet("/api/agenda", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AgendaAplicacao agenda, CancellationToken ct) =>
            Results.Ok(await agenda.Listar(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithTags("Agenda")
            .RequireAuthorization()
            .WithName("ListarAgenda")
            .WithSummary("Calendário da fila autorizada. RF-17.1. O Cessionário não usa esta agenda.");

        var comunicados = app.MapGroup("/api/comunicados").WithTags("Comunicados").RequireAuthorization();
        comunicados.MapGet("/", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, ComunicadosAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Listar(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("ListarComunicados")
            .WithSummary("Lista comunicados vigentes para o Cessionário e todos para o GL / Administrador. RF-22.2.");
        comunicados.MapGet("/{id:guid}", async (Guid id, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, ComunicadosAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Obter(await AtorAtual(user, usuarios, config, ct), id, ct)))
            .WithName("ObterComunicado")
            .WithSummary("Abre o comunicado. Não há resposta nem conversa. RF-22.2.");
        comunicados.MapPost("/", async (PublicarComunicadoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, ComunicadosAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Publicar(await AtorAtual(user, usuarios, config, ct), new PublicarComunicadoComando(pedido.Titulo, pedido.Texto, pedido.AvisarCelular), ct)))
            .WithName("PublicarComunicado")
            .WithSummary("GL / Administrador publica um comunicado. RF-22.1.");
        comunicados.MapPost("/{id:guid}/encerramento", async (Guid id, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, ComunicadosAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Encerrar(await AtorAtual(user, usuarios, config, ct), id, ct)))
            .WithName("EncerrarComunicado")
            .WithSummary("GL / Administrador encerra o comunicado vigente. RF-22.1.");
        comunicados.MapPost("/{id:guid}/leitura", async (Guid id, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, ComunicadosAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.MarcarLido(await AtorAtual(user, usuarios, config, ct), id, ct)))
            .WithName("MarcarLeituraComunicado")
            .WithSummary("Cessionário marca a leitura. RF-22.2.");

        var demandas = app.MapGroup("/api/demandas").WithTags("Demandas").RequireAuthorization();
        demandas.MapGet("/", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Listar(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("ListarDemandas")
            .WithSummary("Lista a fila visível para o perfil autenticado.");

        demandas.MapGet("/exportacao", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
        {
            var arquivo = await appCaso.ExportarPlanilha(await AtorAtual(user, usuarios, config, ct), ct);
            return Results.File(arquivo.Conteudo, arquivo.Tipo, arquivo.Nome);
        })
            .WithName("ExportarFila")
            .WithSummary("Planilha CSV da fila visível ao perfil. RF-16.1.");

        demandas.MapGet("/{id:guid}/protocolo", async (Guid id, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
        {
            var arquivo = await appCaso.ExportarProtocolo(await AtorAtual(user, usuarios, config, ct), id, ct);
            return Results.File(arquivo.Conteudo, arquivo.Tipo, arquivo.Nome);
        })
            .WithName("ExportarProtocolo")
            .WithSummary("PDF do protocolo que o perfil já pode abrir. RF-16.2.");

        demandas.MapPost("/", async (AbrirPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Abrir(await AtorAtual(user, usuarios, config, ct), new AbrirComando(pedido.Descricao, pedido.Sala, pedido.Ponto, pedido.SubcategoriaId, pedido.Canal, pedido.Reclamacao), ct)))
            .WithName("AbrirDemanda")
            .WithSummary("Abre um chamado, gera protocolo e registra a classificação confirmada ou ajustada.");

        demandas.MapGet("/{id:guid}", async (Guid id, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Obter(await AtorAtual(user, usuarios, config, ct), id, ct)))
            .WithName("ObterDemanda")
            .WithSummary("Detalhe do chamado com comunicação, documentos e histórico.");

        demandas.MapPost("/{id:guid}/classificacao", async (Guid id, ClassificacaoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Classificar(await AtorAtual(user, usuarios, config, ct), id, pedido.SubcategoriaId, ct)))
            .WithName("ClassificarDemanda")
            .WithSummary("GL confirma ou altera a categoria sugerida.");

        demandas.MapPost("/{id:guid}/redirecionar", async (Guid id, RedirecionarPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Redirecionar(await AtorAtual(user, usuarios, config, ct), id, new RedirecionarComando(pedido.AreaId, pedido.ResponsavelId), ct)))
            .WithName("RedirecionarDemanda")
            .WithSummary("GL direciona a demanda para uma área e, se informado, um responsável.");

        demandas.MapPost("/{id:guid}/andamento", async (Guid id, AndamentoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Andamento(await AtorAtual(user, usuarios, config, ct), id, new AndamentoComando(pedido.Comentario, pedido.Situacao), ct)))
            .WithName("RegistrarAndamento")
            .WithSummary("Registra atendimento e atualiza a situação.");

        demandas.MapPost("/{id:guid}/avancar", async (Guid id, AvancarPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Avancar(await AtorAtual(user, usuarios, config, ct), id, new AvancarComando(pedido.Comentario, pedido.Previsao, pedido.Confirmacao), ct)))
            .WithName("AvancarDemanda")
            .WithSummary("Avança o chamado para a próxima etapa manual da cadeia.");

        var cadeia = app.MapGroup("/api/cadeia").WithTags("Cadeia").RequireAuthorization();
        cadeia.MapGet("/", async (CadeiaAplicacao cadeiaApp, CancellationToken ct) =>
            Results.Ok(await cadeiaApp.Listar(ct)))
            .WithName("ObterCadeia")
            .WithSummary("Devolve a cadeia do quadro de cada tipo de atendimento.");
        cadeia.MapPut("/", async (CadeiaPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, CadeiaAplicacao cadeiaApp, CancellationToken ct) =>
            Results.Ok(await cadeiaApp.Salvar(
                await AtorAtual(user, usuarios, config, ct),
                pedido.SubcategoriaId,
                pedido.Etapas.Select(etapa =>
                {
                    var tarefas = etapa.Tarefas is { Count: > 0 }
                        ? etapa.Tarefas.Select(tarefa => new TarefaCadeiaDto(tarefa.Codigo, tarefa.Obrigatoria)).ToArray()
                        : (etapa.Campos ?? []).Select(campo => new TarefaCadeiaDto(campo, true)).ToArray();
                    return new EtapaCadeiaDto(etapa.Codigo, etapa.Codigo, 0, etapa.Automatica, tarefas.Select(tarefa => tarefa.Codigo).ToArray(), tarefas);
                }).ToArray(),
                ct)))
            .WithName("SalvarCadeia")
            .WithSummary("GL / Administrador configura a cadeia de um tipo de atendimento.");

        demandas.MapPost("/{id:guid}/mensagens", async (Guid id, MensagemPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Mensagem(await AtorAtual(user, usuarios, config, ct), id, new MensagemComando(pedido.Texto, pedido.Complemento), ct)))
            .WithName("EnviarMensagem")
            .WithSummary("Acrescenta uma mensagem na timeline do chamado. Complemento avisa o celular do Cessionário.");

        demandas.MapPost("/{id:guid}/mensagens/anexo", async (Guid id, IFormFile arquivo, string? texto, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
        {
            await using var stream = arquivo.OpenReadStream();
            var detalhe = await appCaso.MensagemComAnexo(await AtorAtual(user, usuarios, config, ct), id, texto, arquivo.FileName, arquivo.ContentType, stream, arquivo.Length, ct);
            return Results.Ok(detalhe);
        })
            .WithName("EnviarAnexoNaConversa")
            .WithSummary("Envia foto, arquivo ou áudio na conversa do chamado, com ou sem texto.")
            .DisableAntiforgery();

        demandas.MapPost("/{id:guid}/previsao", async (Guid id, PrevisaoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.DefinirPrevisao(await AtorAtual(user, usuarios, config, ct), id, new PrevisaoComando(pedido.Quando), ct)))
            .WithName("DefinirPrevisao")
            .WithSummary("Registra quando o chamado será atendido.");

        demandas.MapPost("/{id:guid}/avaliacao", async (Guid id, AvaliacaoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Avaliar(await AtorAtual(user, usuarios, config, ct), id, new AvaliacaoComando(pedido.Nota, pedido.Comentario), ct)))
            .WithName("AvaliarAtendimento")
            .WithSummary("Cessionário avalia o serviço concluído, de 0 a 10.");

        demandas.MapPost("/{id:guid}/anexos", async (Guid id, HttpRequest requisicao, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
        {
            var form = await requisicao.ReadFormAsync(ct);
            var arquivo = form.Files.GetFile("arquivo");
            if (arquivo is null)
                return Results.BadRequest();
            var finalidade = form["finalidade"].ToString();
            await using var stream = arquivo.OpenReadStream();
            var detalhe = await appCaso.Anexar(await AtorAtual(user, usuarios, config, ct), id, arquivo.FileName, arquivo.ContentType, stream, arquivo.Length, ct, string.IsNullOrWhiteSpace(finalidade) ? "documento" : finalidade);
            return Results.Ok(detalhe);
        })
            .WithName("AnexarArquivo")
            .WithSummary("Anexa imagem, PDF, Word, Excel ou áudio ao chamado. A finalidade obra registra a foto da obra executada.")
            .DisableAntiforgery();

        demandas.MapGet("/{id:guid}/anexos/{anexoId:guid}", async (Guid id, Guid anexoId, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
        {
            var arquivo = await appCaso.Baixar(await AtorAtual(user, usuarios, config, ct), id, anexoId, ct);
            return Results.File(arquivo.Conteudo, string.IsNullOrWhiteSpace(arquivo.Tipo) ? "application/octet-stream" : arquivo.Tipo);
        })
            .WithName("BaixarAnexo")
            .WithSummary("Abre um anexo do chamado para visualização.");

        demandas.MapPost("/{id:guid}/aprovacao", async (Guid id, AprovacaoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Aprovar(await AtorAtual(user, usuarios, config, ct), id, new AprovacaoComando(pedido.Decisao, pedido.Motivo), ct)))
            .WithName("DecidirAprovacao")
            .WithSummary("GL aprova, solicita ajuste ou reprova.");

        demandas.MapPost("/{id:guid}/encerramento", async (Guid id, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Encerrar(await AtorAtual(user, usuarios, config, ct), id, ct)))
            .WithName("EncerrarDemanda")
            .WithSummary("GL / Administrador encerra um chamado já concluído.");

        demandas.MapPost("/{id:guid}/cancelamento", async (Guid id, CancelamentoPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Cancelar(await AtorAtual(user, usuarios, config, ct), id, new CancelamentoComando(pedido.Motivo), ct)))
            .WithName("CancelarDemanda")
            .WithSummary("GL / Administrador cancela um chamado em aberto, com motivo.");

        var obras = app.MapGroup("/api/obras").WithTags("Obras").RequireAuthorization();
        obras.MapGet("/", async (ObrasAplicacao obrasApp, CancellationToken ct) => Results.Ok(await obrasApp.Listar(ct)))
            .WithName("ListarObras")
            .WithSummary("Lista as obras de demonstração.");
        obras.MapGet("/{id:guid}", async (Guid id, ObrasAplicacao obrasApp, CancellationToken ct) => Results.Ok(await obrasApp.Obter(id, ct)))
            .WithName("ObterObra")
            .WithSummary("Exibe dados da obra, etapa atual e checklist documental.");

        var notas = app.MapGroup("/api/notificacoes").WithTags("Notificações").RequireAuthorization();
        notas.MapGet("/", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, NotificacaoAplicacao notasApp, CancellationToken ct) =>
            Results.Ok(await notasApp.Listar(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("ListarNotificacoes")
            .WithSummary("Lista as notificações do usuário autenticado.");
        notas.MapPost("/{id:guid}/leitura", async (Guid id, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, NotificacaoAplicacao notasApp, CancellationToken ct) =>
        {
            await notasApp.MarcarLida(await AtorAtual(user, usuarios, config, ct), id, ct);
            return Results.NoContent();
        })
            .WithName("MarcarNotificacaoLida")
            .WithSummary("Marca uma notificação como lida.");

        notas.MapPost("/{id:guid}/resposta", async (Guid id, RespostaPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AtendimentoAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.ResponderNotificacao(await AtorAtual(user, usuarios, config, ct), id, new RespostaNotificacaoComando(pedido.Texto), ct)))
            .WithName("ResponderNotificacao")
            .WithSummary("Grava no chamado em aberto a resposta dada à notificação do celular.");

        notas.MapGet("/push/chave", (NotificacaoAplicacao notasApp) => Results.Ok(notasApp.ExigirChavePublica()))
            .WithName("ChavePush")
            .WithSummary("Entrega a chave pública para o celular autorizar as notificações do portal.");
        notas.MapPost("/push", async (InscricaoPushPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, NotificacaoAplicacao notasApp, CancellationToken ct) =>
        {
            await notasApp.Inscrever(await AtorAtual(user, usuarios, config, ct), new InscricaoPushComando(pedido.Endpoint, pedido.ChaveP256dh, pedido.SegredoAuth), ct);
            return Results.NoContent();
        })
            .WithName("InscreverPush")
            .WithSummary("Autoriza este celular a receber as notificações do usuário autenticado.");
        notas.MapPost("/push/cancelamento", async (CancelarPushPedido pedido, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, NotificacaoAplicacao notasApp, CancellationToken ct) =>
        {
            await notasApp.Cancelar(await AtorAtual(user, usuarios, config, ct), pedido.Endpoint, ct);
            return Results.NoContent();
        })
            .WithName("CancelarPush")
            .WithSummary("Retira a autorização de notificações deste celular.");

        var auditoria = app.MapGroup("/api/auditoria").WithTags("Auditoria").RequireAuthorization();
        auditoria.MapGet("/dia", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AuditoriaAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.DoDia(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("AuditoriaDoDia")
            .WithSummary("Lista as ações que o usuário autenticado executou hoje.");
        auditoria.MapGet("/pessoas", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AuditoriaAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Pessoas(await AtorAtual(user, usuarios, config, ct), ct)))
            .WithName("PessoasAuditoria")
            .WithSummary("Lista as pessoas que o GL / Administrador pode pesquisar na auditoria.");
        auditoria.MapGet("/exportacao", async (ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AuditoriaAplicacao appCaso, CancellationToken ct) =>
        {
            var arquivo = await appCaso.ExportarBase(await AtorAtual(user, usuarios, config, ct), ct);
            return Results.File(arquivo.Conteudo, arquivo.Tipo, arquivo.Nome);
        })
            .WithName("ExportarAuditoria")
            .WithSummary("Excel da base inteira da auditoria. Somente GL / Administrador.");
        auditoria.MapGet("/", async (DateOnly de, DateOnly ate, Guid? autorId, string? texto, ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, AuditoriaAplicacao appCaso, CancellationToken ct) =>
            Results.Ok(await appCaso.Pesquisar(await AtorAtual(user, usuarios, config, ct), de, ate, autorId, texto, ct)))
            .WithName("PesquisarAuditoria")
            .WithSummary("Pesquisa as ações do intervalo, com no máximo 3 meses. Somente GL / Administrador.");
    }

    private static async Task<Ator> AtorAtual(ClaimsPrincipal user, IUsuarios usuarios, IConfiguration config, CancellationToken ct)
    {
        if (string.Equals(config["Auth:Mode"], "Entra", StringComparison.OrdinalIgnoreCase))
        {
            var email = (user.FindFirstValue("preferred_username") ?? user.FindFirstValue("email") ?? "").ToLowerInvariant();
            var identidade = user.FindFirstValue("oid") ?? user.FindFirstValue("sub");
            if (string.IsNullOrWhiteSpace(identidade))
                throw new AcessoNegadoException("O token não contém identificador estável de identidade.");
            var usuario = await usuarios.ObterPorIdentidadeEstavel(identidade, ct);
            if (usuario is null)
            {
                usuario = await usuarios.ObterPorEmail(email, ct)
                    ?? throw new AcessoNegadoException("Usuário sem cadastro no portal.");
                await usuarios.VincularIdentidadeEstavel(usuario.Id, identidade, ct);
                usuario = await usuarios.Obter(usuario.Id, ct) ?? throw new AcessoNegadoException();
            }
            return await CriarAtor(usuario, PerfilDoToken(user) ?? usuario.Perfil, usuarios, ct);
        }

        var id = Guid.Parse(user.FindFirstValue("sub") ?? throw new AcessoNegadoException());
        var perfil = PerfilTexto.ParaPerfil(user.FindFirstValue("perfil") ?? throw new AcessoNegadoException());
        Guid? area = Guid.TryParse(user.FindFirstValue("area"), out var valor) ? valor : null;
        var usuarioDemo = await usuarios.Obter(id, ct) ?? throw new AcessoNegadoException("Usuário sem cadastro na POC.");
        return await CriarAtor(usuarioDemo, perfil, usuarios, ct, area);
    }

    private static async Task<Ator> CriarAtor(
        Usuario usuario,
        Perfil perfil,
        IUsuarios usuarios,
        CancellationToken ct,
        Guid? areaToken = null)
    {
        if (!usuario.Ativo)
            throw new AcessoNegadoException("Representante inativo.");

        if (perfil != Perfil.Cessionario)
            return new Ator(usuario.Id, perfil, areaToken ?? usuario.AreaId);

        if (usuario.EmpresaCessionariaId is not Guid empresaId || !usuario.EmpresaAtiva)
            throw new AcessoNegadoException("Representante sem vínculo com empresa Cessionária ativa.");

        var permissoes = await usuarios.PermissoesCessionario(usuario.Id, ct);
        if (permissoes.Count == 0)
            throw new AcessoNegadoException("Representante sem permissões ativas.");
        return new Ator(usuario.Id, perfil, null, empresaId, permissoes);
    }

    private static Perfil? PerfilDoToken(ClaimsPrincipal user)
    {
        foreach (var role in user.FindAll("roles").Select(c => c.Value))
        {
            if (role is PerfilTexto.Cessionario or PerfilTexto.GlAdministrador or PerfilTexto.ResponsavelArea)
                return PerfilTexto.ParaPerfil(role);
        }

        return null;
    }
}

public sealed record LoginPedido(string Email, string Senha);
public sealed record SugestaoPedido(string Texto);
public sealed record PreencherPedido(string Texto);
public sealed record AbrirPedido(string Descricao, string Sala, string? Ponto, Guid SubcategoriaId, string Canal, bool Reclamacao = false);
public sealed record PublicarComunicadoPedido(string Titulo, string Texto, bool AvisarCelular);
public sealed record ClassificacaoPedido(Guid SubcategoriaId);
public sealed record RedirecionarPedido(Guid AreaId, Guid? ResponsavelId);
public sealed record AndamentoPedido(string Comentario, string Situacao);
public sealed record AvancarPedido(string? Comentario, DateTime? Previsao, bool? Confirmacao);
public sealed record TarefaCadeiaPedido(string Codigo, bool Obrigatoria);
public sealed record EtapaCadeiaPedido(string Codigo, bool Automatica, IReadOnlyList<string>? Campos, IReadOnlyList<TarefaCadeiaPedido>? Tarefas);
public sealed record CadeiaPedido(Guid SubcategoriaId, IReadOnlyList<EtapaCadeiaPedido> Etapas);
public sealed record AreaCadastroPedido(Guid? Id, string Nome, bool Ativa);
public sealed record ResponsavelCadastroPedido(Guid? Id, string Nome, string Email, Guid AreaId, bool Ativo);
public sealed record ModeloAberturaPedido(string? Assunto, string? Ponto, string? Periodo, IReadOnlyList<string>? Itens);
public sealed record CategoriaCadastroPedido(Guid? Id, string Nome, bool Ativa, int? PrazoHoras, ModeloAberturaPedido? Modelo);
public sealed record TipoAtendimentoCadastroPedido(Guid? Id, Guid CategoriaId, Guid AreaId, string Nome, string Fluxo, bool Ativo);
public sealed record MensagemPedido(string Texto, bool Complemento = false);
public sealed record PrevisaoPedido(DateTime Quando);
public sealed record AvaliacaoPedido(int Nota, string? Comentario);
public sealed record RespostaPedido(string Texto);
public sealed record InscricaoPushPedido(string Endpoint, string ChaveP256dh, string SegredoAuth);
public sealed record CancelarPushPedido(string Endpoint);
public sealed record AprovacaoPedido(string Decisao, string? Motivo);
public sealed record CancelamentoPedido(string Motivo);
public sealed record EspacoSalvarPedido(string Codigo, string Nome, string Localizacao, string Descricao, bool Ativo = true);
public sealed record IniciarLocacaoPedido(Guid EmpresaId, DateOnly Inicio);
public sealed record EncerrarLocacaoPedido(DateOnly Termino);
public sealed record SalvarEmpresaPedido(string Nome, bool Ativa, string? Logo);
public sealed record ContatoPedido(Guid? Id, string Canal, string Valor, bool Principal);
public sealed record SalvarRepresentantePedido(Guid? UsuarioId, string Nome, string Email, bool Ativo, IReadOnlyList<ContatoPedido> Contatos, IReadOnlyList<Guid> Funcoes);
public sealed record SalvarFuncaoPedido(string Nome, bool Ativa, IReadOnlyList<string> Permissoes);
