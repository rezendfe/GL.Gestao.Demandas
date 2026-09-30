# SQL Server — schema `app`

Ordem de aplicação:

1. `01_schema.sql`
2. `02_tables.sql`
3. `11_seed.sql`
4. `12_espacos_locacoes.sql`

A API não executa `Database.Migrate()`. Em desenvolvimento o provider padrão é `InMemory` e o seed equivalente está em `DemoSeed`. Para SQL Server, aplique estes scripts e suba a API com `Database:Provider=SqlServer`.

```bash
sqlcmd -S localhost -d GlDemandas -E -i 01_schema.sql
sqlcmd -S localhost -d GlDemandas -E -i 02_tables.sql
sqlcmd -S localhost -d GlDemandas -E -i 11_seed.sql
sqlcmd -S localhost -d GlDemandas -E -i 12_espacos_locacoes.sql
```

`ID_*` é a PK interna. A API expõe somente `CD_*`.

`12_espacos_locacoes.sql` também pode ser aplicado a uma base existente depois de `11_seed.sql`. O script cria as tabelas de empresa, espaço e locação, relaciona os usuários Cessionários e suas demandas às empresas correspondentes pelo cadastro legado e preserva autoria e snapshots. Se algum usuário ou demanda não puder ser associado, o script interrompe a migração com erro em vez de liberar acesso sem empresa proprietária.
