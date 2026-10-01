# EF-22 Comunicados

**Estado:** Feito  
**Fase:** B  
**Atores:** GL / Administrador publica e encerra. Cessionário lê. Responsável da Área não publica e não abre esta tela.  
**Contexto:** Notificações. Reusa o aviso de celular do EF-11. Não há serviço novo.  
**Fonte:** PDR EF-22, RN-15, RN-21, RN-43, RNF-08

Não é chamado, não é chat e não é WhatsApp.

### RF-22.1 Publicar e encerrar
**Estado:** Feito  
Título e texto. Encerrar tira o comunicado da lista vigente. A publicação e o encerramento ficam no histórico.  
**CA:** Dado GL / Administrador, quando publica, então o comunicado fica vigente. Dado outro perfil, quando tenta publicar ou encerrar, então a API recusa. Dado encerramento, então o histórico registra e o Cessionário deixa de ver o item.  
**Trace:** RN-15 / RN-43 / EnterCondo TELA-45

### RF-22.2 Leitura do Cessionário
**Estado:** Feito  
O Cessionário acha o vigente, vê o estado e marca a leitura. Não há campo de resposta. O Responsável da Área não abre esta tela.  
**CA:** Dado Cessionário em 360px e em largura de computador, quando abre um comunicado vigente, então vê o texto, a ação de marcar leitura e a página não rola na horizontal. A leitura fica registrada uma vez. Não há campo de resposta.  
**Trace:** RN-43 / RNF-08

### RF-22.3 Aviso no celular
**Estado:** Feito  
A publicação pode usar a notificação já especificada no EF-11. O toque abre `/comunicados/{id}`, não uma conversa e não um chamado.  
**CA:** Dado publicação com aviso de celular, quando o Cessionário recebe, então o aviso abre o comunicado. Não parte mensagem de WhatsApp nem resposta de chamado.  
**Trace:** EF-11 / RN-21 / RN-43
