using Gl.Demandas.Domain;

namespace Gl.Demandas.Application;

public sealed record SalvarEmpresaComando(Guid? Id, string Nome, bool Ativa, string? Logo);

public sealed record ContatoComando(Guid? Id, string Canal, string Valor, bool Principal);

public sealed record SalvarRepresentanteComando(
    Guid? UsuarioId,
    string Nome,
    string Email,
    bool Ativo,
    IReadOnlyList<ContatoComando> Contatos,
    IReadOnlyList<Guid> Funcoes);

public sealed record SalvarFuncaoComando(Guid? Id, string Nome, bool Ativa, IReadOnlyList<string> Permissoes);

public sealed class GestaoCessionariosAplicacao(IGestaoCessionarios gestao)
{
    public async Task<IReadOnlyList<EmpresaCadastro>> Listar(Ator ator, CancellationToken ct)
    {
        ExigirGl(ator);
        return await gestao.ListarEmpresasAdministracao(ct);
    }

    public async Task<EmpresaCadastro> SalvarEmpresa(Ator ator, SalvarEmpresaComando comando, CancellationToken ct)
    {
        ExigirGl(ator);
        var nome = ValidarTexto(comando.Nome, "Informe a razão social da empresa Cessionária.", 200);
        var logo = string.IsNullOrWhiteSpace(comando.Logo) ? null : ValidarTexto(comando.Logo, "Logo inválido.", 300);
        return await gestao.SalvarEmpresa(comando.Id, nome, comando.Ativa, logo, ct);
    }

    public async Task<RepresentanteCadastro> SalvarRepresentante(Ator ator, Guid empresaId, SalvarRepresentanteComando comando, CancellationToken ct)
    {
        ExigirGl(ator);
        var nome = ValidarTexto(comando.Nome, "Informe o nome do representante.", 200);
        var email = comando.Email.Trim().ToLowerInvariant();
        if (email.Length is < 3 or > 320 || !email.Contains('@'))
            throw new RegraNegocioException("Informe um e-mail de login válido.");
        var contatos = comando.Contatos.Select(MapearContato).ToArray();
        if (contatos.GroupBy(contato => contato.Canal).Any(grupo => grupo.Count(contato => contato.Principal) > 1))
            throw new RegraNegocioException("Marque no máximo um contato principal por canal.");
        return await gestao.SalvarRepresentante(empresaId, comando.UsuarioId, nome, email, comando.Ativo, contatos, comando.Funcoes.Distinct().ToArray(), ct);
    }

    public async Task<FuncaoCadastro> SalvarFuncao(Ator ator, Guid empresaId, SalvarFuncaoComando comando, CancellationToken ct)
    {
        ExigirGl(ator);
        var nome = ValidarTexto(comando.Nome, "Informe o nome da função.", 100);
        var permissoes = comando.Permissoes.Select(texto =>
        {
            if (Enum.TryParse<PermissaoCessionario>(texto, true, out var permissao))
                return permissao;
            try
            {
                return PermissaoCessionarioTexto.ParaPermissao(texto);
            }
            catch (ArgumentOutOfRangeException)
            {
                throw new RegraNegocioException("A função contém uma permissão fora do catálogo Cessionário.");
            }
        }).Distinct().ToArray();
        return await gestao.SalvarFuncao(empresaId, comando.Id, nome, comando.Ativa, permissoes, ct);
    }

    private static ContatoCadastro MapearContato(ContatoComando comando)
    {
        if (!Enum.TryParse<CanalContato>(comando.Canal, true, out var canal))
            throw new RegraNegocioException("Selecione e-mail, telefone ou WhatsApp para o contato.");
        var valor = ValidarTexto(comando.Valor, "Informe o valor do contato.", 320);
        return new ContatoCadastro(comando.Id ?? Guid.NewGuid(), canal.ToString().ToUpperInvariant(), valor, comando.Principal);
    }

    private static string ValidarTexto(string texto, string mensagem, int limite)
    {
        var valor = texto.Trim();
        if (valor.Length is < 1 || valor.Length > limite)
            throw new RegraNegocioException(mensagem);
        return valor;
    }

    private static void ExigirGl(Ator ator)
    {
        if (ator.Perfil != Perfil.GlAdministrador)
            throw new AcessoNegadoException();
    }
}