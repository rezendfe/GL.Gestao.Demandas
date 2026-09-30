# Modelo de dados

Schema `app`. PK `ID_* BIGINT IDENTITY`, nunca exposta. API `id` = `CD_*`. Sem prefixo `FL_`. Situação e perfil usam `SG_*`.

| Tabela | Papel |
|---|---|
| Area, Categoria, Subcategoria | Catálogo e destino. `Categoria.NR_Prazo_Horas` guarda a meta de prazo em horas, ou nulo quando a categoria não tem meta. |
| Usuario | Três perfis e cessionários da fila |
| Regra_Classificacao | Termos do classificador |
| Demanda | Chamado, protocolo `GL-AAAA-NNNNN` |
| Mensagem, Anexo, Historico_Demanda, Decisao_Aprovacao | Timeline |
| Obra, Obra_Documento | Fluxo de obras |
| Notificacao | `SG_Leitura` = `NAO_LIDA` ou `LIDA` |
| Etapa_Cadeia | Quadro por subcategoria. Vazio: a API usa a cadeia padrão |

Colunas acrescentadas em `13_alinhamento_modelo.sql`: `Usuario.DS_Logo_Empresa`, `Usuario.DS_Foto`, `Demanda.DT_Previsao_Atendimento`, `Demanda.SG_Natureza`, `Demanda.NR_Nota_Avaliacao`, `Demanda.DS_Comentario_Avaliacao`, `Demanda.DT_Avaliacao`, `Mensagem.SG_Finalidade`.

Servidor: `smartezy.database.windows.net`, catálogo `gl-demandas`, schema `app`. A API local e a publicada leem esse catálogo. Credencial só em `ConnectionStrings__Sql` (App Service ou user-secrets), nunca no código.

FKs apontam para `ID_*`. A numeração de protocolo da POC começa em 128 e pula números já usados, para o primeiro chamado da demonstração sair como `GL-2026-00128`.

O seed não cria `GL-2026-00128`. Já existem `00125`, `00126`, `00127` e `00131`.
