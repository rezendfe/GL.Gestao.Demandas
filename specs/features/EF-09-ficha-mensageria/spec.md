# EF-09 Portal visual, mensageria e ficha do espaço

**Estado:** Parcial  
**Atores:** Cessionário vê o próprio espaço. GL / Administrador vê a lista. Responsável da Área abre a ficha a partir de uma demanda que já pode ver.  
**Fonte:** PDR EF-09

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

O shell claro, a barra lateral, a barra superior e os cartões estão no portal. A identidade é Riocentro / GL. Assets do tema comercial de referência não são copiados.

### RF-09.1 Shell
**Estado:** Feito  
Fundo claro, barra lateral clara, barra superior e cartões. A navegação continua restrita aos três perfis.  
**CA:** Dado usuário autenticado, quando o portal abre, então o shell mostra a navegação do perfil dele e não oferece ação de outro perfil.  
**Trace:** PDR RF-09.1

### RF-09.2 Mensageria
**Estado:** Parcial  
A tela tem lista, thread e ficha lateral. Conversa que já tem protocolo abre o detalhe da demanda.  
**CA (já vale):** Dado uma conversa associada a um protocolo que o Cessionário pode ver, quando ele abre a conversa, então o detalhe da demanda correspondente abre.  
**CA (ainda não):** Dado a thread, quando o Cessionário envia uma mensagem nova por esse canal, então ela entra no chamado. Hoje a thread é simulada para a demonstração; a mensagem real do chamado é a do detalhe e a da notificação.  
**Trace:** PDR RF-09.2

### RF-09.3 Meu espaço
**Estado:** Parcial  
O Cessionário vê a área Meu espaço com a própria identificação e o local da empresa. GL / Administrador abre a ficha pela lista de espaços. Outro Cessionário não vê essa ficha.  
**CA (já vale):** Dado Cessionário autenticado, quando abre Meu espaço, então vê o espaço da própria empresa e não o de outra. Dado GL / Administrador, quando abre um espaço na lista, então vê a mesma ficha.  
**CA (ainda não):** Foto de entrega e fotos da última vistoria são demonstração por sala no portal, não cadastro. Quem grava entrega e vistoria continua em aberto no PDR §11.  
**Trace:** PDR RF-09.3 / §11

### RF-09.4 Cartões abrem o detalhe
**Estado:** Feito  
Cartão de solicitação, conversa e espaço leva à tela do respectivo assunto.  
**CA:** Dado um cartão de chamado na fila visível, quando o usuário o aciona, então o detalhe daquele protocolo abre.  
**Trace:** PDR RF-09.4
