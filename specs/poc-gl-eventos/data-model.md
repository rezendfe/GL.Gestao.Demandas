# Modelo de dados

Schema `app`. PK `ID_* BIGINT IDENTITY`, nunca exposta. API `id` = `CD_*`. Sem prefixo `FL_`. Situação e perfil usam `SG_*`.

| Tabela | Papel |
|---|---|
| Area, Categoria, Subcategoria | Catálogo e destino |
| Usuario | Três perfis e cessionários da fila |
| Regra_Classificacao | Termos do classificador |
| Demanda | Chamado, protocolo `GL-AAAA-NNNNN` |
| Mensagem, Anexo, Historico_Demanda, Decisao_Aprovacao | Timeline |
| Obra, Obra_Documento | Fluxo de obras |
| Notificacao | `SG_Leitura` = `NAO_LIDA` ou `LIDA` |

FKs apontam para `ID_*`. A numeração de protocolo da POC começa em 128 e pula números já usados, para o primeiro chamado da demonstração sair como `GL-2026-00128`.

O seed não cria `GL-2026-00128`. Já existem `00125`, `00126`, `00127` e `00131`.
