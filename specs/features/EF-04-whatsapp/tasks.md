# Tarefas — EF-04 Notificações WhatsApp

Fonte: [spec.md](spec.md). Não tratar o contato WhatsApp do representante como este envio.

## Feitas

Nenhuma. O contato do representante existe em [EF-14](../EF-14-representantes/spec.md) e não dispara mensagem.

## Em aberto

- [ ] T401 GL / Administrador cadastra um ou mais WhatsApp por categoria ou subcategoria (RF-04.1, RN-06)
- [ ] T402 Na criação da demanda, gravar outbox e publicar `NotificacaoWhatsAppSolicitada` no Azure Service Bus. A API devolve o protocolo sem esperar o provedor (RF-04.2, RN-07)
- [ ] T403 Consumidor idempotente, DLQ, e sucesso ou falha no histórico da demanda (RF-04.3, RN-15)
