# EF-02 Roteamento e ciclo de vida

**Estado:** Parcial  
**Atores:** Sistema direciona. Responsável da Área e GL / Administrador registram andamento. GL / Administrador aprova, encerra e cancela. Cessionário valida o próprio serviço.  
**Fonte:** PDR §4, §6 EF-02, RN-03, RN-10, RN-11, RN-15, RN-27

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

As situações gravadas continuam as da baseline. O quadro usa os cinco nós do §4.5. Encerrada e Cancelada entram neste épico como desfecho, sem renomear Novo, Recebido, Em andamento, Aguardando aprovação, Liberado para execução, Aguardando ajuste, Aguardando validação, Reprovado e Concluído.

## Mapa

| Situação em uso | Nó do quadro | §4.1 |
|---|---|---|
| Novo, Recebido | Solicitação | Aberta, Recebida |
| Aguardando aprovação, Aguardando ajuste | Aprovação | Em análise, Aguardando informação |
| Em andamento, Liberado para execução | Atendimento | Em execução, Aprovada |
| Aguardando validação | Validação do cliente | Aguardando conclusão |
| Concluído, Reprovado, Encerrada, Cancelada | Conclusão | Concluída, Reprovada, Encerrada, Cancelada |

### RF-02.1 Direcionamento à área
**Estado:** Feito  
No envio, a demanda fica na área da subcategoria. O GL / Administrador pode redirecionar. Novo passa a Recebido no redirecionamento.  
**CA:** Dado uma subcategoria ligada a uma área, quando o Cessionário envia a demanda, então ela nasce nessa área. Dado GL / Administrador, quando redireciona para outra área, então a área muda, o histórico registra autor e situações, e o Responsável da Área de origem deixa de vê-la se não for mais a área dele.  
**Trace:** docx §2 / RN-03 / RN-05

### RF-02.2 Andamento e avanço na cadeia
**Estado:** Feito  
Responsável da Área da demanda, ou GL / Administrador, registra o atendimento e avança para a próxima etapa manual do tipo, inclusive a entrada na Validação do cliente, com a foto da obra executada. Etapa automática não segura o chamado e o histórico registra o salto. Aprovação manual é só do GL / Administrador: Aprovar leva a Liberado para execução; Solicitar ajuste e Reprovar exigem motivo. A validação é do Cessionário do chamado: confirmar (conclui) ou devolver, com comentário, a Em andamento.  
**CA:** Dado chamado em Em andamento na área do Responsável da Área, quando ele avança com as tarefas obrigatórias preenchidas e a foto da obra, e a próxima etapa é a Validação do cliente, então a situação fica Aguardando validação e o histórico guarda a anterior e a nova. Dado a próxima etapa Validação do cliente, quando o Cessionário tenta avançar, então a API recusa. Dado Responsável da Área de outra área, quando tenta avançar, então a API recusa. Dado Aguardando aprovação, quando o Responsável da Área tenta aprovar, então a API recusa. Dado o mesmo estado, quando o GL / Administrador aprova, então a situação fica Liberado para execução. Dado Solicitar ajuste ou Reprovar sem motivo, quando o GL / Administrador envia, então a API recusa.  
**Trace:** PDR §4.4 / §4.5 / RN-10 / RN-11 / RN-27

### RF-02.3 Encerrar demanda concluída
**Estado:** Feito  
O GL / Administrador encerra um chamado que já está Concluído. A situação passa a Encerrada e permanece na coluna Conclusão. Não é o mesmo que Concluído: a avaliação 0–10 continua disponível se ainda não foi dada. Responsável da Área e Cessionário não encerram. Chamado que não está Concluído não encerra por este comando. Concluído, Reprovado, Encerrada e Cancelada não aceitam mensagem, documento, classificação, direcionamento, previsão nem outra alteração do atendimento. O GL / Administrador ainda encerra um Concluído.  
**CA:** Dado chamado Concluído, quando o GL / Administrador encerra, então a situação fica Encerrada, o histórico registra Concluído → Encerrada, autor e data, e o chamado deixa de estar em aberto. Dado Responsável da Área ou Cessionário, quando tenta encerrar, então a API recusa e a situação não muda. Dado chamado Em andamento, quando o GL / Administrador tenta encerrar, então a API recusa. Dado chamado Concluído, Reprovado, Encerrada ou Cancelada, quando se envia mensagem ou documento, então a API recusa. A avaliação ainda não dada continua aceita em Concluído e Encerrada.  
**Trace:** PDR §4.4 / RN-15 / Q-09 (quem encerra nesta entrega é o GL / Administrador; regra parametrizada de outro ator continua em aberto)

### RF-02.4 Cancelar demanda em aberto
**Estado:** Parcial  
O GL / Administrador cancela um chamado ainda em aberto, com motivo obrigatório. A situação fica Cancelada, na coluna Conclusão, e o histórico guarda o motivo. Não cancela Concluído, Encerrada, Reprovado nem Cancelada: esses desfechos já existem. O Cessionário não cancela enquanto o parâmetro da §4.4 não existir (Q-09).  
**CA:** Dado chamado Novo, Recebido, Em andamento, Aguardando aprovação, Liberado para execução, Aguardando ajuste ou Aguardando validação, quando o GL / Administrador cancela com motivo, então a situação fica Cancelada e o motivo entra no histórico. Dado cancelamento sem motivo, quando se envia, então a API recusa. Dado outro perfil, quando tenta cancelar, então a API recusa. Dado chamado Concluído, quando se tenta cancelar, então a API recusa.  
**CA (ainda não):** Dado parâmetro que permita o Cessionário cancelar a própria demanda, quando ele cancela com motivo, então a situação fica Cancelada. Esse parâmetro não existe e o Cessionário não cancela.  
**Trace:** PDR §4.4 / RN-11 / RN-15 / Q-09
