# Contrato — EF-06

O histórico volta em `GET /api/demandas/{id}`, no array `historico`. Não há rota para apagar ou editar linha.

- `GET /api/auditoria/dia` — ações do usuário autenticado no dia corrente.
- `GET /api/auditoria/pessoas` — pessoas pesquisáveis. Somente GL / Administrador.
- `GET /api/auditoria?de=yyyy-MM-dd&ate=yyyy-MM-dd&autorId=&texto=` — pesquisa por pessoa, texto e período. Início e fim são obrigatórios e a diferença é de no máximo 3 meses. Devolve o histórico desse intervalo. Somente GL / Administrador. Cessionário e Responsável da Área recebem 403.
- `GET /api/auditoria/exportacao` — arquivo `auditoria.xlsx` com a base inteira, sem limite de período. Somente GL / Administrador.
