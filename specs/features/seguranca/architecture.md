# Arquitetura — Segurança

`Auth:Mode=Demo` emite JWT local (`TokenDemo`). `Auth:Mode=Entra` já valida JWT quando configurado, e exige usuário cadastrado. O portal ainda não usa MSAL: guarda `gl-poc-token` na sessão do navegador. Trocar o issuer sem o login Entra derruba a sessão atual.

Rotas de demanda exigem autorização. `Demanda.GarantirLeitura` e as permissões de [EF-14](../EF-14-representantes/architecture.md) continuam depois do token.
