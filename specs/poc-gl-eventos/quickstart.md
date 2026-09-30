# Quickstart

1. `dotnet test backend/Gl.Demandas.slnx` — usa `GL_TEST_SQL` ou o LocalDB; não grava em `gl-demandas`. Os prints do Playwright saem em `web/playwright`.
2. `dotnet run --project backend/src/Gl.Demandas.Api --launch-profile http`
3. `cd web && npm ci && npm run dev`
4. Abrir http://localhost:5173 e entrar com `joao.silva@empresaexemplo.com.br` / `Demo@2026`

Swagger: http://localhost:5090/swagger

Swagger publicado: https://gl-demandas-cfffckaaa2cvd5fa.westus-01.azurewebsites.net/swagger

A API local lê o catálogo `gl-demandas` em `smartezy.database.windows.net`. Antes do `dotnet run`, defina `ConnectionStrings:Sql` no user-secrets da API (veja `backend/README.md`). A senha publicada fica no segredo `SQL_CONNECTION_STRING` e na configuração do App Service.

Azure: o workflow `cd` espera os segredos `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `AZURE_DEPLOYER_OBJECT_ID`, `SQL_ADMIN_LOGIN`, `SQL_ADMIN_PASSWORD` e `JWT_SIGNING_KEY` (32 caracteres ou mais). O login do GitHub usa OIDC. Nada disso fica no repositório.
