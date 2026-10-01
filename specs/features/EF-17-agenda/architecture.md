# Arquitetura — EF-17

Contexto Demandas. `AgendaAplicacao` lê `IDemandas` e `IObras`. Não grava, não publica evento e não abre fila.

A previsão vem de `Demanda.PrevisaoAtendimento`. A data desejada vem do texto já gravado na descrição ou na mensagem. O marco da obra vem de `InicioPrevisto` e `TerminoPrevisto`.

GL / Administrador vê a operação, inclusive a obra. Responsável da Área vê as demandas da própria área. Cessionário recebe recusa. A obra não tem área, então o marco fica só com o GL / Administrador.
