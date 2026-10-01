# Arquitetura — EF-04

Alvo, ainda sem código de envio.

- Parametrização grava os números (mesmo cadastro de [EF-07](../EF-07-parametrizacao/spec.md)).
- Demandas, ao abrir, grava o evento na outbox.
- Notificações consome a fila Azure, chama o provedor e devolve o resultado para o histórico.
- Falha do provedor não desfaz a demanda.

O monólito pode hospedar o consumidor até o serviço de Notificações existir. O transporte continua sendo Azure Service Bus.
