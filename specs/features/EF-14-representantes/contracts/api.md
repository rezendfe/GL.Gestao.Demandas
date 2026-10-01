# Contrato — EF-14

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/empresas-cessionarias` | Recorte da empresa quando Cessionário |
| GET | `/api/empresas-cessionarias/administracao` | GL / Administrador |
| POST e PUT | `/api/empresas-cessionarias` | GL / Administrador |
| POST e PUT | `/api/empresas-cessionarias/{id}/representantes` | GL / Administrador |
| POST e PUT | `/api/empresas-cessionarias/{id}/funcoes` | GL / Administrador |

E-mail já ligado a outra empresa é recusado.
