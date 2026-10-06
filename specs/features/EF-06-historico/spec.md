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

### RF-06.3 Quadro do dia
**Estado:** Feito  
Ao lado do ícone de notificações, Cessionário, GL / Administrador e Responsável da Área abrem um quadro à direita com as ações que a pessoa logada executou naquele dia (fuso de São Paulo). Cada linha traz horário, tipo, chamado ou comunicado e comentário. Ação de outra pessoa não entra nesse quadro.  
**CA:** Dado o usuário autenticado, quando abre o quadro, então aparecem somente as ações que ele executou hoje. Dado uma ação de outro usuário no mesmo dia, quando o quadro abre, então essa ação não aparece.  
**Trace:** PDR RF-06.3 / RN-15

### RF-06.4 Pesquisa da GL
**Estado:** Feito  
No mesmo quadro, o GL / Administrador abre uma tela para pesquisar o que outros usuários executaram, por pessoa, texto e um período com data de início e data de fim. A diferença entre as datas é de no máximo 3 meses, e a tela mostra o histórico desse intervalo. Cessionário e Responsável da Área não usam essa pesquisa.  
**CA:** Dado o GL / Administrador, quando pesquisa uma pessoa com início e fim dentro de 3 meses, então vê as ações daquela pessoa no intervalo. Dado um intervalo maior que 3 meses, quando pesquisa, então a API recusa. Dado Cessionário ou Responsável da Área, quando chama a pesquisa, então a API recusa.  
**Trace:** PDR RF-06.4 / RN-15

### RF-06.5 Base inteira em Excel
**Estado:** Feito  
O GL / Administrador exporta a base inteira da auditoria para Excel, sem o corte de 3 meses da tela. Cessionário e Responsável da Área não exportam.  
**CA:** Dado o GL / Administrador, quando exporta, então o arquivo Excel contém o histórico completo. Dado outro perfil, quando exporta, então a API recusa.  
**Trace:** PDR RF-06.5 / RN-15
