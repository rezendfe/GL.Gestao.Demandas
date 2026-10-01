# Modelo — EF-02

`Demanda.SG_Situacao` é texto, sem check que liste os valores. Situações gravadas: Novo, Recebido, Em andamento, Aguardando aprovação, Liberado para execução, Aguardando ajuste, Aguardando validação, Reprovado, Concluído, Encerrada, Cancelada.

| Tabela | Uso |
|---|---|
| Demanda | Área, responsável, situação, fluxo |
| Historico_Demanda | Autor, situação anterior, situação nova, tipo ENCERRAMENTO ou CANCELAMENTO |
| Decisao_Aprovacao | Aprovar, Solicitar ajuste, Reprovar |
| Etapa_Cadeia | Próxima etapa manual do tipo |
| Subcategoria | Área de destino e fluxo |

O mapa para o ciclo do PDR §4.1 está na spec. Os rótulos já gravados não são renomeados.
