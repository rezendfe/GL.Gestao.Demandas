# Arquitetura — EF-04

Alvo, ainda sem código de envio.

- Parametrização grava os números (mesmo cadastro de [EF-07](../EF-07-parametrizacao/spec.md)).
- Demandas, ao abrir, grava o evento na outbox.
- Notificações consome a fila Azure, chama o provedor e devolve o resultado para o histórico.
- Falha do provedor não desfaz a demanda.

O monólito pode hospedar o consumidor até o serviço de Notificações existir. O transporte continua sendo Azure Service Bus.

O aviso de mudança de status (RF-04.4) sai pelo mesmo envio já ligado ao provedor de WhatsApp. O texto leva a frase do status, a observação da alteração e o link público do portal (`Portal:PublicUrl` + `/demandas/{id}`). Foto e áudio dessa alteração sobem ao provedor e seguem como mensagens de mídia na mesma conversa. O arquivo continua no armazenamento do chamado; o link não expõe o arquivo sem login.
