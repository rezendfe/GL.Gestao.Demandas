# SQL Server — schema `app`

Banco da entrega: catálogo `gl-demandas` no servidor `smartezy.database.windows.net`. A senha não entra no repositório; a API publicada lê `ConnectionStrings__Sql` nas configurações do App Service.

Ordem de aplicação:

1. `01_schema.sql`
2. `02_tables.sql`
3. `11_seed.sql`
4. `12_espacos_locacoes.sql`
5. `13_alinhamento_modelo.sql`
6. `14_conteudo_demonstracao.sql`
7. `16_comunicados.sql`
8. `17_modelo_abertura.sql`

A API não executa `Database.Migrate()` nem `EnsureCreated()`. O provedor da API é sempre `SqlServer`, apontando para este catálogo. O seed de demonstração em `DemoSeed` existe para os testes automatizados. Cada teste cria o próprio catálogo SQL Server, pela variável `GL_TEST_SQL` ou pelo LocalDB, e o apaga ao terminar. Esses testes não gravam neste servidor.

```bash
sqlcmd -S localhost -d GlDemandas -E -i 01_schema.sql
sqlcmd -S localhost -d GlDemandas -E -i 02_tables.sql
sqlcmd -S localhost -d GlDemandas -E -i 11_seed.sql
sqlcmd -S localhost -d GlDemandas -E -i 12_espacos_locacoes.sql
sqlcmd -S localhost -d GlDemandas -E -i 13_alinhamento_modelo.sql
sqlcmd -S localhost -d GlDemandas -E -i 14_conteudo_demonstracao.sql
sqlcmd -S localhost -d GlDemandas -E -i 16_comunicados.sql
sqlcmd -S localhost -d GlDemandas -E -i 17_modelo_abertura.sql
```

`ID_*` é a PK interna. A API expõe somente `CD_*`.

`14_conteudo_demonstracao.sql` completa a base já semeada por `11_seed.sql`: função de representante com as permissões do portal, chamados, histórico, notificações e cadeia de atendimento no mesmo conjunto da demonstração. Pode ser reaplicado.

`12_espacos_locacoes.sql` também pode ser aplicado a uma base existente depois de `11_seed.sql`. O script cria as tabelas de empresa, espaço e locação, relaciona os usuários Cessionários e suas demandas às empresas correspondentes pelo cadastro legado e preserva autoria e snapshots. Se algum usuário ou demanda não puder ser associado, o script interrompe a migração com erro em vez de liberar acesso sem empresa proprietária.
