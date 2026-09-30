# API GL Demandas

.NET 10, arquitetura hexagonal. Swagger local: http://localhost:5090/swagger

Swagger publicado: https://gl-demandas-cfffckaaa2cvd5fa.westus-01.azurewebsites.net/swagger

```bash
dotnet test backend/Gl.Demandas.slnx
dotnet run --project backend/src/Gl.Demandas.Api --launch-profile http
```

Desenvolvimento usa banco em memória e o seed da demonstração. Para SQL Server, aplique os scripts em `infra/database/sql-server` e defina:

- `Database__Provider=SqlServer`
- `ConnectionStrings__Sql`

Login demo (senha `Demo@2026`, só desenvolvimento):

| Perfil | E-mail |
|---|---|
| Cessionário | joao.silva@empresaexemplo.com.br |
| GL / Administrador | patricia.lima@gleventos.com.br |
| Responsável da Área | responsavel.01@gleventos.com.br |

Recepção: `responsavel.02@gleventos.com.br`. Estacionamento: `responsavel.03@gleventos.com.br`.

`Auth__Mode=Entra` valida JWT do Entra ID. Os app roles precisam se chamar exatamente Cessionário, GL / Administrador e Responsável da Área. Fora de Development, o modo Demo exige `Auth__SigningKey` com pelo menos 32 caracteres.
