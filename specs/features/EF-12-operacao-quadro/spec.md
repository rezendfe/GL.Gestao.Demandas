# EF-12 Operação, quadro e avaliação

**Estado:** Feito  
**Atores:** GL / Administrador vê a operação inteira. Responsável da Área vê a própria área. Cessionário marca reclamação, valida o próprio serviço e avalia de 0 a 10.  
**Fonte:** PDR EF-12, RN-22 a RN-28

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

Ponto de atenção inclui complemento sem resposta, prioridade alta em aberto, chamado sem previsão há mais de um dia e, para o Responsável da Área, item que aguarda decisão do GL / Administrador.

### RF-12.1 Atraso e ação agora
**Estado:** Feito  
**CA:** Dado chamado com previsão vencida, ou sem previsão e com a meta de horas da categoria já estourada, quando GL / Administrador ou o Responsável da Área da fila abre o início, então o chamado aparece em atraso. Dado um item de ação agora, quando é acionado, então o detalhe abre.  
**Trace:** RN-22 / RN-23

### RF-12.2 Central operacional e quadro
**Estado:** Feito  
Uma Central operacional com visões Quadro, Operação, Central operacional e Agenda. O quadro tem as colunas Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão. Cartão em atraso ou reclamação fica identificado. Avançar abre o modal da próxima etapa manual do tipo. Etapa automática não retém o chamado. A visão Agenda é o calendário da EF-17.  
**CA:** Dado GL / Administrador, quando abre o quadro, então vê as cinco colunas da operação inteira. Dado Responsável da Área, quando abre o quadro, então as colunas só têm a área dele. Dado cartão, quando é solto na próxima coluna com as tarefas obrigatórias, então a situação muda. Dado endereço antigo do quadro, da operação ou da agenda, quando é acessado, então a Central abre na visão correspondente.  
**Trace:** RN-27 / PDR RF-12.2 / RF-12.9

### RF-12.3 Visão Operação
**Estado:** Feito  
**CA:** Dado a visão Operação, quando o perfil a abre, então vê ação agora, atraso, reclamações, pontos de atenção e a nota dos serviços concluídos, só na fila autorizada.  
**Trace:** RN-04 / RN-05 / RN-22 / RN-23

### RF-12.4 Reclamação
**Estado:** Feito  
Na abertura, o Cessionário pode marcar o chamado como reclamação. A operação lista reclamações em aberto antes das já encerradas.  
**CA:** Dado abertura com natureza reclamação, quando a demanda é gravada, então a operação a lista entre as reclamações em aberto.  
**Trace:** RN-24

### RF-12.5 Nota de 0 a 10
**Estado:** Feito  
Com o serviço Concluído, o Cessionário daquele chamado informa a nota uma vez, com comentário opcional de até 500 caracteres. A nota entra no histórico. Chamado em aberto, outro perfil ou segunda nota são recusados. Promotor é 9–10, neutro 7–8, detrator 0–6.  
**CA:** Dado chamado Concluído sem nota, quando o Cessionário da empresa envia 8, então a nota fica no chamado. Dado a mesma demanda, quando envia de novo, então a API recusa. Dado chamado Em andamento, quando tenta avaliar, então a API recusa.  
**Trace:** RN-15 / RN-25

### RF-12.6 Celular
**Estado:** Feito  
**CA:** Dado 360px, quando se abre o seletor, o quadro, a operação, a agenda ou a pergunta de nota, então a página não rola na horizontal. O quadro pode rolar uma coluna por vez.  
**Trace:** PDR RF-12.6

### RF-12.7 Aprovação automática no quadro
**Estado:** Feito  
**CA:** Dado a aprovação automática naquele tipo, quando a solicitação avança, então o histórico registra a aprovação automática e o chamado segue para a próxima etapa manual. Os outros tipos não mudam.  
**Trace:** RN-27 / RF-07.2

### RF-12.8 Tarefas no avanço
**Estado:** Feito  
O avanço só confirma depois das tarefas obrigatórias. Anexo aceito fica na demanda. Conclusão, decisão, valores e evidências entram no histórico com autor e data. Para ir à Validação do cliente manual, o modal pede as fotos da obra executada; sem ao menos uma imagem, a API recusa. O Cessionário vê essas fotos ao confirmar o serviço.  
**CA:** Dado tarefa obrigatória de comentário, quando se confirma o avanço sem texto, então a API recusa e a situação permanece. Dado o avanço para Validação do cliente sem foto da obra, quando se confirma, então a API recusa. Com a foto, o chamado fica Aguardando validação.  
**Trace:** RN-15 / RN-18 / RN-28 / RN-44

### RF-12.9 Fila da Central
**Estado:** Feito  
A visão Central operacional mostra indicadores e a fila com filtros. Trocar entre Quadro, Operação, Central operacional e Agenda não amplia a fila do perfil.  
**CA:** Dado Responsável da Área, quando alterna Quadro, Operação, Central operacional e Agenda, então nenhum chamado de outra área aparece.  
**Trace:** RN-05 / PDR RF-12.9
