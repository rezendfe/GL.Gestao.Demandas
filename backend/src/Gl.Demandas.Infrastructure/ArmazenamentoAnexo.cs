using Azure.Storage.Blobs;
using Gl.Demandas.Application;

namespace Gl.Demandas.Infrastructure;

public sealed class ArmazenamentoLocal(string raiz) : IAnexoStorage
{
    public async Task<string> Salvar(Guid demandaId, string nomeArquivo, Stream conteudo, CancellationToken ct)
    {
        var pasta = Path.Combine(raiz, demandaId.ToString("N"));
        Directory.CreateDirectory(pasta);
        var caminho = Path.Combine(pasta, $"{Guid.NewGuid():N}-{Path.GetFileName(nomeArquivo)}");
        await using var arquivo = File.Create(caminho);
        await conteudo.CopyToAsync(arquivo, ct);
        return caminho;
    }

    public Task<Stream?> Abrir(string caminho, CancellationToken ct)
    {
        var fisico = Path.IsPathRooted(caminho) ? caminho : Path.Combine(raiz, caminho);
        if (!File.Exists(fisico))
            return Task.FromResult<Stream?>(null);
        return Task.FromResult<Stream?>(File.OpenRead(fisico));
    }
}

public sealed class ArmazenamentoBlob(string conexao, string container) : IAnexoStorage
{
    public async Task<string> Salvar(Guid demandaId, string nomeArquivo, Stream conteudo, CancellationToken ct)
    {
        var client = new BlobContainerClient(conexao, container);
        await client.CreateIfNotExistsAsync(cancellationToken: ct);
        var nome = $"{demandaId:N}/{Guid.NewGuid():N}-{Path.GetFileName(nomeArquivo)}";
        await client.GetBlobClient(nome).UploadAsync(conteudo, cancellationToken: ct);
        return nome;
    }

    public async Task<Stream?> Abrir(string caminho, CancellationToken ct)
    {
        var blob = new BlobContainerClient(conexao, container).GetBlobClient(caminho);
        if (!await blob.ExistsAsync(ct))
            return null;
        var download = await blob.DownloadStreamingAsync(cancellationToken: ct);
        return download.Value.Content;
    }
}
