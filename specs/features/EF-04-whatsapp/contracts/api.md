# Contrato — EF-04

Ainda sem rota. Quando existir:

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/catalogo/tipos-atendimento/{id}/whatsapp` | GL / Administrador. Corpo com o número |
| GET | `/api/catalogo` | Inclui os números da categoria ou subcategoria para o GL / Administrador |

O Cessionário não dispara o envio. A abertura (`POST /api/demandas`) não passa a esperar o WhatsApp.
