# EF-10 Início operacional por perfil

**Estado:** Feito  
**Atores:** Cada perfil cai no próprio início. Os números saem só da fila que o perfil já pode ver.  
**Fonte:** PDR EF-10, RN-04, RN-05, RN-19, RN-20, RN-22

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

### RF-10.1 Destino após o login
**Estado:** Feito  
**CA:** Dado login válido de cada perfil, quando a sessão abre, então a primeira tela é o início daquele perfil.  
**Trace:** PDR RF-10.1

### RF-10.2 Painel do GL / Administrador e do Responsável da Área
**Estado:** Feito  
Medidor de conclusão, etapas Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão, distribuição pelas áreas de manutenção, itens em aberto mais antigos e atalhos.  
**CA:** Dado GL / Administrador, quando abre o início, então os medidores usam a operação inteira. Dado Responsável da Área, quando abre o início, então os mesmos blocos usam só a área dele.  
**Trace:** PDR RF-10.2 / RN-04 / RN-05

### RF-10.3 Recortes exclusivos do GL / Administrador
**Estado:** Feito  
Obras por etapa (Projeto, Análise, Documentação, Aprovação, Execução, Conclusão), cessionários com maior volume, o que mais volta entre os abertos e destaque quando há chamado aguardando aprovação.  
**CA:** Dado ao menos uma demanda Aguardando aprovação, quando o GL / Administrador abre o início, então a decisão aparece em destaque. Dado Responsável da Área, quando abre o início, então não vê o ranking de cessionários da operação inteira.  
**Trace:** PDR RF-10.3

### RF-10.4 Próximo andamento da área
**Estado:** Feito  
**CA:** Dado Responsável da Área com chamado em que pode registrar andamento, quando abre o início, então esse próximo chamado está indicado e abre o detalhe.  
**Trace:** PDR RF-10.4 / RN-05

### RF-10.5 Resumo do Cessionário
**Estado:** Feito  
Logo da empresa, imagem do contato principal quando houver, chamados em aberto que a função permite consultar, situação, quem atende, previsão, pendências e complementos. Sem ranking, recorrência, prioridade agregada nem medidores de gestão.  
**CA:** Dado Cessionário, quando abre o início, então vê só chamados da empresa que a função permite e não vê ranking de cessionários nem medidor de gestão.  
**Trace:** PDR RF-10.5 / RN-19 / RN-20

### RF-10.6 Atalho e 360px
**Estado:** Feito  
**CA:** Dado um chamado do resumo, quando o usuário o aciona, então o detalhe abre. Dado 360px, quando o início é exibido, então não há rolagem horizontal.  
**Trace:** PDR RF-10.6

### RF-10.7 Indicadores acionáveis
**Estado:** Feito  
Cartão, etapa, barra e ranking abrem o detalhe quando há um protocolo, ou a Central operacional já filtrada quando há vários. A barra de obra abre Obras.  
**CA:** Dado um recorte com um único protocolo, quando o GL / Administrador aciona o indicador, então o detalhe abre. Dado vários protocolos, quando aciona, então a fila filtrada abre.  
**Trace:** PDR RF-10.7

### RF-10.8 Previsão e pendência
**Estado:** Feito  
Responsável da Área ou GL / Administrador grava a previsão. O Cessionário só consulta. Pendência é complemento sem resposta do Cessionário, ou chamado em Aguardando ajuste.  
**CA:** Dado Cessionário, quando tenta gravar previsão, então a API recusa. Dado mensagem de complemento sem resposta, quando o Cessionário abre o resumo, então o chamado aparece como pendência até ele responder.  
**Trace:** PDR RF-10.8 / RN-21
