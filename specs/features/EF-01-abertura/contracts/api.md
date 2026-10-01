# Contrato — EF-01

JSON em camelCase. Erros: `{ "codigo", "mensagem" }`.

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/login` | anônimo, sessão de demonstração até T101 |
| POST | `/api/classificacao/sugerir` | autenticado. Corpo `{ "texto" }` |
| POST | `/api/solicitacoes/preencher` | autenticado. Corpo `{ "texto" }`. Resposta com campos nulos quando a fala não os cita; `origem` é `modelo` ou `leitura-local` |
| POST | `/api/demandas` | Cessionário com permissão de abrir. Corpo com descrição, sala, subcategoria e canal `PORTAL` |

Outro perfil ou Cessionário sem permissão recebe acesso negado e nada é gravado.
