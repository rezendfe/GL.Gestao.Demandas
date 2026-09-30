namespace Gl.Demandas.Domain;

public sealed class AcessoNegadoException(string mensagem = "Você não tem permissão para esta ação.") : Exception(mensagem);

public sealed class TransicaoInvalidaException(string mensagem) : Exception(mensagem);

public sealed class RegraNegocioException(string mensagem) : Exception(mensagem);

public sealed class NaoEncontradaException(string mensagem = "Registro não encontrado.") : Exception(mensagem);
