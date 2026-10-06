# Modelo — EF-06

`app.Historico_Demanda`: autor, data, situação anterior, situação nova, comentário, tipo. Append-only. A preferência «Linha do tempo» fica no navegador do usuário, não na demanda.

O quadro do dia e a pesquisa da GL leem essa trilha e `app.Comunicado_Evento` (publicação, leitura e encerramento). Não há tabela nova e não há exclusão de linha. O dia corrente usa o fuso de São Paulo.
