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
| GET | `/api/obras` e `/api/obras/{id}` | autenticado |
| GET | `/api/notificacoes` | autenticado |
| POST | `/api/notificacoes/{id}/leitura` | dono da notificação |
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
