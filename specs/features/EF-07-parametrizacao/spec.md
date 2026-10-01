# EF-07 Parametrização

**Estado:** Parcial  
**Atores:** GL / Administrador grava. Responsável da Área e Cessionário não gravam cadastro nem cadeia.  
**Fonte:** PDR EF-07, RN-16, RN-22, RN-27, RN-28

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

### RF-07.1 Cadastros administrativos
**Estado:** Parcial  
O GL / Administrador cria categoria, tipo de atendimento, área e responsável. A meta de prazo da categoria está em RF-07.4. A cadeia está em RF-07.2 e RF-07.3.  
**CA (já vale):** Dado GL / Administrador, quando grava uma categoria, um tipo, uma área ou um responsável, então a consulta do catálogo devolve o registro depois de reiniciar a API. Dado Responsável da Área, quando tenta gravar, então a API recusa.  
**CA (ainda não):** Dado GL / Administrador, quando cadastra WhatsApp da categoria, documento obrigatório do tipo ou uma situação nova de fluxo, então o produto passa a usar esse parâmetro sem deploy. Esses três cadastros não existem.  
**Trace:** docx §14 / RN-16

### RF-07.2 Cadeia por tipo de atendimento
**Estado:** Feito  
O GL / Administrador escolhe o tipo e marca Aprovação, Atendimento ou Validação do cliente como automáticos. Solicitação e Conclusão permanecem. A configuração de um tipo não altera os outros. Trocar o tipo na tela mostra a cadeia daquele tipo.  
**CA:** Dado dois tipos, quando o GL / Administrador marca a aprovação automática só em um, então o chamado desse tipo salta a aprovação e o outro continua exigindo decisão. Dado Responsável da Área ou Cessionário, quando tenta gravar a cadeia, então a API recusa.  
**Trace:** RN-16 / RN-27

### RF-07.3 Tarefas do nó
**Estado:** Parcial  
Cada nó aceita tarefas de comentário, previsão e anexo, obrigatória ou opcional. Tarefa obrigatória pendente bloqueia o avanço. Opcional não bloqueia. Nó automático não pode exigir tarefa obrigatória.  
**CA (já vale):** Dado previsão obrigatória no atendimento, quando se avança sem previsão e sem previsão já gravada, então a API recusa. Dado a mesma tarefa opcional, quando se avança sem ela, então a situação muda. Dado nó automático com tarefa obrigatória, quando o GL / Administrador grava a cadeia, então a API recusa.  
**CA (ainda não):** Dado tarefa com tipo texto, número, data, opção ou confirmação, ou com regra de aplicabilidade condicional, quando o GL / Administrador a configura, então o modal de avanço exige só essa tarefa na condição. O catálogo atual é comentário, previsão e anexo.  
**Trace:** RN-28 / PDR §4.5

### RF-07.4 Meta de prazo em horas
**Estado:** Feito  
O GL / Administrador grava na categoria um inteiro de 1 a 8760, ou deixa em branco. Em branco, chamado sem previsão não entra em atraso. A meta de uma categoria não altera as outras. Outro perfil não grava.  
**CA:** Dado Manutenção com meta de 2 horas, quando um chamado em aberto dessa categoria não tem previsão e foi aberto há mais de 2 horas, então GL / Administrador e o Responsável da Área da fila o veem em atraso. Dado previsão ainda no futuro, então não entra em atraso por essa meta. Dado valor fora de 1 a 8760, quando se grava, então a API recusa.  
**Trace:** RN-16 / RN-22 / RF-07.4
