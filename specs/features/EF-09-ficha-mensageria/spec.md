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
**Estado:** Feito  
O menu não tem Mensageria. O ícone ao lado das notificações abre um painel no padrão das ações rápidas: temas à esquerda, do mais recente ao mais antigo, cada um com dia, hora, faixa colorida, protocolo e por quem é o chamado. Ao escolher, a conversa do chamado aparece no padrão da comunicação do detalhe. O envio entra no chamado.  
**CA:** Dado usuário autenticado, quando o portal abre, então o menu não oferece Mensageria e o topo mostra o ícone de mensagens ao lado das notificações. Dado um tema da fila visível, quando o usuário o escolhe, então a conversa daquele chamado aparece no painel e o envio entra no chamado.  
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
