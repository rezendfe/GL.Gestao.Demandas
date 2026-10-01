# Contrato — EF-02

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/demandas/{id}/classificacao` | GL / Administrador |
| POST | `/api/demandas/{id}/redirecionar` | GL / Administrador |
| POST | `/api/demandas/{id}/andamento` | Responsável da Área da demanda ou GL / Administrador |
| POST | `/api/demandas/{id}/avancar` | Quem a cadeia do tipo autoriza |
| POST | `/api/demandas/{id}/aprovacao` | GL / Administrador. Corpo `{ "decisao", "motivo" }`. Motivo obrigatório em Solicitar ajuste e Reprovar |
| POST | `/api/demandas/{id}/encerramento` | GL / Administrador. Sem corpo. Só a partir de Concluído |
| POST | `/api/demandas/{id}/cancelamento` | GL / Administrador. Corpo `{ "motivo" }` obrigatório. Recusa desfecho já existente |

Responsável da Área e Cessionário recebem acesso negado em encerrar e cancelar.
