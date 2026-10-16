# EF-04 Notificações WhatsApp

**Atores:** GL / Administrador cadastra os números. O sistema envia na criação. Responsável da Área é o destinatário. Cessionário não dispara este aviso.  
**Fonte:** PDR EF-04, RN-06, RN-07, RN-16, §7.3

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md)

Contrato da aplicação. A construção está em [tarefas](tasks.md).

O WhatsApp cadastrado no contato do representante não é este requisito. Contato não autoriza envio.

### RF-04.1 Números por categoria
Cada categoria ou subcategoria tem um ou mais WhatsApp cadastrados pelo GL / Administrador, sem alteração de código.  
**CA:** Dado GL / Administrador, quando grava um número na subcategoria, então a consulta seguinte devolve esse número. Dado Responsável da Área ou Cessionário, quando tenta gravar o número, então a API recusa.  
**Trace:** docx §5 / RN-06 / RN-16

### RF-04.2 Envio na criação pela fila
Na criação da demanda, o sistema publica `NotificacaoWhatsAppSolicitada` pela fila Azure e o envio ocorre fora do pedido HTTP. Não há fila em memória como transporte.  
**CA:** Dado demanda criada com WhatsApp cadastrado na categoria, quando o envio é processado, então o responsável cadastrado é notificado e a API de abertura não espera o provedor de WhatsApp para devolver o protocolo.  
**Trace:** RN-07 / PDR §7.3

### RF-04.3 Sucesso ou falha no histórico
O resultado do envio entra no histórico da demanda. Falha não apaga a demanda.  
**CA:** Dado envio bem-sucedido, quando o consumidor confirma, então o histórico registra o envio. Dado falha do provedor, quando o consumidor esgota a tentativa, então o histórico registra a falha e a demanda continua disponível para o GL / Administrador.  
**Trace:** RN-07 / RN-15

### RF-04.4 Conteúdo do aviso de status
Quem abriu ou acompanha o chamado recebe, a cada mudança de status, a frase já usada (`Chamado {protocolo} ({serviço}), que você abriu, está com o status {status}.`). Depois dela entra o texto escrito nessa alteração, quando não for frase automática do sistema. Fotos e áudios anexados ao chamado nos dois minutos anteriores à mudança seguem na mesma conversa do WhatsApp: foto como imagem; áudio que o WhatsApp reproduz como áudio; os demais áudios como arquivo. A mensagem de texto termina com o link do portal que abre esse chamado (`/demandas/{id}`). A ausência de texto, foto ou áudio não tira a frase nem o link. Falha de uma mídia não cancela o texto.  
**CA:** Dado chamado que passa a Liberado para execução com a observação «pode executar», uma foto e um áudio anexados na hora, quando o aviso é montado para quem abriu, então o texto começa com «Chamado GL-2026-00132 (Fibra), que você abriu, está com o status Liberado para execução.», inclui «pode executar» e o link do chamado, e a foto e o áudio são enviados em seguida. Dado a mesma mudança sem observação nem mídia, quando o aviso é montado, então a frase do status e o link permanecem, sem bloco de alteração.  
**Trace:** PDR RF-04.4 / RN-07 / RN-15
