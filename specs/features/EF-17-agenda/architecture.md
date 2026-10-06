# Arquitetura — EF-17

Contexto Demandas. `AgendaAplicacao` lê `IDemandas` e `IObras`. Não grava, não publica evento e não abre fila.

A previsão vem de `Demanda.PrevisaoAtendimento`. A data desejada vem do texto já gravado na descrição ou na mensagem. O marco da obra vem de `InicioPrevisto` e `TerminoPrevisto`.

GL / Administrador vê a operação, inclusive a obra. Responsável da Área vê as demandas da própria área. Cessionário recebe recusa. A obra não tem área, então o marco fica só com o GL / Administrador.

Portal: a visão Agenda vive em `CentralPage`. `AgendaPage` só desenha o calendário. O endereço `/agenda` redireciona para `/central?visao=agenda`. O Cessionário nesse endereço vai para o início.

A visão Mês, Semana ou Dia fica em `localStorage` na chave `gl.vista-agenda.{usuarioId}`. `lerVistaAgenda` lê essa escolha. Não há API nem evento novo.
