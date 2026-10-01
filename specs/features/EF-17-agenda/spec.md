# EF-17 Agenda operacional

**Estado:** Feito  
**Fase:** B  
**Atores:** GL / Administrador e Responsável da Área. O Cessionário não abre esta agenda.  
**Contexto:** Demandas. O cronograma lido é o já gravado em Obras. Não há serviço novo.  
**Fonte:** PDR EF-17, RN-04, RN-05, RN-14, RNF-08

A agenda não cria data. Usa data desejada, previsão de atendimento e marco do cronograma de obra.

### RF-17.1 Calendário da fila autorizada
**Estado:** Feito  
GL / Administrador vê a operação. Responsável da Área vê a própria área. Cada item usa uma data que o produto já gravou. A data desejada é a já gravada na descrição ou na mensagem, no texto "Data desejada: dd/mm/aaaa". O marco da obra usa o início e o término previstos. A obra não tem área, então esses marcos entram na agenda do GL / Administrador. O Responsável da Área não vê marco de obra de outra área, nem de área nenhuma: vê data desejada e previsão das demandas da própria área.  
**CA:** Dado o perfil em 360px e em largura de computador, quando abre a agenda, então vê só a fila autorizada, a situação de cada item e a página não rola na horizontal. Dado demanda de outra área, então ela não entra. Dado obra, quando o Responsável da Área abre a agenda, então o marco da obra não entra.  
**Trace:** RN-04 / RN-05 / RN-14 / EnterCondo TELA-14

### RF-17.2 Do calendário ao detalhe
**Estado:** Feito  
O item da demanda abre o detalhe. O item da obra abre a tela de Obras. O Cessionário não entra nesta tela. A previsão dele continua no resumo (RF-10.5).  
**CA:** Dado um item da agenda, quando o perfil o aciona, então abre o detalhe correspondente. Dado Cessionário, quando tenta a agenda, então não a vê.  
**Trace:** RF-10.5 / PDR RF-17.2
