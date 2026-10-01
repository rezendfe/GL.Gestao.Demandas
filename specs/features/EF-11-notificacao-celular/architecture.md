# Arquitetura — EF-11

`NotificacaoAplicacao` inscreve e cancela. `AtendimentoAplicacao` grava o aviso e chama `IEnvioPush`. Infraestrutura: `EnvioPushWeb`. Portal: `SinoNotificacoes`, `notificacaoCelular.ts`, `public/sw.js`. Sem app nativo.
