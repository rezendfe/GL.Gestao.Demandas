# Arquitetura da POC

Monólito modular. Um bounded context, dependência para dentro.

- `Gl.Demandas.Domain`: demanda, transições, protocolo e classificador puro.
- `Gl.Demandas.Application`: casos de uso e ports `IDemandas`, `IUsuarios`, `ICatalogo`, `IObras`, `INotificacoes`, `IClassificadorDemanda`, `IAnexoStorage`, `IRelogio`, `ITokenEmissor`.
- `Gl.Demandas.Infrastructure`: EF Core, seed, storage local ou Blob, JWT de demonstração.
- `Gl.Demandas.Api`: endpoints finos, Swagger em `/swagger`, health em `/health`.

O portal React separa `domain`, `application`, `infrastructure` e `presentation`. Componente não chama HTTP.

Desenvolvimento: `Database:Provider=InMemory`. SQL Server: scripts em `infra/database/sql-server`, sem `Database.Migrate()`.

Auth: `Auth:Mode=Demo` emite JWT local. `Auth:Mode=Entra` valida o token do Entra ID e exige o usuário cadastrado pelo e-mail.

Deploy: `infra/azure/main.bicep` e `.github/workflows/cd.yml` (OIDC, Key Vault, App Service, Static Web App, Azure SQL, Blob).
