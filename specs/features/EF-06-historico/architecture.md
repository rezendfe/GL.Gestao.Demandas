# Arquitetura — EF-06

`Demanda.RegistrarHistorico` é o único caminho de inclusão no chamado. Consulta no detalhe. Portal: `LinhaDoTempoAtendimento` e `useLinhaDoTempo`. Trocar a vista não regrava o histórico.

O quadro do dia e a pesquisa passam por `AuditoriaAplicacao` e pela porta `IAuditoria`. A leitura junta `Historico_Demanda` e `Comunicado_Evento`. O portal abre o quadro em `QuadroAuditoria`, ao lado do sino, e a pesquisa da GL em `/auditoria`.
