# Contrato — EF-13

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/espacos` | GL / Administrador vê o inventário. Cessionário, o recorte da empresa |
| POST | `/api/espacos` | GL / Administrador |
| PUT | `/api/espacos/{id}` | GL / Administrador |
| POST | `/api/espacos/{id}/locacoes` | GL / Administrador |
| POST | `/api/espacos/{id}/locacao/encerramento` | GL / Administrador |

Responsável da Área recebe acesso negado ao gravar.
