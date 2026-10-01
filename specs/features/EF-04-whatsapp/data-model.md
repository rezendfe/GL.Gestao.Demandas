# Modelo — EF-04

Ainda sem tabela. O alvo, quando T401 for implementada:

| Tabela | Uso |
|---|---|
| WhatsApp da categoria ou subcategoria | Número cadastrado pelo GL / Administrador. Não é `Representante_Contato` |
| Outbox | Evento `NotificacaoWhatsAppSolicitada` na mesma transação da demanda |
| Historico_Demanda | Sucesso ou falha do envio, sem apagar a demanda |

Não criar fila em memória.
