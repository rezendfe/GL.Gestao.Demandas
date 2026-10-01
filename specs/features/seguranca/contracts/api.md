# Contrato — Segurança

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/login` | Anônimo, e-mail e senha de demonstração |
| GET | `/api/auth/eu` | Token válido e usuário cadastrado |
| * | `/api/demandas` e demais grupos autenticados | Sem token: não devolve a fila |

Quando TSEG1 estiver feita, `POST /api/auth/login` deixa de ser o acesso do produto.
