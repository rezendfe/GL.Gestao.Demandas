# API GL Demandas

.NET 10, arquitetura hexagonal. Swagger local: http://localhost:5090/swagger

Swagger publicado: https://gl-demandas-cfffckaaa2cvd5fa.westus-01.azurewebsites.net/swagger

```bash
dotnet test backend/Gl.Demandas.slnx
dotnet run --project backend/src/Gl.Demandas.Api --launch-profile http
```

A API local e o App Service usam o catálogo `gl-demandas` em `smartezy.database.windows.net`. Os scripts estão em `infra/database/sql-server`. A senha não entra no repositório.

No desenvolvimento, grave a connection string no user-secrets da API:

```bash
dotnet user-secrets set "ConnectionStrings:Sql" "<connection string do catálogo gl-demandas>" --project backend/src/Gl.Demandas.Api
```

Na publicação, a mesma chave é `ConnectionStrings__Sql` no App Service. `Database:Provider` permanece `SqlServer`.

Login demo (senha `Demo@2026`, só desenvolvimento):

| Perfil | E-mail |
|---|---|
| Cessionário | joao.silva@empresaexemplo.com.br |
| GL / Administrador | patricia.lima@gleventos.com.br |
| Responsável da Área | responsavel.01@gleventos.com.br |

Recepção: `responsavel.02@gleventos.com.br`. Estacionamento: `responsavel.03@gleventos.com.br`.

`Auth__Mode=Entra` valida JWT do Entra ID. Os app roles precisam se chamar exatamente Cessionário, GL / Administrador e Responsável da Área. Fora de Development, o modo Demo exige `Auth__SigningKey` com pelo menos 32 caracteres.
