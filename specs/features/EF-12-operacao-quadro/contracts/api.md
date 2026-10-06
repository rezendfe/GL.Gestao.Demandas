# Contrato — EF-12

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/demandas` | Fila da central |
| POST | `/api/demandas/{id}/avancar` | Quem a cadeia autoriza. Recusa a entrada na Validação do cliente manual sem foto de finalidade `obra` |
| POST | `/api/demandas/{id}/anexos` | Campo `finalidade=obra` grava a foto da obra executada. Sem o campo, o anexo é `documento` |
| POST | `/api/demandas/{id}/avaliacao` | Cessionário do chamado. Corpo `{ "nota", "comentario" }`. Nota 0–10, uma vez |
| POST | `/api/demandas` | Cessionário pode marcar reclamação |
