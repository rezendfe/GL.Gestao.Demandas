# EF-04 Notificações WhatsApp

**Estado:** Não feito  
**Atores:** GL / Administrador cadastra os números. O sistema envia na criação. Responsável da Área é o destinatário. Cessionário não dispara este aviso.  
**Fonte:** PDR EF-04, RN-06, RN-07, RN-16, §7.3

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

O WhatsApp cadastrado no contato do representante não é este requisito. Contato não autoriza envio.

### RF-04.1 Números por categoria
**Estado:** Não feito  
Cada categoria ou subcategoria tem um ou mais WhatsApp cadastrados pelo GL / Administrador, sem alteração de código.  
**CA:** Dado GL / Administrador, quando grava um número na subcategoria, então a consulta seguinte devolve esse número. Dado Responsável da Área ou Cessionário, quando tenta gravar o número, então a API recusa.  
**Trace:** docx §5 / RN-06 / RN-16

### RF-04.2 Envio na criação pela fila
**Estado:** Não feito  
Na criação da demanda, o sistema publica `NotificacaoWhatsAppSolicitada` pela fila Azure e o envio ocorre fora do pedido HTTP. Não há fila em memória como transporte.  
**CA:** Dado demanda criada com WhatsApp cadastrado na categoria, quando o envio é processado, então o responsável cadastrado é notificado e a API de abertura não espera o provedor de WhatsApp para devolver o protocolo.  
**Trace:** RN-07 / PDR §7.3

### RF-04.3 Sucesso ou falha no histórico
**Estado:** Não feito  
O resultado do envio entra no histórico da demanda. Falha não apaga a demanda.  
**CA:** Dado envio bem-sucedido, quando o consumidor confirma, então o histórico registra o envio. Dado falha do provedor, quando o consumidor esgota a tentativa, então o histórico registra a falha e a demanda continua disponível para o GL / Administrador.  
**Trace:** RN-07 / RN-15
