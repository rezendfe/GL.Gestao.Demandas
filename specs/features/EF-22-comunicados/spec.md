# EF-22 Comunicados

**Estado:** Não feito  
**Fase:** B  
**Atores:** GL / Administrador publica e encerra. Cessionário lê. Responsável da Área não publica.  
**Contexto:** Notificações. Reusa o aviso de celular do EF-11. Não há serviço novo.  
**Fonte:** PDR EF-22, RN-15, RN-21, RN-43, RNF-08

Arquitetura, modelo e contrato ficam para o arquiteto.

Não é chamado, não é chat e não é WhatsApp.

### RF-22.1 Publicar e encerrar
**Estado:** Não feito  
Título e texto. Encerrar tira o comunicado da lista vigente.  
**CA:** Dado GL / Administrador, quando publica, então o comunicado fica vigente. Dado outro perfil, quando tenta publicar, então a API recusa. Dado encerramento, então o histórico registra.  
**Trace:** RN-15 / RN-43 / EnterCondo TELA-45

### RF-22.2 Leitura do Cessionário
**Estado:** Não feito  
O Cessionário acha o vigente, vê o estado e marca a leitura.  
**CA:** Dado Cessionário em 360px e em largura de computador, quando abre um comunicado vigente, então vê o texto, a ação de marcar leitura e a página não rola na horizontal. A leitura fica registrada. Não há campo de resposta.  
**Trace:** RN-43 / RNF-08

### RF-22.3 Aviso no celular
**Estado:** Não feito  
A publicação pode usar a notificação já especificada no EF-11. O toque abre o comunicado, não uma conversa.  
**CA:** Dado publicação com aviso de celular, quando o Cessionário recebe, então o aviso abre o comunicado. Não parte mensagem de WhatsApp.  
**Trace:** EF-11 / RN-21 / RN-43
