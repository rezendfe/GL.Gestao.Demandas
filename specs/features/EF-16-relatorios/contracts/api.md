# Contrato — EF-16

`GET /api/demandas/exportacao`

Planilha CSV da fila visível. Separador `;`. Campos: protocolo, empresa, local, categoria, situacao, descricao.

`GET /api/demandas/{id}/protocolo`

PDF do protocolo que o perfil já pode abrir. Campos: protocolo, empresa, local, categoria, situação e descrição.

As duas rotas exigem autenticação. Demanda de outra área ou de outra empresa não entra. A exportação não altera a situação nem o histórico.
