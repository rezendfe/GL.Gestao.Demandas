# EF-08 Portal em dispositivo móvel

**Estado:** Feito  
**Atores:** Cessionário, GL / Administrador e Responsável da Área.  
**Fonte:** PDR EF-08, RNF-08

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

### RF-08.1 Largura a partir de 360px
**Estado:** Feito  
Login, navegação, listas, detalhe, abertura, Obras e mensageria cabem no celular, sem rolagem horizontal da página.  
**CA:** Dado viewport de 360px, quando o usuário autenticado percorre login, início, abertura, detalhe, Obras e mensageria, então a página não rola na horizontal.  
**Trace:** PDR RF-08.1

### RF-08.2 Jornada do Cessionário no celular
**Estado:** Feito  
O Cessionário abre chamado, acompanha as próprias solicitações, responde e anexa no celular.  
**CA:** Dado Cessionário em 360px com permissão de abrir, responder e anexar, quando conclui essas três ações, então cada uma grava no chamado da empresa dele.  
**Trace:** PDR §2.1 / RF-08.2
