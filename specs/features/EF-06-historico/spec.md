# EF-06 Histórico e auditoria

**Estado:** Feito  
**Atores:** Cessionário, GL / Administrador e Responsável da Área leem o histórico do chamado que já podem ver. Ninguém apaga linha.  
**Fonte:** PDR EF-06, RN-15

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

### RF-06.1 Trilha append-only
**Estado:** Feito  
Classificação, redirecionamento, andamento, avanço, aprovação, mensagem relevante, previsão e avaliação geram histórico com autor, data, situação anterior, situação nova e comentário.  
**CA:** Dado uma mudança de situação, quando ela é gravada, então existe uma linha de histórico com o autor e as duas situações. Dado a consulta do detalhe, quando se pede o histórico, então as linhas anteriores continuam presentes.  
**Trace:** docx §11 / RN-15

### RF-06.2 Painel ou linha do tempo
**Estado:** Feito  
No detalhe, o checkbox «Linha do tempo» troca o painel atual por uma linha vertical, do mais recente ao mais antigo, com data, autor, ação e, quando houver, mudança de situação, mensagem ou documento. A escolha fica no navegador do usuário e volta na visita seguinte. O conteúdo do histórico não muda com a troca.  
**CA:** Dado o detalhe, quando o usuário marca Linha do tempo, então os mesmos eventos aparecem em ordem do mais novo para o mais antigo. Dado a preferência marcada, quando ele abre o mesmo chamado de novo neste navegador, então a linha do tempo continua selecionada.  
**Trace:** PDR RF-06.2 / RN-15
