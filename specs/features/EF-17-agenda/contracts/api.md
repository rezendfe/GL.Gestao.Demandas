# Contrato — EF-17

`GET /api/agenda`

Autenticado. GL / Administrador e Responsável da Área recebem a lista. Cessionário recebe 403.

Cada item: `origem` (`demanda` ou `obra`), `id`, `titulo`, `situacao`, `marco` (`previsao`, `data-desejada`, `inicio`, `termino`) e `data` (`aaaa-mm-dd`).

A consulta não altera a demanda nem a obra.
