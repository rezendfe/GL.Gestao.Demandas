# EF-11 Notificação no celular do Cessionário

**Estado:** Feito  
**Atores:** Cessionário recebe e responde. GL / Administrador e Responsável da Área enviam a mensagem que dispara o aviso. Não há app nativo.  
**Fonte:** PDR EF-11, RN-21

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

### RF-11.1 Aviso da mensagem no chamado aberto
**Estado:** Feito  
Quando o Responsável da Área ou o GL / Administrador envia mensagem em chamado ainda em aberto, o Cessionário recebe notificação com o texto e o protocolo. Mensagem do próprio Cessionário não gera aviso para ele. Chamado fora de aberto não dispara aviso novo.  
**CA:** Dado chamado em aberto, quando o GL / Administrador envia uma mensagem, então o Cessionário desse chamado ganha notificação não lida com o protocolo. Dado o Cessionário, quando ele mesmo envia mensagem, então não nasce aviso para o autor.  
**Trace:** PDR RF-11.1 / RN-21

### RF-11.2 Resposta no mesmo chamado
**Estado:** Feito  
A resposta escrita a partir da notificação entra no mesmo chamado, junto com as mensagens de quem atende e da gestão.  
**CA:** Dado uma notificação não lida, quando o Cessionário responde por ela, então a mensagem fica na demanda daquele protocolo e a notificação pode ser marcada como lida.  
**Trace:** PDR RF-11.2 / RN-21

### RF-11.3 Complemento como pendência
**Estado:** Feito  
Mensagem marcada como complemento aparece no resumo do Cessionário como pendência até ele responder.  
**CA:** Dado complemento sem resposta, quando o Cessionário abre o início, então o chamado está na lista de pendências. Dado a resposta dele gravada, quando o resumo é consultado de novo, então essa pendência sai.  
**Trace:** PDR RF-11.3 / RN-21

### RF-11.4 Celular a 360px
**Estado:** Feito  
**CA:** Dado viewport de 360px, quando o Cessionário abre o resumo, a lista de notificações e a resposta, então não há rolagem horizontal e os alvos cabem no toque.  
**Trace:** PDR RF-11.4

### RF-11.5 Sino no topo
**Estado:** Feito  
O ícone à direita, ao lado do nome, mostra a quantidade não lida. A lista segue o modelo das ações rápidas: dia, hora, faixa colorida, texto e protocolo. Cada item abre a aba Comunicação do chamado no evento correspondente. Áudio enviado mostra o áudio; imagem, arquivo ou texto mostram a mensagem da conversa.  
**CA:** Dado duas notificações não lidas, quando o usuário autenticado olha o topo, então o ícone mostra 2. Dado o item «Áudio enviado», quando ele aciona, então a aba Comunicação abre na mensagem que contém esse áudio. Dado imagem, arquivo ou texto, quando ele aciona, então a mesma aba mostra essa mensagem.  
**Trace:** PDR RF-11.5

### RF-11.6 Push com o portal fechado
**Estado:** Feito  
No celular, o painel do ícone pede autorização para este aparelho. A inscrição fica do usuário autenticado. Sem autorização, o portal não envia o aviso com a tela fechada. O usuário pode retirar a autorização daquele aparelho. As chaves de envio ficam fora do código, no Key Vault ou na configuração do ambiente.  
**CA:** Dado usuário autenticado que autoriza o aparelho, quando a inscrição é gravada, então o endpoint HTTPS e as chaves ficam ligados a esse usuário. Dado a mesma pessoa, quando cancela a inscrição daquele endpoint, então o aparelho deixa de receber. Dado endpoint que não é HTTPS, quando se tenta inscrever, então a API recusa. Dado usuário sem autorização, quando uma mensagem nova nasce, então não há envio para aparelho inexistente.  
**Trace:** PDR RF-11.6 / RN-21
