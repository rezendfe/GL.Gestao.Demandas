# EF-03 Visibilidade do GL / Administrador

**Estado:** Feito  
**Atores:** GL / Administrador vê todas as demandas. Responsável da Área vê a própria área. Cessionário vê a empresa, conforme a função.  
**Fonte:** PDR EF-03, RN-04, RN-05, RN-08

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

### RF-03.1 Detalhe completo
**Estado:** Feito  
A lista e o detalhe do GL / Administrador mostram protocolo, cessionário, local, data e hora, categoria, subcategoria, descrição, anexos, responsável, situação, prazo ou previsão, histórico e comunicação. O atendimento pela área não esconde o chamado do GL / Administrador.  
**CA:** Dado demandas em áreas diferentes, quando o GL / Administrador abre a fila, então vê todas. Dado o detalhe, quando abre um protocolo, então protocolo, empresa, local, categoria, situação, mensagens, anexos e histórico estão na mesma tela. Dado Responsável da Área, quando consulta a fila, então só aparecem demandas da área dele. Dado Cessionário, quando consulta demanda de outra empresa, então a API recusa sem devolver o conteúdo.  
**Trace:** docx §4 / RN-04 / RN-05 / RN-08
