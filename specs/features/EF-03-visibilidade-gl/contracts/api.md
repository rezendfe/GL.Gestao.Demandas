# Contrato — EF-03

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/demandas` | Fila do perfil: todas, da área, ou da empresa |
| GET | `/api/demandas/{id}` | Quem já pode ver. Outra empresa ou outra área: acesso negado, sem corpo da demanda |
