# Auditoria de arquitetura — EF-11

Domínio `Notificacao` e `InscricaoPush`. Envio em `Infrastructure/Push/EnvioPushWeb.cs`. Sem fila Azure neste aviso: o push sai no mesmo fluxo da mensagem. WhatsApp continua em [EF-04](../EF-04-whatsapp/architecture.md).
