# Contrato — EF-12

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/demandas` | Fila da central |
| POST | `/api/demandas/{id}/avancar` | Quem a cadeia autoriza |
| POST | `/api/demandas/{id}/avaliacao` | Cessionário do chamado. Corpo `{ "nota", "comentario" }`. Nota 0–10, uma vez |
| POST | `/api/demandas` | Cessionário pode marcar reclamação |
