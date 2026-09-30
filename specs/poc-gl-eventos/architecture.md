# Arquitetura da POC

Monólito modular. Um bounded context, dependência para dentro.

- `Gl.Demandas.Domain`: demanda, transições, protocolo e classificador puro.
- `Gl.Demandas.Application`: casos de uso e ports `IDemandas`, `IUsuarios`, `ICatalogo`, `IObras`, `INotificacoes`, `IClassificadorDemanda`, `IAnexoStorage`, `IRelogio`, `ITokenEmissor`.
- `Gl.Demandas.Infrastructure`: EF Core, seed, storage local ou Blob, JWT de demonstração.
- `Gl.Demandas.Api`: endpoints finos, Swagger em `/swagger`, health em `/health`.

O portal React separa `domain`, `application`, `infrastructure` e `presentation`. Componente não chama HTTP.

A API em execução usa somente `Database:Provider=SqlServer` e o catálogo `gl-demandas` em `smartezy.database.windows.net`. Não há provedor em memória no processo da API. Os scripts ficam em `infra/database/sql-server`; a API não executa `Database.Migrate()` nem `EnsureCreated()`.

A connection string fica em `ConnectionStrings__Sql` (RNF-04): App Service na entrega publicada e user-secrets no desenvolvimento. O firewall do servidor precisa liberar o IP de quem executa a API local e os IPs de saída do App Service, ou a regra `AllowAzureServices` (`0.0.0.0`).

Os testes automatizados montam um `AppDbContext` isolado em memória. Esse banco não é o da API e não substitui o catálogo Azure.

Auth: `Auth:Mode=Demo` emite JWT local. `Auth:Mode=Entra` valida o token do Entra ID e exige o usuário cadastrado pelo e-mail.

Deploy: `infra/azure/main.bicep` e `.github/workflows/cd.yml` (OIDC, Key Vault, App Service, Static Web App, Azure SQL, Blob).
