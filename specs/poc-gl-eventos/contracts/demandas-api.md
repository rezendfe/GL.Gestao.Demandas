# Contrato HTTP

Swagger local: http://localhost:5090/swagger

Swagger publicado: https://gl-demandas-cfffckaaa2cvd5fa.westus-01.azurewebsites.net/swagger

JSON em camelCase. Erros: `{ "codigo", "mensagem" }` com 400, 403, 404 ou 422.

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/login` | anônimo |
| GET | `/api/auth/eu` | autenticado |
| POST | `/api/classificacao/sugerir` | autenticado |
| POST | `/api/solicitacoes/preencher` | autenticado |
| GET | `/api/catalogo` | autenticado |
| GET | `/api/demandas` | fila conforme o perfil |
| POST | `/api/demandas` | Cessionário |
| GET | `/api/demandas/{id}` | quem pode ver |
| POST | `/api/demandas/{id}/classificacao` | GL |
| POST | `/api/demandas/{id}/redirecionar` | GL |
| POST | `/api/demandas/{id}/andamento` | área ou GL |
| POST | `/api/demandas/{id}/mensagens` | quem pode ver |
| POST | `/api/demandas/{id}/anexos` | quem pode ver |
| GET | `/api/demandas/{id}/anexos/{anexoId}` | quem pode ver |
| POST | `/api/demandas/{id}/aprovacao` | GL |
| POST | `/api/demandas/{id}/avancar` | área, GL ou Cessionário na validação |
| POST | `/api/demandas/{id}/previsao` | área ou GL |
| POST | `/api/demandas/{id}/avaliacao` | Cessionário do chamado |
| POST | `/api/demandas/{id}/encerramento` | GL |
| POST | `/api/demandas/{id}/cancelamento` | GL, com motivo |
| GET | `/api/cadeia` | autenticado |
| PUT | `/api/cadeia` | GL |
| POST | `/api/catalogo/categorias`, `/tipos-atendimento`, `/areas`, `/responsaveis` | GL |
| GET | `/api/espacos` | conforme o perfil |
| POST | `/api/espacos`, PUT `/api/espacos/{id}` | GL |
| POST | `/api/espacos/{id}/locacoes`, `/locacao/encerramento` | GL |
| GET | `/api/empresas-cessionarias` | autenticado, recorte da empresa quando Cessionário |
| GET | `/api/empresas-cessionarias/administracao` | GL |
| POST e PUT | `/api/empresas-cessionarias` e representantes e funções | GL |
| GET | `/api/obras` e `/api/obras/{id}` | autenticado |
| GET | `/api/notificacoes` | autenticado |
| POST | `/api/notificacoes/{id}/leitura` | dono da notificação |
| POST | `/api/notificacoes/{id}/resposta` | Cessionário |
| GET | `/api/notificacoes/push/chave` | autenticado |
| POST | `/api/notificacoes/push` | autenticado, inscreve o aparelho |
| POST | `/api/notificacoes/push/cancelamento` | autenticado, retira o aparelho |
| GET | `/health` | anônimo |

Preenchimento após o ditado. Pedido: `{ "texto": "..." }`. Resposta: campos nulos quando a fala não os cita; `origem` é `modelo` ou `leitura-local`.

```json
{
  "assunto": "Vazamento do ar-condicionado",
  "sala": "Sala 534",
  "ponto": "Próximo ao Instituto de incêndio Rosa",
  "dataDesejada": "2026-09-29",
  "periodo": "Manhã",
  "telefone": "(21) 99468-4864",
  "itens": ["Ar-condicionado", "Infiltração", "Elétrica"],
  "autorizaAcesso": true,
  "sugestao": null,
  "origem": "leitura-local",
  "aviso": "A leitura automática preencheu o que reconheceu no texto. Revise antes de abrir o chamado. A classificação é uma sugestão."
}
```

Abertura:

```json
{ "descricao": "Estou com uma infiltração no teto da sala 205.", "sala": "Sala 205", "ponto": "Teto", "subcategoriaId": "44444444-4444-4444-8444-444444444401", "canal": "PORTAL" }
```

Aprovação de `GL-2026-00131` (`55555555-5555-4555-8555-555555555131`):

```json
{ "decisao": "Aprovar", "motivo": null }
```

`Solicitar ajuste` e `Reprovar` exigem motivo.
