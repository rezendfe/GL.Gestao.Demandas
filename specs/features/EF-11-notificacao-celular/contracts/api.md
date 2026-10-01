# Contrato — EF-11

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/notificacoes` | autenticado |
| POST | `/api/notificacoes/{id}/leitura` | dono |
| POST | `/api/notificacoes/{id}/resposta` | Cessionário. Corpo `{ "texto" }` |
| GET | `/api/notificacoes/push/chave` | autenticado |
| POST | `/api/notificacoes/push` | autenticado. Corpo com endpoint, chave P-256 e segredo |
| POST | `/api/notificacoes/push/cancelamento` | autenticado |
