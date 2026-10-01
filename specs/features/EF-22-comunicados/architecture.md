# Arquitetura — EF-22

Contexto Notificações, no mesmo serviço das demandas. `ComunicadosAplicacao` grava em `IComunicados` e, se o GL / Administrador pedir, chama o `IEnvioPush` já usado pelo EF-11.

O payload do celular leva a URL `/comunicados/{id}`. Não usa `?responder` nem abre chamado. Não publica evento de WhatsApp.
