# EF-05 Obras

**Estado:** Parcial  
**Atores:** Cessionário solicita. GL / Administrador aprova, reprova ou pede ajuste. Responsável da Área não aprova obra.  
**Fonte:** PDR §3.3, §4.3, EF-05, RN-09 a RN-14

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

Obras continua subcategoria de Manutenção. A tela atual lista a obra de demonstração e o checklist. O fluxo de aprovação de chamado com fluxo Obra usa a decisão do GL / Administrador em EF-02. O gate documental da RN-09 ainda não bloqueia o envio.

### RF-05.1 Formulário e documentos obrigatórios
**Estado:** Parcial  
A obra tem nome, local, descrição, datas previstas, empresa executora, responsável e contato. O checklist mostra Projeto, ART, Seguro e Cronograma como recebido ou pendente.  
**CA (já vale):** Dado usuário autenticado, quando abre Obras, então vê a etapa e o checklist da obra cadastrada. Projeto recebido permanece recebido; ART, Seguro e Cronograma pendentes permanecem pendentes na demonstração.  
**CA (ainda não):** Dado subcategoria Obras, quando o Cessionário envia sem Projeto, ART, Seguro e Cronograma válidos, então a demanda não segue para análise.  
**Trace:** docx §6–9 / RN-09

### RF-05.2 Aprovação exclusiva do GL / Administrador
**Estado:** Parcial  
Aprovar, reprovar ou solicitar ajuste em chamado Aguardando aprovação é só do GL / Administrador, com motivo em ajuste e reprovação. Isso já vale para o fluxo Obra do chamado. Não há versão de Projeto, reenvio de documento nem status do documento (Aguardando análise, Em análise, Aprovado, Reprovado, Necessita ajustes).  
**CA (já vale):** Dado chamado de fluxo Obra aguardando aprovação, quando o Responsável da Área ou o Cessionário tenta decidir, então a API recusa. Dado o GL / Administrador, quando reprova sem motivo, então a API recusa.  
**CA (ainda não):** Dado documento reprovado com motivo, quando o Cessionário envia nova versão, então a versão anterior permanece e a nova volta para análise do GL / Administrador.  
**Trace:** RN-10 / RN-11 / RN-12

### RF-05.3 Cronograma e alerta de seguro
**Estado:** Não feito  
O cronograma acompanha Mobilização, Execução, Instalações, Acabamento e Finalização, com atraso identificável. O seguro guarda seguradora, apólice e vigência e dispara `SeguroProximoVencimento`.  
**CA:** Dado etapa do cronograma com término vencido e status em aberto, quando o GL / Administrador consulta a obra, então a etapa aparece em atraso. Dado apólice próxima do fim da vigência, quando o alerta roda, então o evento é publicado e o histórico da obra registra o aviso.  
**Trace:** RN-13 / RN-14 / PDR §7.3
