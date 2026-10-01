# Contrato — EF-07

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/catalogo` | autenticado |
| POST | `/api/catalogo/categorias` | GL / Administrador. Prazo 1–8760 ou nulo |
| POST | `/api/catalogo/tipos-atendimento` | GL / Administrador |
| POST | `/api/catalogo/areas` | GL / Administrador |
| POST | `/api/catalogo/responsaveis` | GL / Administrador |
| GET | `/api/cadeia` | autenticado |
| PUT | `/api/cadeia` | GL / Administrador. Nó automático com tarefa obrigatória é recusado |
