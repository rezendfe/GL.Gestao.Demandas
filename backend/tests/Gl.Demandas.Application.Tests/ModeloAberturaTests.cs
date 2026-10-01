using Gl.Demandas.Application;
using Gl.Demandas.Domain;

namespace Gl.Demandas.Application.Tests;

public sealed class ModeloAberturaTests
{
    [Fact]
    public async Task Gl_grava_assunto_e_campos_e_outro_perfil_nao_grava()
    {
        Assert.Null(ModeloAbertura.Interpretar("  ", null, "", []));
        var modelo = ModeloAbertura.Interpretar("Infiltração no teto", "Teto", "Manhã", ["Infiltração", " infiltração "]);
        Assert.NotNull(modelo);
        Assert.Equal("Infiltração no teto", modelo.Assunto);
        Assert.Equal("Teto", modelo.Ponto);
        Assert.Equal("Manhã", modelo.Periodo);
        Assert.Equal(["Infiltração"], modelo.Itens);
        Assert.Throws<RegraNegocioException>(() => ModeloAbertura.Interpretar("ok", null, "Madrugada", null));

        var catalogo = new CatalogoMemoria();
        var admin = new CatalogoAdministracaoAplicacao(catalogo, null!);
        var gl = new Ator(Guid.NewGuid(), Perfil.GlAdministrador, null);
        await admin.SalvarCategoria(gl, null, "Limpeza", true, null, modelo, CancellationToken.None);
        Assert.Equal("Teto", catalogo.Gravado!.Modelo!.Ponto);

        await admin.SalvarCategoria(gl, catalogo.Gravado.Id, "Limpeza", true, null, null, CancellationToken.None);
        Assert.Null(catalogo.Gravado.Modelo);

        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            admin.SalvarCategoria(new Ator(Guid.NewGuid(), Perfil.Cessionario, null), null, "Outra", true, null, modelo, CancellationToken.None));
        await Assert.ThrowsAsync<AcessoNegadoException>(() =>
            admin.SalvarCategoria(new Ator(Guid.NewGuid(), Perfil.ResponsavelArea, Guid.NewGuid()), null, "Outra", true, null, modelo, CancellationToken.None));
    }

    sealed class CatalogoMemoria : ICatalogo
    {
        public Categoria? Gravado { get; private set; }

        public Task<Categoria> SalvarCategoria(Guid? id, string nome, bool ativa, int? prazoHoras, ModeloAbertura? modelo, CancellationToken ct)
        {
            Gravado = new Categoria(id ?? Guid.NewGuid(), nome, ativa, prazoHoras, modelo);
            return Task.FromResult(Gravado);
        }

        public Task<IReadOnlyList<Categoria>> ListarCategorias(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<Categoria>>(Gravado is null ? [] : [Gravado]);

        public Task<IReadOnlyList<Subcategoria>> ListarSubcategorias(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<Subcategoria>>([]);

        public Task<IReadOnlyList<RegraClassificacao>> ListarRegras(CancellationToken ct) => throw new NotSupportedException();
        public Task<Subcategoria?> ObterSubcategoria(Guid id, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<Area>> ListarAreas(CancellationToken ct) => throw new NotSupportedException();
        public Task<Area> SalvarArea(Guid? id, string nome, bool ativa, CancellationToken ct) => throw new NotSupportedException();
        public Task<Subcategoria> SalvarSubcategoria(Guid? id, Guid categoriaId, Guid areaId, string nome, FluxoDemanda fluxo, bool ativa, CancellationToken ct) => throw new NotSupportedException();
    }
}
