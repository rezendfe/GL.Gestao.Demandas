# PDR — Product Design Requirements

**Produto:** Sistema de Gestão de Demandas (GBL)  
**Fonte funcional:** Fluxo de Demandas.docx  
**Stack:** .NET (microsserviços, hexagonal) + React + Azure (AD, SQL Server, filas)  
**Versão:** 1.0  
**Metodologia:** Spec-Driven Development (SDD)

---

## 1. Visão

Plataforma centralizada para registro, classificação, roteamento, acompanhamento e auditoria das demandas solicitadas pelos **Cessionários**, com visibilidade plena do **GL / Administrador**, atuação dos **Responsáveis da Área**, notificações via WhatsApp e fluxo especial de aprovação de **Obras**.

### 1.1 Objetivos

- Registrar solicitações de forma centralizada e rastreável.
- Classificar e direcionar automaticamente à área responsável.
- Permitir acompanhamento de status, prazos e responsáveis.
- Comunicar Cessionário, GL e áreas responsáveis.
- Armazenar documentos/evidências e histórico completo.
- Notificar responsáveis cadastrados via WhatsApp.
- Parametrizar categorias, documentos, prazos e fluxos sem alteração estrutural do software.

### 1.2 Escopo

| Incluído | Fora de escopo (v1) |
|----------|---------------------|
| Portal web (React) com login Azure AD | App nativo mobile |
| Abertura e gestão de demandas | Integração ERP/financeiro |
| Categorias/subcategorias e fluxo Obras | Chat WhatsApp bidirecional completo |
| Notificação WhatsApp outbound | Provisionamento automático de infraestrutura Azure |
| Notificação no celular do Cessionário (navegador), com o portal aberto ou fechado depois da autorização do aparelho, e resposta no chamado | BI avançado além de relatórios básicos |
| Histórico/auditoria | |
| Parametrização administrativa de categorias, espaços e acessos (GL) | |

### 1.3 Baseline de implementação

A 1ª entrega é o monólito hexagonal já em execução (portal React e uma API .NET no catálogo `gl-demandas`, schema `app`). As jornadas dos três perfis que esse código já cobre permanecem. Os bounded contexts do §7.2 e o Service Bus continuam sendo o alvo de integração; não se reparte o monólito enquanto a feature não precisar da fila.

As specs de aceite estão em `specs/features/`, uma pasta por épico (`spec.md`, `tasks.md`, modelo, arquitetura, contrato e quickstart). O registro do que já foi demonstrado está em `specs/poc-gl-eventos/`. Objetos validados: `specs/modelo/objetos-do-sistema.md`.

O login Azure AD (RN-17) segue no escopo. Nesta baseline o portal ainda autentica com sessão de demonstração até a spec de segurança ser implementada. WhatsApp outbound (EF-04) e o gate documental de Obras (RN-09) seguem no escopo e ainda não estão no código.

---

## 2. Atores e permissões

Somente os perfis do documento funcional. **Não criar cargos adicionais.**

### 2.1 Cessionário

- Conforme as permissões de suas funções, abrir demandas da empresa; consultar espaços e demandas da empresa; anexar documentos; responder solicitações; acompanhar status; consultar histórico; receber notificações.
- Uso habitual em **celular**. As jornadas deste perfil precisam ser concluídas nessa tela.
- É sempre uma **empresa**, que pode ter vários representantes com funções e meios de contato distintos. A tela mostra o logo da empresa e, quando definido, a imagem do contato principal.
- A visão do representante resume os chamados em aberto da empresa que ele pode consultar. Indicadores de gestão não aparecem nesse perfil.

### 2.2 GL / Administrador

- Visualizar **todas** as demandas; analisar; aprovar/reprovar; solicitar documentos; acompanhar prazos; gerenciar responsáveis; cadastrar WhatsApp por categoria; consultar histórico; gerar relatórios e indicadores.

### 2.3 Responsável da Área

- Visualizar demandas da sua área; atualizar status; interagir com o solicitante; anexar documentos; registrar andamento; concluir demandas.

### 2.4 Matriz RBAC (resumo)

| Ação | Cessionário | Responsável da Área | GL / Administrador |
|------|:-----------:|:-------------------:|:------------------:|
| Abrir demanda | Conforme função | — | Sim* |
| Ver todas as demandas | — | — | Sim |
| Ver demandas da área | — | Sim | Sim |
| Ver demandas da empresa | Conforme função | — | Sim |
| Atualizar status (execução) | — | Sim | Sim |
| Aprovar/reprovar Obras | — | — | Sim |
| Parametrizar categorias/WhatsApp | — | — | Sim |
| Anexar documentos | Conforme função | Sim | Sim |

\*GL pode abrir em nome operacional apenas se explicitado em regra futura; v1 assume abertura pelo Cessionário.

Para o perfil **Cessionário**, a matriz acima define as ações disponíveis ao negócio; a autorização efetiva de cada pessoa representante é limitada às permissões concedidas às funções vinculadas à pessoa e à empresa (RN-32). Essas permissões não constituem perfis de negócio. A gestão do cadastro de espaços, empresas, representantes, funções e permissões permanece exclusiva do GL / Administrador.

---

## 3. Taxonomia de demandas

### 3.1 Categorias

1. **Comercial** — locação, solicitações comerciais, negociação/utilização de áreas.
2. **Estacionamento** — vagas, acesso, cadastro/alteração, problemas.
3. **Recepção** — mensageria, documentos, correspondências, apoio.
4. **Manutenção** — exige subcategoria:
   - Refrigeração
   - Elétrica
   - Civil
   - **Obras** (fluxo e formulário específicos)

> **Nota de alinhamento:** Obras consta no fluxo (doc seções 6–9) e deve ser subcategoria oficial de Manutenção, ainda que a taxonomia textual da seção 3 cite apenas Refrigeração/Elétrica/Civil.

### 3.2 Formulário genérico (categorias não-Obras)

Campos mínimos sugeridos: categoria, subcategoria (se houver), local/loja/unidade, descrição, anexos/fotos, data/hora (sistema).

A descrição pode ser digitada ou ditada. O ditado usa o microfone do dispositivo e transcreve a fala, em português, direto no campo, enquanto a pessoa fala. O texto ditado permanece editável. O áudio não é gravado nem enviado ao sistema.

O telefone de retorno é o do cadastro da empresa do Cessionário e não entra na abertura (RN-26). A localização é um aluguel desse cadastro. Com um único aluguel, o local já vem preenchido. Com mais de um, o local inicia em branco e o Cessionário escolhe em uma lista. O ditado não escolhe o aluguel nem informa telefone. Ao encerrar o ditado, o portal preenche os demais campos com o que a fala indicar: assunto, categoria, ponto, data desejada, período, itens e autorização de acesso. Campo não mencionado permanece em branco para o Cessionário preencher. O que foi preenchido continua editável, e a classificação segue sendo sugestão. O texto da descrição é enviado ao modelo de linguagem só para essa extração; a chave fica no servidor. Se o modelo não estiver configurado ou não responder, uma leitura local preenche o que reconhecer (data, período, itens conhecidos e autorização) e a categoria continua vindo das regras parametrizadas.

O formulário de abertura é de **coluna única**, centralizado no painel: cada campo ocupa a linha inteira, com rótulo à esquerda e controle à direita. Não há colunas paralelas de campos. Em celular, o rótulo fica acima do controle e o formulário usa a largura da tela.

### 3.3 Formulário Obras (Manutenção → Obras)

- Nome da obra; descrição; local da intervenção; datas previstas início/término; empresa executora; responsável; telefone/e-mail; observações; fotos; anexos.
- Documentos obrigatórios (campos exclusivos):
  1. **Projeto para aprovação** (versão, status, observações GL)
  2. **ART de execução** (responsável técnico, data)
  3. **Seguro de obra** (seguradora, apólice, vigência, alertas de validade)
  4. **Cronograma** (etapas: Mobilização, Execução, Instalações, Acabamento, Finalização — datas, responsável, status)

Status do Projeto: Aguardando análise → Em análise → Aprovado | Reprovado / Necessita ajustes.

---

## 4. Ciclo de vida da demanda

### 4.1 Status padronizados

```
Aberta → Recebida → Em análise → Aguardando informação/documentação
      → Aprovada → Em execução → Aguardando conclusão → Concluída → Encerrada
```

Terminais negativos: **Reprovada** | **Cancelada**.

A tela e a base desta entrega usam as situações operacionais abaixo. Elas não são renomeadas. O mapa liga cada uma ao nome do ciclo acima. Encerrada e Cancelada usam esses nomes também na gravação.

| Situação gravada | Nó do quadro (§4.5) | Nome deste ciclo |
|---|---|---|
| Novo | Solicitação | Aberta |
| Recebido | Solicitação | Recebida |
| Aguardando aprovação | Aprovação | Em análise |
| Aguardando ajuste | Aprovação | Aguardando informação/documentação |
| Liberado para execução | Atendimento | Aprovada |
| Em andamento | Atendimento | Em execução |
| Aguardando validação | Validação do cliente | Aguardando conclusão |
| Concluído | Conclusão | Concluída |
| Reprovado | Conclusão | Reprovada |
| Encerrada | Conclusão | Encerrada |
| Cancelada | Conclusão | Cancelada |

### 4.2 Fluxo principal

1. Cessionário autentica (Azure AD) e abre demanda.
2. Seleciona categoria (+ subcategoria se Manutenção).
3. Preenche formulário e envia.
4. Sistema gera protocolo/número.
5. Direciona à área responsável (parametrização).
6. GL recebe visibilidade imediata.
7. Evento em fila Azure dispara notificação WhatsApp aos responsáveis cadastrados.
8. Atendimento / análise / execução com atualização de status.
9. Conclusão e registro em histórico.

### 4.3 Fluxo Obras

1. Cessionário solicita obra e anexa Projeto + ART + Seguro + Cronograma.
2. Envia para análise.
3. GL analisa: **Aprova** | **Reprova** | **Solicita ajustes**.
4. Se aprovado: execução, acompanhamento de cronograma, conclusão, encerramento.
5. Se ajustes: motivo registrado → Cessionário corrige → reenvio → nova análise GL.

### 4.4 Transições e responsáveis

| De | Para | Quem |
|----|------|------|
| — | Aberta | Cessionário (envio) |
| Aberta | Recebida | Sistema / Responsável / GL |
| * | Em análise | Responsável / GL |
| * | Aguardando informação/documentação | Responsável / GL |
| Em análise (Obras) | Aprovada / Reprovada / Aguardando informação | GL |
| Aprovada | Em execução | Responsável / GL |
| Em execução | Aguardando conclusão / Concluída | Responsável / GL |
| Concluída | Encerrada | GL (ou regra parametrizada) |
| * | Cancelada | GL / Cessionário (se permitido por parâmetro) |

### 4.5 Cadeia do quadro

A condução no quadro segue, nesta ordem: **Solicitação → Aprovação → Atendimento → Validação do cliente → Conclusão**.

Essa ordem vale para todo chamado. O que muda é o **tipo de atendimento**: a subcategoria do chamado, como infraestrutura, refrigeração (ar-condicionado), elétrica e as demais. Cada tipo tem a própria cadeia. «Cliente» nesta validação é o **Cessionário** do chamado. O GL / Administrador configura, sem alterar código, se Aprovação, Atendimento ou Validação do cliente **daquele tipo** ocorrem automaticamente (RN-16, RN-27). A configuração de um tipo não altera a dos outros. Solicitação e Conclusão permanecem na cadeia de cada tipo. Etapa automática não espera decisão manual: o histórico registra o salto e o chamado segue para a próxima etapa manual daquele tipo. Avançar no quadro abre o que a etapa de destino daquele tipo exige preencher. O fluxo de documentos de Obras continua o da seção 4.3.

#### Execução-base de cada nó

Os cinco nós são estáveis; a expansão ocorre acrescentando tarefas configuradas a cada nó, sem criar cargos. A tabela define o comportamento-base do produto. O GL / Administrador pode acrescentar tarefas usando os campos e ações do catálogo do sistema, marcando cada uma como obrigatória ou opcional para o tipo de atendimento. A tela deve mostrar instrução, responsável, dados exigidos e evidências esperadas. A regra de aplicabilidade deve permitir condicionar a tarefa a uma situação do chamado (por exemplo, exigir foto somente para reparo executado no local). Campos e anexos já coletados na abertura podem ser reaproveitados; não devem ser pedidos novamente sem necessidade.

| Nó | Quem atua | Realização-base | O que bloqueia o avanço / saída |
|----|-----------|----------------|---------------------------------|
| Solicitação | Cessionário; Sistema | O Cessionário informa a necessidade, local e tipo, preenche o formulário específico e envia. Anexa evidências/documentos exigidos pelo tipo (em Obras: Projeto, ART, Seguro e Cronograma, conforme RN-09). O Sistema gera protocolo, registra histórico, encaminha à área e disponibiliza a demanda para GL / Administrador. | Campos e documentos definidos como obrigatórios para o tipo precisam estar válidos antes do envio. Depois do envio, informação adicional é pedida como tarefa de complemento/ajuste, sem apagar a solicitação original. |
| Aprovação | GL / Administrador; Sistema quando automática | O GL / Administrador revisa solicitação e documentos e escolhe Aprovar, Solicitar ajuste ou Reprovar. Solicitar ajuste/Reprovar exige motivo; os documentos apontados voltam ao Cessionário para correção e nova análise. Aprovação automática registra a decisão e segue sem modal humano. | Decisão manual e motivo quando aplicável; pré-requisitos documentais obrigatórios daquele tipo. Reprovação encerra o caminho positivo conforme o status Reprovada. A aprovação exclusiva de Obras é RN-10; gates para outros tipos dependem da parametrização validada (Q-11). |
| Atendimento | Responsável da Área ou GL / Administrador; Sistema quando automática | A área executa e registra andamento, comentário e previsão quando aplicável. Pode preencher campos operacionais configurados e anexar documentos/fotos como evidência do serviço. Exemplo: uma manutenção pode exigir foto do reparo concluído, mas somente se o GL / Administrador ativar essa tarefa obrigatória para aquele tipo/condição. O nó pode receber vários registros de andamento antes de seguir. | Tarefas obrigatórias do tipo/condição, como comentário técnico, campo estruturado ou evidência, devem estar completas. Uma evidência não é universalmente obrigatória; upload segue RN-18. |
| Validação do cliente | Cessionário do chamado; Sistema quando automática | O Cessionário verifica o resultado e confirma que o serviço foi realizado ou devolve ao Atendimento informando o que falta. A confirmação fica no histórico; quando devolve, a demanda retorna ao Atendimento para correção e nova validação. | A decisão do Cessionário é obrigatória quando o nó é manual. Devolução exige comentário com o que falta. Validação automática só pode ocorrer quando não exigir decisão ou dado do Cessionário. |
| Conclusão | Sistema; GL / Administrador conforme regra de encerramento | Após confirmação, o Sistema registra a conclusão e preserva decisões, campos, mensagens e anexos na trilha. A avaliação de 0 a 10 do Cessionário ocorre após o serviço concluído e é a ação separada de RN-25. | A conclusão depende das tarefas obrigatórias anteriores e, na validação manual, da confirmação do Cessionário. O encerramento formal (status Encerrada) não é presumido como sinônimo de Concluída; seu responsável permanece sujeito a Q-09. |

As tarefas configuráveis usam componentes nativos e tipados, não texto livre interpretado como ação: (a) campo de texto/número/data/hora/opção/confirmação; (b) comentário ou solicitação de informação/ajuste; (c) decisão de aprovação; (d) definição de previsão e registro de andamento; (e) upload de documento, foto ou outra evidência suportada. Para cada tarefa, a configuração define obrigatoriedade, perfil responsável, instrução, validação e, para anexo, tipos aceitos e limite. O sistema associa cada resposta/arquivo à demanda, ao nó e à tarefa no histórico. Novos componentes podem ser adicionados ao catálogo do produto conforme novos processos forem aprovados; a configuração administrativa não executa scripts nem integrações arbitrárias.

| De | Para | Quem |
|----|------|------|
| Solicitação | Aprovação | GL / Administrador |
| Solicitação | Atendimento, se a aprovação for automática | Responsável da Área / GL |
| Aprovação | Atendimento | GL / Administrador |
| Atendimento | Validação do cliente | Responsável da Área / GL |
| Validação do cliente | Conclusão | Cessionário do chamado |
| Validação do cliente | Atendimento, se o serviço não ficou pronto | Cessionário do chamado |
| Atendimento | Conclusão, se a validação for automática | Responsável da Área / GL |

---

## 5. Regras de negócio

| ID | Regra |
|----|--------|
| RN-01 | Toda demanda recebe protocolo único gerado pelo sistema no envio. |
| RN-02 | Cessionário deve selecionar categoria válida; Manutenção exige subcategoria. |
| RN-03 | Demanda é direcionada automaticamente à área responsável da categoria/subcategoria. |
| RN-04 | GL possui visibilidade de **todas** as demandas, independentemente da categoria. |
| RN-05 | Responsável da Área vê apenas demandas da(s) área(s) sob sua responsabilidade. |
| RN-06 | Cada categoria/subcategoria possui WhatsApp(s) cadastrado(s) previamente. |
| RN-07 | Na criação, o sistema identifica responsável, envia notificação WhatsApp, disponibiliza acesso e registra o envio. |
| RN-08 | GL mantém visibilidade da comunicação e andamento mesmo com atendimento pela área. |
| RN-09 | Obras exige formulário específico e documentos obrigatórios (Projeto, ART, Seguro, Cronograma) antes do envio para análise. |
| RN-10 | Aprovação/reprovação/solicitação de ajustes de Obras é exclusiva do GL. |
| RN-11 | Reprovação ou ajuste deve registrar motivo; Cessionário pode reenviar documentação. |
| RN-12 | Projeto de obra controla versão, data de envio, status e observações do GL. |
| RN-13 | Seguro de obra deve permitir alertas de validade da apólice. |
| RN-14 | Cronograma deve permitir acompanhamento e identificação de atrasos. |
| RN-15 | Toda alteração relevante gera registro de histórico (quem, quando, o quê, status anterior/novo, comentários, docs, notificações). |
| RN-16 | Categorias, subcategorias, responsáveis, WhatsApp, documentos obrigatórios, prazos, status e fluxos de aprovação devem ser parametrizáveis pelo GL. |
| RN-17 | Autenticação de usuários do portal é via Azure AD (Entra ID). |
| RN-18 | Anexos devem ser validados (tipo, tamanho) e armazenados de forma segura. |
| RN-19 | O Cessionário é sempre uma empresa e pode ter vários representantes. A identificação visual usa o logo da empresa e, quando cadastrada, a imagem do contato principal. |
| RN-20 | A visão do Cessionário resume os chamados ainda em aberto da empresa que o representante autenticado pode consultar conforme suas funções: situação, quem vai atender, previsão de atendimento, pendências e mensagens de complemento. Recorrência, prioridade agregada, ranking de cessionários e distribuição por serviço ficam com o GL / Administrador e o Responsável da Área. |
| RN-21 | Mensagem do Responsável da Área ou do GL / Administrador em chamado ainda em aberto gera notificação no celular do Cessionário. A resposta dessa notificação, e a mensagem de quem atende ou da gestão, ficam no mesmo chamado. |
| RN-22 | Chamado ainda em aberto está **em atraso** quando a previsão de atendimento já passou, ou quando não há previsão e a categoria tem meta de prazo em horas já vencida desde a abertura. Previsão ainda no futuro não marca atraso, mesmo que a meta da categoria já tenha passado. Sem previsão e sem meta, o chamado não entra em atraso. A meta vigente vale na consulta, inclusive para chamados já abertos. |
| RN-23 | **Ação agora**, na fila visível do GL / Administrador e do Responsável da Área, reúne o chamado em aberto que está em atraso, ainda não iniciado (Novo ou Recebido), com prioridade alta e sem previsão, ou aberto como reclamação. Decisão pendente (aguardando aprovação ou ajuste) entra na ação agora do GL / Administrador. |
| RN-24 | O Cessionário pode abrir o chamado como **reclamação**. A reclamação segue o mesmo ciclo, a mesma área e os mesmos três perfis; não cria cargo novo. |
| RN-25 | Serviço **concluído** pede ao Cessionário daquele chamado uma nota de 0 a 10 e um comentário opcional, uma vez. Promotor é 9 ou 10; neutro é 7 ou 8; detrator é 0 a 6. O índice é a diferença, em pontos percentuais, entre a fatia de promotores e a de detratores. GL / Administrador vê o índice da operação; Responsável da Área vê o da própria área. |
| RN-26 | O telefone de contato da abertura é o do cadastro da empresa do Cessionário e não é campo do formulário. A localização é um aluguel do cadastro do Cessionário. Com um único aluguel, o local já vem preenchido. Com mais de um, o local inicia em branco e o Cessionário escolhe em uma lista. O ditado não altera o local nem o telefone. |
| RN-27 | A cadeia do quadro contém os nós Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão, nessa ordem, e é configurada por tipo de atendimento (a subcategoria). O GL / Administrador define, para cada tipo, quais nós intermediários ocorrem automaticamente e quais tarefas e dados são exigidos em cada nó. Aprovação automática não pede decisão manual. A validação é do Cessionário daquele chamado. |
| RN-28 | Cada nó pode conter tarefas obrigatórias ou opcionais configuradas por tipo: campos estruturados e ações já disponíveis no sistema, como aprovar, solicitar ajuste/informação, registrar previsão/andamento e anexar documento ou foto. Tarefa obrigatória não concluída bloqueia o avanço; tarefa opcional não bloqueia. Cada tipo tem configuração independente. |
| RN-29 | Espaços são unidades físicas cadastradas para locação. O cadastro mantém identificação, localização, descrição e situação. A situação operacional é Disponível quando não há locação vigente, Locado quando há uma locação vigente e Inativo quando o GL / Administrador retira o espaço do inventário; espaço Inativo não pode receber nova locação. Um espaço com locação vigente não pode ser inativado até o encerramento da locação. O inventário administrativo oferece consulta em Cartões ou Grade, pesquisa e filtro por situação. |
| RN-30 | Uma empresa Cessionária pode possuir vários espaços locados, mas cada espaço pode ter no máximo uma locação vigente. Cada locação registra empresa, data de início e, ao ser encerrada, data de término; encerrar uma locação preserva seu histórico. O espaço só pode voltar a Disponível quando não houver locação vigente e estiver ativo. |
| RN-31 | Uma empresa Cessionária pode estar Ativa ou Inativa e ter vários representantes. Somente empresa Ativa pode receber nova locação e habilitar acesso de representante. Cada login Azure AD / Entra ID pode estar associado a uma única empresa Cessionária nesta entrega. O representante é associado ao login pelo identificador de identidade estável; o e-mail cadastrado serve para localizar/vincular a identidade inicialmente e não substitui a validação do token. Um representante pode manter vários contatos de e-mail, telefone e WhatsApp; para cada tipo de contato, no máximo um fica marcado como principal. O cadastro de contato, por si só, não autoriza envio nem representa consentimento para comunicação. |
| RN-32 | O GL / Administrador mantém funções por empresa e define, em cada função, permissões do catálogo de ações do Cessionário: consultar espaços e demandas da empresa; abrir demanda; responder ou complementar demanda; anexar documentos; validar serviço; avaliar atendimento. Um representante pode acumular funções e recebe a união de suas permissões. Sem concessão explícita, a ação é negada. Funções são concessões dentro do perfil Cessionário, não perfis, cargos globais ou claims de papel adicionais. |
| RN-33 | As permissões de um representante aplicam-se à empresa toda, aos espaços com locação vigente ou histórica da empresa e às demandas pertencentes a essa empresa. O backend deriva a empresa da identidade autenticada e verifica permissão e propriedade em cada leitura e comando; não confia em empresa, representante ou escopo enviados pelo portal. Cessionário não acessa dados de outra empresa. GL / Administrador mantém acesso global e Responsável da Área mantém o escopo por área das RN-04 e RN-05. |
| RN-34 | Somente GL / Administrador pode cadastrar e editar espaços, empresas, locações, representantes, contatos, funções e permissões. Representantes Cessionários não podem conceder nem ampliar o próprio acesso. A alteração de situação, início/fim de locação, contatos e concessões relevantes deve ser auditável conforme RN-15. |
| RN-35 | Cada demanda pertence a uma empresa Cessionária identificada por chave referencial, além de preservar o representante que a abriu. A migração relaciona cada usuário Cessionário existente à empresa correspondente e cada demanda ao vínculo empresarial de seu representante; o nome empresarial legado permanece apenas como snapshot de exibição. A autorização e as consultas usam a chave empresarial, nunca comparação de nome livre. |
| RN-36 | Empresa Cessionária pode ser inativada somente pelo GL / Administrador. A empresa inativa não pode receber novas locações, e seus representantes não podem autenticar ações de Cessionário; locações e demandas históricas permanecem consultáveis pelo GL / Administrador e mantêm seus vínculos. |
| RN-37 | Nome de função é único dentro da empresa. Função inativa não concede permissões, mesmo que continue associada a um representante. Inativar função não altera o histórico de ações já realizadas. |
| RN-38 | Todo campo editável tem tipo declarado. O portal aplica a máscara na digitação e recusa o envio fora do formato. A API repete a mesma regra e não grava valor inválido. |

---

## 6. Requisitos funcionais (épicos)

### EF-01 Abertura e protocolo

- RF-01.1 Login Azure AD e abertura de demanda pelo Cessionário.
- RF-01.2 Seleção de categoria/subcategoria e geração de protocolo.
- RF-01.3 Ditado por voz da descrição na abertura. O Cessionário aciona o microfone no campo "O que eu preciso:"; a fala é transcrita em tempo real (pt-BR) e acrescentada ao texto já digitado. Encerrar o microfone, ou editar o campo, interrompe o ditado. Sem suporte do navegador, sem microfone ou com permissão negada, o campo segue digitável e a tela informa a limitação. O áudio não é persistido.
- RF-01.4 Abertura em coluna única, centralizada no painel. Em tela larga, rótulo à esquerda e controle à direita, um campo por linha. Em celular, rótulo acima do controle, formulário na largura útil, sem rolagem horizontal.
- RF-01.5 Preenchimento da abertura a partir do ditado. O local vem do cadastro da empresa do Cessionário (RN-26): um único aluguel já vem preenchido; mais de um deixa o local em branco para escolha em lista. O ditado não escolhe o aluguel nem preenche telefone. Quando o Cessionário encerra o microfone e há fala transcrita, o sistema preenche assunto, ponto, data desejada, período, itens e autorização de acesso somente com dados ditos. A categoria sugerida usa o nome devolvido pelo modelo quando ele existir no catálogo parametrizado (RN-16); caso contrário, usa as regras de classificação. O Cessionário revisa e corrige antes de abrir. Sem modelo disponível, a leitura local preenche o que reconhecer e a tela informa essa origem. O áudio não é persistido.

### EF-02 Roteamento e atendimento

- RF-02.1 Direcionamento automático à área.
- RF-02.2 Atualização de status e andamento pelo Responsável da Área / GL.
- RF-02.3 O GL / Administrador encerra demanda já Concluída. A situação passa a Encerrada, distinta de Concluído. Responsável da Área e Cessionário não encerram. Demanda que não está Concluída não encerra por este comando. A avaliação 0–10 continua possível se ainda não foi dada.
- RF-02.4 O GL / Administrador cancela demanda em aberto com motivo obrigatório. A situação passa a Cancelada. Não cancela Concluído, Encerrada, Reprovado nem Cancelada. O Cessionário só cancela quando existir o parâmetro da §4.4 (Q-09); até lá a API recusa.

### EF-03 Visibilidade GL

- RF-03.1 Lista e detalhe com: protocolo, cessionário, local, data/hora, categoria, subcategoria, descrição, anexos, responsável, status, prazo, histórico, comunicação.

### EF-04 Notificações WhatsApp

- RF-04.1 Cadastro de números por categoria/subcategoria.
- RF-04.2 Envio assíncrono via fila Azure na criação (e eventos configuráveis).
- RF-04.3 Registro de sucesso/falha da notificação no histórico.

### EF-05 Obras

- RF-05.1 Formulário e uploads obrigatórios.
- RF-05.2 Workflow de aprovação GL com motivos e reenvio.
- RF-05.3 Acompanhamento de cronograma e alerta de seguro.

### EF-06 Histórico e auditoria

- RF-06.1 Trilha completa imutável (append-only) por demanda.
- RF-06.2 No detalhe da demanda, Cessionário, GL / Administrador e Responsável da Área acompanham o atendimento em um de dois modelos: o painel atual (comunicação e histórico separados) ou uma linha do tempo vertical, do registro mais recente para o mais antigo, com data à esquerda, marco na linha e cartão à direita (autor, ação, detalhe e, quando houver, mudança de status, mensagem ou documento). A troca é um checkbox «Linha do tempo». A opção fica guardada para o usuário autenticado e volta na próxima visita. O histórico em si não muda (RN-15).

### EF-07 Parametrização

- RF-07.1 CRUD administrativo (GL) de categorias, responsáveis, WhatsApp, documentos, prazos, status e regras de aprovação.
- RF-07.2 O GL / Administrador escolhe o tipo de atendimento e configura a cadeia daquele tipo (RN-27): marca Aprovação, Atendimento ou Validação do cliente como automáticos. Solicitação e Conclusão permanecem na cadeia. Responsável da Área e Cessionário não gravam essa configuração. Trocar o tipo na tela mostra a configuração daquele tipo.
- RF-07.3 Para cada nó e tipo de atendimento, o GL / Administrador compõe uma lista ordenada de tarefas usando os campos estruturados e as ações disponíveis no sistema. Cada tarefa declara rótulo/instrução, obrigatoriedade, responsável elegível, regra de aplicabilidade e validação; tarefas de dados declaram tipo (texto, número, data/hora, opção ou confirmação) e tarefas de anexo declaram tipo de arquivo/evidência. Ações disponíveis incluem decisão de aprovação, solicitação de ajuste/informação, previsão, registro de andamento e upload de documento/foto. Não há execução de código ou integração arbitrária configurável. Uma tarefa obrigatória pendente impede o avanço; uma opcional não. Nó automático não pode exigir input manual. A configuração de um tipo não altera os demais.
- RF-07.4 O GL / Administrador grava, em cada categoria, a meta de prazo em horas inteiras de 1 a 8760, ou deixa em branco (RN-16, RN-22). Em branco, chamado sem previsão não entra em atraso. A meta de uma categoria não altera as demais. Responsável da Área e Cessionário não gravam essa meta.

### EF-08 Portal em dispositivo móvel

- RF-08.1 Todo o portal — login, navegação, listas, detalhe, abertura, Obras e mensageria — é utilizável em celular, sem rolagem horizontal, a partir de 360px de largura.
- RF-08.2 O Cessionário é o perfil de uso principal em celular: abrir chamado, acompanhar as próprias solicitações, responder e anexar.

### EF-09 Portal visual e ficha do espaço

O visual de referência é o painel claro do demonstrativo [CRMi — Project Management](https://crm-admin-dashboard-template.multipurposethemes.com/project_management/vertical/main/index.html), em especial a comunicação em [Chat](https://crm-admin-dashboard-template.multipurposethemes.com/project_management/vertical/main/contact_app_chat.html): barra lateral clara, barra superior, cartões e, na conversa, lista à esquerda, thread no centro e ficha à direita. A identidade do produto continua Riocentro / GL. Assets, folhas de estilo e marcas do tema comercial não são copiados; o portal recria o padrão de layout.

Na linguagem do negócio, «cliente» desta ficha é o **Cessionário**. O local é a sala ou unidade já usada na abertura.

- RF-09.1 O shell do portal usa fundo claro, barra lateral clara, barra superior e cartões com cantos suaves. A navegação continua restrita aos três perfis do documento.
- RF-09.2 A mensageria do Cessionário segue o padrão da comunicação do painel: lista de conversas, thread e ficha lateral. Cada conversa que já gerou protocolo abre o detalhe da demanda. A ficha lateral mostra foto, local, entrega e vistoria, e cada cartão abre o detalhe correspondente.
- RF-09.3 O Cessionário autenticado tem a área **Meu espaço**, com foto de quem está logado, o local que possui, como o espaço foi entregue e as fotos da última vistoria. Cada cartão abre uma tela de detalhamento. GL / Administrador consulta a lista de espaços e a mesma ficha. Responsável da Área abre a ficha a partir do detalhe de uma demanda que já pode ver.
- RF-09.4 Cartões de solicitação, conversa e espaço são acionáveis e levam à tela de detalhe do respectivo assunto. O Cessionário não abre a ficha de outro Cessionário.

Na prova de conceito, foto, entrega e vistoria são dados de demonstração por sala. O cadastro definitivo (quem registra, versão e armazenamento) permanece em aberto com o cliente.

### EF-10 Início operacional por perfil

A primeira tela de cada perfil segue o padrão de painel de gestão de projetos do demonstrativo [CRMi — Project Management](https://crm-admin-dashboard-template.multipurposethemes.com/project_management/vertical/main/index.html): progresso, etapas, indicadores, lista do que pede atenção e atalhos. A identidade continua Riocentro / GL. Assets do tema comercial não são copiados.

Os números saem somente da fila que o perfil já pode ver (RN-04, RN-05). O tempo em aberto é informativo. A meta de prazo da categoria é a que o GL / Administrador grava em horas (RF-07.4, RN-22).

- RF-10.1 Depois do login, Cessionário, GL / Administrador e Responsável da Área caem no próprio início.
- RF-10.2 O início do GL / Administrador e do Responsável da Área mostra o progresso da fila visível no medidor de conclusão, as etapas Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão, a distribuição da fila visível pelas áreas de atuação de manutenção (Infiltração, Elétrica, Ar-condicionado, Vaga, Correspondência e Liberação de área), os itens em aberto mais antigos e atalhos para as jornadas daquele perfil.
- RF-10.3 GL / Administrador vê a operação inteira, a distribuição das obras pela etapa (Projeto, Análise, Documentação, Aprovação, Execução e Conclusão), os cessionários com maior volume de chamados, o que mais volta entre os chamados ainda em aberto e o andamento documental da obra em análise. Se houver demanda aguardando aprovação, o início destaca essa decisão.
- RF-10.4 Responsável da Área vê somente a fila da sua área e o próximo chamado em que pode registrar andamento.
- RF-10.5 O início do Cessionário é um resumo no celular: logo da empresa, imagem do contato principal quando houver, chamados em aberto da empresa que o representante pode consultar conforme suas funções, situação, quem vai atender, previsão de atendimento, pendências e mensagens de complemento. Não mostra recorrência, prioridade agregada, ranking de cessionários, distribuição por serviço nem medidores de gestão (RN-19, RN-20).
- RF-10.6 Cada chamado do resumo, aviso e atalho abre a tela do assunto. Em 360px o início continua utilizável, sem rolagem horizontal.
- RF-10.7 No início do GL / Administrador e do Responsável da Área, os cartões de indicador, as etapas, os medidores, as barras de manutenção, as barras de obras, os cessionários com maior demanda e o que mais volta são acionáveis. Passar o cursor lista os protocolos daquele recorte. Um único chamado abre o detalhe; vários abrem a fila já filtrada (Central operacional). A barra de obra abre a tela de Obras.
- RF-10.8 A previsão de atendimento é registrada pelo Responsável da Área ou pelo GL / Administrador. O Cessionário apenas a consulta. Pendência é mensagem de complemento ainda sem resposta do Cessionário, ou chamado em ajuste.

### EF-11 Notificação no celular do Cessionário

O canal de maior uso do Cessionário é o celular. A notificação usa a API de notificações do navegador no portal (não há app nativo nesta versão). No topo, à direita, ao lado do nome, o ícone de notificações lista o que ainda pede leitura. No celular, o usuário autenticado autoriza aquele aparelho por esse ícone. Com a autorização, o aviso chega com o portal aberto e também com o portal em segundo plano ou fechado. As chaves desse envio ficam no Key Vault.

- RF-11.1 Quando o Responsável da Área ou o GL / Administrador envia mensagem em chamado ainda em aberto, o Cessionário recebe notificação no celular com o texto dessa mensagem e o protocolo.
- RF-11.2 A resposta escrita a partir dessa notificação entra no mesmo chamado, junto com a mensagem de quem atende e com a mensagem da gestão da GL (RN-21).
- RF-11.3 Mensagem marcada como complemento aparece no resumo do Cessionário como pendência até ele responder.
- RF-11.4 Em 360px, o resumo, a notificação na tela e a resposta usam a largura do celular, com alvos de toque adequados e sem rolagem horizontal.
- RF-11.5 O usuário autenticado vê o ícone de notificações no topo à direita, ao lado do nome, com a quantidade ainda não lida. Ao acionar, a lista abre nesse mesmo topo e cada item abre o chamado.
- RF-11.6 No celular, o painel do ícone oferece a autorização para receber as notificações do portal neste aparelho. A inscrição fica do usuário autenticado. Sem autorização, o portal não envia o aviso com a tela fechada. O usuário pode retirar a autorização daquele aparelho.

### EF-12 Operação, quadro e avaliação do atendimento

A condução do dia do GL / Administrador e do Responsável da Área mostra o que está atrasado e o que pede movimento agora. O quadro organiza a fila visível por etapa. A visão operacional junta ação agora, reclamações, pontos de atenção e a nota dos serviços já executados.

Ponto de atenção é mais largo que a ação agora: inclui complemento ainda sem resposta do Cessionário, prioridade alta em aberto, chamado sem previsão há mais de um dia e, para o Responsável da Área, item que aguarda decisão do GL / Administrador.

- RF-12.1 No início do GL / Administrador e do Responsável da Área, a fila visível destaca o que está em atraso e lista, com o motivo, cada chamado de ação agora. Cada item abre o detalhe.
- RF-12.2 GL / Administrador e Responsável da Área acessam uma única **Central operacional**, com seletor de visão **Quadro**, **Operação** ou **Central operacional**. Quadro mostra colunas Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão, com os chamados da fila visível (RN-27). Cartão em atraso ou reclamação fica identificado. O protocolo abre o detalhe. Avançar, pelo botão ou ao soltar o cartão na próxima coluna, usa a cadeia do tipo de atendimento daquele chamado e abre um modal com o que a etapa de destino exige preencher. A etapa automática daquele tipo não retém o chamado. A validação do Cessionário acontece no chamado dele.
- RF-12.7 O GL / Administrador abre a configuração da cadeia a partir do quadro e escolhe o tipo de atendimento (RF-07.2). Com a aprovação automática naquele tipo, a solicitação segue para a próxima etapa manual e o histórico registra a aprovação automática. Os demais tipos permanecem com a cadeia que já tinham.
- RF-12.8 Cada nó apresenta, ao responsável da ação, suas tarefas configuradas para aquele tipo: dados a preencher, decisão a tomar ou ação do sistema a executar. O avanço só é confirmado depois das tarefas obrigatórias válidas. Uploads aceitos são anexados à demanda e vinculados à tarefa/nó; conclusão, decisão, valores e evidências entram no histórico com autor e data. Tarefa automática executa sem modal nem decisão humana; falha ou dependência manual impede o salto e informa o motivo.
- RF-12.3 A visão **Operação** da Central operacional reúne ação agora, em atraso, reclamações, pontos de atenção e a nota dos serviços concluídos, sempre na fila visível (RN-04, RN-05, RN-22, RN-23).
- RF-12.4 Na abertura, o Cessionário pode marcar o chamado como reclamação (RN-24). A operação lista reclamações em aberto antes das já encerradas.
- RF-12.5 Quando o serviço fica concluído, o Cessionário daquele chamado informa como foi o atendimento, de 0 a 10, com comentário opcional. A nota entra no histórico (RN-15, RN-25). Chamado ainda em aberto não aceita nota. Outro perfil não avalia. A mesma nota não é reenviada.
- RF-12.6 Em 360px, seletor de visão, quadro, operação, lista de ação agora e a pergunta ao Cessionário permanecem utilizáveis, sem rolagem horizontal da página. O quadro pode rolar na vertical, uma coluna por vez.
- RF-12.9 A visão **Central operacional** da Central operacional exibe indicadores e a fila explorável com filtros e modos de apresentação. A troca entre as três visões não altera a fila autorizada ao perfil, nem os fluxos de avanço, avaliação ou configuração da cadeia.

### EF-13 Inventário de espaços e locações

- RF-13.1 O GL / Administrador cadastra, consulta, edita e desativa espaços locáveis, mantendo identificação, endereço/localização e descrição. O inventário oferece modos Cartões e Grade, pesquisa e filtros por situação Disponível, Locado e Inativo.
- RF-13.2 O GL / Administrador inicia e encerra uma locação entre um espaço e uma empresa Cessionária, registrando datas de início e término. Espaço Inativo não aceita locação; espaço com locação vigente não aceita outra locação vigente. Encerrar ou substituir uma locação não apaga registros anteriores.
- RF-13.3 A situação Locado decorre da existência de locação vigente; sem locação vigente, espaço ativo fica Disponível. Espaço Inativo permanece Inativo independentemente de locações encerradas e não pode ser disponibilizado para nova locação. Inativação é bloqueada enquanto houver locação vigente.
- RF-13.4 A ficha do espaço exibe localização, situação, empresa da locação vigente e histórico de locações para GL / Administrador. Cessionário só consulta espaços da própria empresa conforme sua permissão; Responsável da Área consulta a ficha no contexto permitido pela demanda, sem acesso ao cadastro administrativo.

### EF-14 Representantes e permissões do Cessionário

- RF-14.1 O GL / Administrador cadastra empresas Cessionárias e associa representantes ao identificador de login Entra; o e-mail é o vínculo inicial de cadastro, e a identidade validada no token é a fonte de autorização.
- RF-14.2 O GL / Administrador cadastra contatos de e-mail, telefone e WhatsApp para cada representante. Cada representante pode ter vários contatos; somente um contato de cada tipo pode ser principal. Contato não implica consentimento ou disparo de comunicação.
- RF-14.3 O GL / Administrador configura funções por empresa a partir do catálogo de ações Cessionário e associa uma ou mais funções a cada representante. A autorização é a união das permissões das funções, restrita à empresa autenticada e aplicada no backend a cada operação.
- RF-14.4 O portal só apresenta ações concedidas, mas a API sempre repete a validação. Identidade ausente, representante inativo, permissão ausente ou tentativa de acesso a outra empresa resulta em acesso negado, sem revelar dados protegidos.
- RF-14.5 GL / Administrador pode consultar e manter todos os cadastros e permissões. Responsável da Área não altera cadastros de empresas/espaços nem permissões de representantes. A troca de representante ou de permissões não altera o perfil global de negócio do usuário.
- RF-14.6 Cada demanda nova e migrada mantém referência à empresa Cessionária proprietária. Consultas e comandos do representante verificam a empresa por essa referência; o nome empresarial exibido é dado de apresentação, não chave de autorização.
- RF-14.7 A migração do cadastro legado cria uma empresa para cada empresa Cessionária existente, associa os usuários Cessionários por seu cadastro atual e preenche a chave empresarial de cada demanda pelo representante que a abriu. Usuários sem empresa resolvida e demandas sem representante Cessionário válido não recebem associação implícita por comparação de texto e devem ser reportados para correção antes de habilitar a autorização empresarial.
- RF-14.8 GL / Administrador pode ativar ou inativar empresa e função. Empresa inativa não pode iniciar locação nem executar ações Cessionário; função inativa deixa de contribuir para as permissões efetivas do representante. A inativação não exclui locações, demandas, contatos ou trilha de auditoria.

### EF-15 Entrada tipada e máscaras

Cada campo editável declara o que aceita (RN-38). O portal bloqueia, na digitação, o que não pertence ao tipo e mostra o formato. A API recusa o mesmo valor. Pesquisa, filtro e seleção de opção não recebem máscara.

| Campo | Tipo | Máscara e limite |
| --- | --- | --- |
| Meta de prazo da categoria | Horas inteiras | Só dígitos. De 1 a 8760, ou em branco (RF-07.4). |
| E-mail de login, do Responsável da Área e de contato | E-mail | Sem espaços. Parte local, @ e domínio com ponto. De 6 a 320 caracteres. |
| Telefone e WhatsApp do representante | Telefone | `(00) 0000-0000` ou `(00) 00000-0000`, com DDD. O prefixo 55 é aceito e gravado sem ele. |
| Código do espaço | Código | Letras, números e hífen, em maiúsculas, até 40 caracteres. |
| Nomes de categoria, tipo, área, empresa, função, espaço, representante e responsável | Texto | Sem ficar só com espaços. Mínimo de 2 caracteres e máximo da coluna. |
| Logo | Endereço ou caminho | Opcional, até 300 caracteres. Se começar com http, precisa ser uma URL absoluta. |
| Descrição do espaço | Texto | Opcional, até 1000 caracteres. |
| Assunto, descrição, ponto e mensagem do chamado | Texto | Assunto até 120, ponto até 200, descrição e mensagem até 2000. Descrição obrigatória na abertura. |
| Data desejada, início e término de locação, previsão | Data ou data/hora | Controle nativo. Data desejada não fica no passado. Término da locação não fica antes do início. |
| Comentário da avaliação | Texto | Opcional, até 500 caracteres. A nota continua de 0 a 10 (RN-25). |
| Motivo e comentário de avanço | Texto | Até 2000 caracteres. Motivo continua obrigatório em ajuste e reprovação (RN-11). |
| Anexo | Arquivo | JPG, JPEG, PNG, WEBP ou PDF, até 5 MB (RN-18). |

- RF-15.1 O GL / Administrador, o Responsável da Área e o Cessionário preenchem os campos da tabela acima com o tipo correspondente. Letra na meta de prazo não entra no campo. Telefone e WhatsApp ganham a máscara enquanto se digita. E-mail sem domínio e código de espaço com caractere fora do permitido não são gravados.
- RF-15.2 A API aplica os mesmos limites e formatos em categoria, responsável, empresa, representante, contato, espaço, locação, abertura, mensagem, avaliação, motivo e anexo. O portal não é a única barreira.

---

## 7. Arquitetura alvo

### 7.1 Princípios

- **Arquitetura hexagonal (ports & adapters)** em cada microsserviço.
- **Microsserviços** com fronteiras claras e comunicação assíncrona preferencial via **Azure Service Bus / Queues**.
- **SQL Server** como banco transacional por bounded context (databases ou schemas isolados na 1ª entrega). A 1ª entrega usa o catálogo existente `gl-demandas` em `smartezy.database.windows.net`, schema `app`, tanto na API publicada quanto na API local. O processo da API não mantém registro em memória. Os testes automatizados também não usam provedor em memória: gravam num catálogo SQL Server isolado, criado e removido na execução, e não no catálogo `gl-demandas`. A credencial fica só no App Service, no Key Vault ou no user-secrets de desenvolvimento (RNF-04).
- **Segurança:** least privilege, secrets no Azure Key Vault, HTTPS, validação de entrada/anexos, RBAC alinhado aos 3 perfis.
- **Identidade:** Azure AD / Entra ID (OIDC) no portal React (MSAL) e validação de JWT nas APIs.

### 7.2 Bounded contexts (serviços)

| Serviço | Responsabilidade |
|---------|------------------|
| **Identity / Access** | Integração AD, claims → papéis (Cessionário, GL/Admin, Responsável da Área) |
| **Demandas** | Ciclo de vida, roteamento, status, histórico |
| **Obras / Documentos** | Formulário obras, versões, ART, seguro, cronograma, aprovação |
| **Notificações** | Consumo de eventos, WhatsApp, registro de envio |
| **Parametrização / Cadastros** | Categorias, responsáveis, WhatsApp, prazos, documentos obrigatórios |
| **BFF / API Gateway** | Agregação para o portal React |

### 7.3 Eventos via filas Azure (mínimo)

- `DemandaCriada`
- `DemandaStatusAlterado`
- `ObraEnviadaParaAnalise` / `ObraAprovada` / `ObraReprovada` / `ObraAjustesSolicitados`
- `NotificacaoWhatsAppSolicitada`
- `SeguroProximoVencimento` (alerta)

Padrão recomendado: **Transactional Outbox** no serviço de origem antes de publicar na fila.

### 7.4 Frontend

- SPA React; autenticação MSAL (Azure AD).
- Experiências distintas por perfil (mesmos cargos do documento).
- No detalhe da demanda, checkbox de visualização do atendimento (painel atual ou linha do tempo), com a escolha guardada por usuário (RF-06.2).
- Upload de anexos com feedback de versão/status (Obras).
- Layout responsivo em todo o portal. O Cessionário acessa principalmente por celular; GL / Administrador e Responsável da Área usam as mesmas telas em desktop e em celular.
- Formulário de abertura em coluna única, centralizado no painel (RF-01.4).
- Shell claro no padrão de painel CRM e ficha do espaço do Cessionário (RF-09.1 a RF-09.4). A ficha de demonstração vive no portal até o cliente definir o dono do cadastro de entrega e vistoria.
- Página inicial do GL / Administrador e do Responsável da Área no padrão de painel de gestão (RF-10.2 a RF-10.4, RF-10.7). A do Cessionário é o resumo do chamado (RF-10.5, RF-10.8) com logo da empresa e imagem da pessoa principal.
- Notificação no celular do Cessionário e resposta gravada no chamado em aberto (RF-11.1 a RF-11.4, RN-21).

### 7.5 Diagrama lógico

```
[React Portal] --OIDC--> [Azure AD]
       |
       v
[BFF / Gateway] --> [Demandas] --> [SQL Server]
                 --> [Obras]    --> [SQL Server]
                 --> [Param]    --> [SQL Server]
                 --> [Notificações] <-- [Azure Service Bus]
                         |
                         v
                    [WhatsApp Provider]
```

---

## 8. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | Disponibilidade alvo alinhada ao padrão corporativo Azure (definir SLA com cliente). |
| RNF-02 | Auditoria completa e consultável por demanda. |
| RNF-03 | Parametrização sem deploy de código para novos tipos de solicitação (dentro do modelo). |
| RNF-04 | Secrets e strings de conexão somente via Key Vault / Managed Identity. A chave do modelo de linguagem usa a mesma variável `OPENAI_API_KEY` do projeto Board2Brief e não entra no repositório. O modelo padrão é `gpt-4o`, que essa chave consegue chamar; `OpenAI:Model` pode trocá-lo. |
| RNF-05 | Filas com retry, DLQ e idempotência no consumidor. |
| RNF-06 | Uploads: antivírus/policy de tipo-tamanho; storage seguro (Azure Blob). |
| RNF-07 | Logs estruturados e correlação por `protocolo` / `correlationId`. |
| RNF-08 | Portal utilizável em celular (largura a partir de 360px), sem rolagem horizontal. O Cessionário é o perfil de uso móvel principal (RF-08.1, RF-08.2). |

---

## 9. Critérios de aceite (por épico)

### CA — Abertura

- Dado Cessionário autenticado no AD, quando envia demanda válida, então protocolo é gerado e status inicial é **Aberta**.
- Dado Cessionário na abertura, quando dita a descrição e encerra o microfone, então o texto transcrito fica no campo, pode ser editado e segue para a classificação e a abertura do chamado.
- Dado Cessionário com um único aluguel no cadastro da empresa, quando abre o formulário, então o local vem desse aluguel, o telefone não é pedido e assunto, ponto, data, período e itens ficam em branco.
- Dado Cessionário com mais de um aluguel no cadastro, quando abre o formulário, então o local vem em branco e a escolha é uma lista desses aluguéis.
- Dado fala que cita ponto, data, período, telefone, itens e autorização de entrada, quando o ditado é encerrado, então ponto, data, período, itens e autorização são preenchidos, o local permanece o do cadastro (ou em branco, se houver mais de um aluguel), o telefone dito não vira campo, e a categoria aparece como sugestão.
- Dado um campo que a fala não menciona, quando o preenchimento termina, então esse campo permanece como o Cessionário o deixou.
- Dado o modelo indisponível, quando o ditado é encerrado, então a leitura local preenche o que reconhecer, a categoria segue as regras e a tela informa essa origem.
- Dado texto já presente na descrição, quando o ditado começa, então a fala é acrescentada a esse texto.
- Dado navegador sem reconhecimento de fala, microfone ausente ou permissão negada, quando o Cessionário tenta ditar, então a descrição continua editável pelo teclado e o sistema informa a limitação.
- Dado Cessionário em tela larga, quando abre um chamado, então o formulário aparece em uma única coluna, centralizado no painel, com rótulo à esquerda e controle à direita.
- Dado Cessionário em celular, quando abre um chamado, então cada rótulo fica acima do seu controle, o formulário usa a largura da tela e não há rolagem horizontal.

### CA — Portal móvel

- Dado qualquer perfil autenticado, quando acessa login, início, listas, detalhe, abertura, quadro, cadeia, operação, Obras, espaços ou mensageria em viewport de 360px, então a página não rola na horizontal e nenhum bloco (filtros, quadro, cadeia, conversa) fica cortado nem exige rolagem interna para caber.
- Dado viewport de 360px e menu fechado, quando o foco percorre a página, então os links da barra lateral não recebem foco. Quando o menu abre, os links aparecem na tela, cada um com altura de toque de pelo menos 44px, e Esc ou o fundo escuro fecha o menu.
- Dado viewport de 360px, quando a fila está em Grade, então os chamados aparecem em cartões. Em Cartões ou Pulso, a lista também cabe na largura.
- Dado viewport de 1280px ou mais, quando o mesmo perfil abre o portal, então a barra lateral fica visível, o quadro permanece em colunas lado a lado, a cadeia em etapas lado a lado e a mensageria em lista, conversa e ficha.
- Dado Cessionário em celular, quando consulta as próprias solicitações ou abre um chamado, então conclui a jornada sem depender de layout de desktop.

### CA — Início operacional

- Dado um perfil autenticado, quando entra no portal, então a primeira tela é o início daquele perfil.
- Dado Cessionário autenticado, quando abre o início, então vê o logo da empresa, a imagem do contato principal quando houver, e somente os chamados em aberto da empresa que pode consultar conforme suas funções, com situação, quem vai atender, previsão, pendências e mensagens de complemento.
- Dado Cessionário autenticado, quando abre o início, então não vê recorrência, prioridade agregada, ranking de cessionários nem distribuição por serviço.
- Dado Responsável da Área ou GL / Administrador, quando define a previsão de um chamado, então o Cessionário vê essa data no resumo.
- Dado Responsável da Área, quando abre o início, então os números e a lista coincidem com as demandas da sua área.
- Dado GL / Administrador, quando há demanda aguardando aprovação, então o início destaca essa decisão e o atalho abre o detalhe.
- Dado qualquer item da lista de atenção ou um aviso, quando o usuário o aciona, então o portal abre o detalhe daquela demanda.
- Dado um cartão de indicador, uma etapa, um medidor, uma barra de manutenção, um cessionário ou uma recorrência, quando o usuário o aciona e há um único chamado, então o portal abre o detalhe; quando há vários, abre a fila filtrada daquele recorte.
- Dado GL / Administrador, quando aciona uma barra de etapa de obras, então o portal abre a tela de Obras.
- Dado viewport de 360px, quando abre o início, então a tela permanece utilizável e sem rolagem horizontal.

### CA — Notificação no celular

- Dado chamado ainda em aberto, quando o Responsável da Área ou o GL / Administrador envia uma mensagem, então ela fica no chamado e o Cessionário recebe notificação no celular com esse texto.
- Dado complemento sem resposta, quando o Cessionário abre o resumo, então a mensagem aparece como pendência.
- Dado notificação no celular, quando o Cessionário responde, então a resposta fica no mesmo chamado, junto com a mensagem de quem atende ou da gestão.
- Dado chamado já concluído ou reprovado, quando se tenta avisar o celular, então não nasce notificação nova.
- Dado viewport de 360px, quando o Cessionário lê e responde a notificação, então a tela usa a largura do celular e não há rolagem horizontal.
- Dado usuário autenticado, quando o portal abre, então o topo à direita mostra o ícone de notificações ao lado do nome, com a quantidade ainda não lida.
- Dado celular sem autorização, quando o usuário autoriza no ícone, então este aparelho fica apto a receber as notificações do portal. Quando retira a autorização, o aparelho deixa de recebê-las.
- Dado aparelho autorizado e notificação nova para esse usuário, quando o portal está em segundo plano ou fechado, então o aviso chega no celular com o texto e o protocolo.
- Dado viewport de 360px, quando o usuário abre o ícone, então o painel cabe na largura do celular.

### CA — Operação, quadro e avaliação

- Dado GL / Administrador ou Responsável da Área, quando a previsão de um chamado em aberto já passou, então o início mostra esse chamado em atraso e na ação agora.
- Dado categoria com meta de prazo e chamado em aberto dessa categoria sem previsão, quando o tempo desde a abertura já passou da meta, então o chamado aparece em atraso. Com previsão ainda no futuro, não aparece. Sem meta e sem previsão, não aparece.
- Dado Responsável da Área ou Cessionário, quando tenta gravar a meta de prazo da categoria, então o sistema recusa.
- Dado chamado Novo, Recebido, de prioridade alta sem previsão, ou aberto como reclamação, quando o perfil abre o início, então o chamado aparece na ação agora com o motivo.
- Dado demanda aguardando aprovação, quando o GL / Administrador abre a ação agora, então a decisão aparece; o Responsável da Área a vê em pontos de atenção, sem poder aprová-la.
- Dado GL / Administrador ou Responsável da Área, quando abre o Quadro, então os chamados da fila visível se distribuem em Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão, e o protocolo abre o detalhe.
- Dado um chamado com próxima ação, quando o GL / Administrador ou o Responsável da Área avança no quadro, então um modal pede o que a etapa de destino exige e, ao confirmar, a situação muda e o histórico registra a passagem.
- Dado a aprovação marcada como automática pelo GL / Administrador no tipo daquele chamado, quando a solicitação avança, então não há decisão manual e o histórico registra a aprovação automática.
- Dado dois tipos de atendimento, quando o GL / Administrador marca a aprovação automática só em um deles, então o chamado desse tipo salta a aprovação e o chamado do outro tipo continua exigindo a decisão do GL / Administrador.
- Dado a configuração da cadeia, quando o GL / Administrador troca o tipo de atendimento, então a tela mostra a cadeia daquele tipo.
- Dado um nó configurado com campo obrigatório, quando o responsável tenta avançar sem preencher um valor válido, então o avanço é bloqueado e o campo é identificado; preenchido o valor, o avanço prossegue.
- Dado um nó configurado com upload obrigatório, quando o responsável tenta avançar sem anexar a evidência/documento, então o avanço é bloqueado; anexado arquivo aceito, ele fica vinculado à tarefa e ao histórico da demanda.
- Dado um nó com tarefa opcional pendente, quando o responsável avança, então a tarefa não bloqueia a transição.
- Dado um nó automático, quando a cadeia o atravessa, então nenhuma tarefa exige input manual e o histórico registra as ações automáticas realizadas; configuração inválida é recusada.
- Dado que uma tarefa de Atendimento exige foto de comprovação para um tipo de serviço, quando o Responsável da Área registra a conclusão do reparo sem foto, então o sistema não libera a etapa seguinte; essa exigência não se aplica a tipos cuja configuração não a inclua.
- Dado uma decisão de Aprovação, quando GL / Administrador solicita ajuste ou reprova, então o motivo é obrigatório; quando aprova, a decisão e o autor ficam no histórico.
- Dado a Validação do cliente, quando o Cessionário confirma, então o chamado segue para Conclusão; quando informa que não ficou pronto, um comentário descrevendo o que falta é obrigatório e o chamado retorna a Atendimento.
- Dado chamado em validação, quando o Cessionário daquele chamado confirma o serviço, então ele vai para Conclusão; se devolve, volta ao Atendimento. Outro perfil não conclui essa validação.
- Dado Responsável da Área ou Cessionário, quando tenta gravar a cadeia, então o sistema recusa.
- Dado a Operação, quando o perfil a abre, então vê ação agora, atrasos, reclamações, pontos de atenção e o índice dos serviços avaliados, só com a fila que já pode ver.
- Dado GL / Administrador ou Responsável da Área, quando abre a Central operacional, então encontra em uma única tela o seletor Quadro, Operação e Central operacional; ao trocar a visão, os dados continuam limitados à fila autorizada ao perfil e as ações próprias daquela visão continuam disponíveis.
- Dado um endereço antigo do Quadro ou da Operação, quando o usuário o acessa, então a Central operacional abre com a visão correspondente selecionada.
- Dado Cessionário, quando marca reclamação na abertura, então o chamado nasce como reclamação e entra na lista da operação.
- Dado serviço concluído, quando o Cessionário daquele chamado envia a nota de 0 a 10, então ela fica no chamado e no histórico, e o índice da operação a considera.
- Dado chamado em aberto, outro perfil, ou nota já registrada, quando se tenta avaliar, então o sistema recusa.
- Dado viewport de 360px, quando se abre o quadro, a operação ou a pergunta de atendimento, então a página permanece utilizável e sem rolagem horizontal.

### CA — Ficha do espaço e cartões

- Dado Cessionário autenticado, quando abre Meu espaço, então vê a própria foto, o local, como o espaço foi entregue e as fotos da última vistoria.
- Dado um cartão de local, entrega, vistoria ou solicitação, quando o usuário o aciona, então o portal abre a tela de detalhamento daquele assunto.
- Dado Cessionário autenticado, quando tenta abrir a ficha de outro Cessionário, então não vê esses dados.
- Dado GL / Administrador, quando abre a lista de espaços e escolhe um cartão, então vê a ficha daquele Cessionário.
- Dado Cessionário na mensageria, quando escolhe uma conversa que já tem protocolo, então abre o detalhe da demanda; os cartões da ficha lateral abrem o detalhe do espaço.

### CA — Roteamento

- Dado categoria/subcategoria com responsável cadastrado, quando a demanda é criada, então ela aparece na fila da área e na visão GL.
- Dado demanda Concluída, quando o GL / Administrador encerra, então a situação fica Encerrada e o histórico registra a transição. Dado outro perfil, ou demanda que não está Concluída, quando tenta encerrar, então a API recusa.
- Dado demanda em aberto, quando o GL / Administrador cancela com motivo, então a situação fica Cancelada e o motivo fica no histórico. Dado sem motivo, outro perfil, ou demanda já concluída, encerrada, reprovada ou cancelada, quando se tenta cancelar, então a API recusa.

### CA — GL

- Dado qualquer demanda existente, quando GL acessa o detalhe, então visualiza todos os campos mínimos da seção 4 do documento funcional.

### CA — WhatsApp

- Dado demanda criada, quando o evento é processado, então notificação é enviada aos WhatsApps da categoria e o envio fica no histórico.

### CA — Obras

- Dado Manutenção → Obras sem todos os docs obrigatórios, quando tenta enviar para análise, então o sistema bloqueia.
- Dado docs completos, quando GL solicita ajustes, então Cessionário vê o motivo e pode reenviar; nova análise é exigida.

### CA — Histórico

- Dado qualquer mudança de status/anexo/aprovação/notificação, quando consulta o histórico, então há registro com usuário, data/hora e detalhe.
- Dado Cessionário, GL / Administrador ou Responsável da Área no detalhe de uma demanda, quando marca o checkbox Linha do tempo, então o atendimento aparece em linha do tempo vertical, do mais recente para o mais antigo, com data, autor, ação e detalhe.
- Dado o checkbox desmarcado, quando consulta o detalhe, então comunicação e histórico permanecem em painéis separados.
- Dado que o usuário marcou ou desmarcou o checkbox, quando volta ao detalhe com o mesmo usuário, então a opção escolhida permanece. A escolha de um usuário não altera a de outro.

### CA — Parametrização

- Dado GL, quando cadastra nova subcategoria e WhatsApp, então novas demandas usam essa configuração sem alteração de código.
- Dado GL / Administrador configurando um tipo, quando inclui tarefas obrigatórias ou opcionais de campo e upload em cada nó, então a tela de configuração e o avanço do chamado refletem essas tarefas somente para aquele tipo.
- Dado tarefa que tenta exigir input humano em nó automático, quando GL / Administrador salva a configuração, então o sistema recusa e identifica a tarefa incompatível.

### CA — Espaços e locações

- Dado GL / Administrador no inventário, quando alterna Cartões e Grade, então os mesmos espaços e filtros permanecem disponíveis nos dois modos, sem perda da pesquisa ou da situação selecionada.
- Dado espaço ativo sem locação vigente, quando GL / Administrador consulta o inventário, então sua situação é Disponível; dado espaço com locação vigente, então sua situação é Locado e a empresa locatária é exibida a quem tem acesso.
- Dado espaço com locação vigente, quando GL / Administrador tenta iniciar outra locação, então a API recusa sem criar registro duplicado.
- Dado código de espaço já cadastrado, quando GL / Administrador tenta cadastrar outro espaço com o mesmo código, então a API recusa sem alterar o inventário existente.
- Dado espaço Inativo ou empresa Cessionária inativa, quando GL / Administrador tenta iniciar uma locação, então a API recusa e informa a validação aplicável.
- Dado locação vigente, quando GL / Administrador a encerra com data válida, então a data final é persistida, a locação continua no histórico e o espaço ativo passa a Disponível.
- Dado locação vigente, quando GL / Administrador informa término anterior à data inicial, então a API recusa e mantém a locação vigente.
- Dado espaço com locações encerradas, quando GL / Administrador consulta o histórico, então cada empresa, início e término permanece visível e nenhuma locação é sobrescrita.
- Dado Responsável da Área, quando tenta consultar ou alterar o inventário administrativo, então recebe acesso negado; quando abre uma ficha contextual de uma demanda que já pode consultar, então só vê os dados previstos para esse contexto.

### CA — Representantes e permissões

- Dado GL / Administrador, quando cadastra uma empresa e um representante com e-mail de login válido, então a associação fica vinculada à empresa sem criar perfil global novo.
- Dado representante com mais de um contato do mesmo tipo, quando GL / Administrador marca um como principal, então apenas esse contato fica principal para aquele tipo; contatos de outros tipos continuam independentes.
- Dado representante associado a duas funções, quando consulta as ações efetivas, então recebe a união das permissões concedidas pelas funções, sem ações fora do catálogo Cessionário.
- Dado Cessionário sem permissão para abrir demanda, responder, anexar, validar ou avaliar, quando tenta a respectiva operação diretamente pela API, então recebe acesso negado e nenhum dado ou estado é alterado.
- Dado Cessionário com a permissão aplicável e identidade associada à empresa, quando executa a ação sobre uma demanda dessa empresa, então a ação segue as regras de ciclo de vida já especificadas.
- Dado representante autenticado de uma empresa, quando tenta consultar ou alterar espaços ou demandas de outra empresa por URL ou payload adulterado, então a API nega o acesso sem revelar dados do outro Cessionário.
- Dado representante inativo, sem associação válida à identidade autenticada, ou sem funções com permissão para a operação, quando chama a API, então a operação é negada independentemente da visibilidade de botões no portal.
- Dado e-mail de login já associado a outra empresa Cessionária, quando GL / Administrador tenta associá-lo novamente, então o cadastro é recusado sem criar um segundo vínculo; múltiplas empresas por login aguardam validação futura.
- Dado demanda migrada ou criada, quando o sistema determina sua empresa proprietária, então usa a chave referencial da empresa e não compara o texto do nome empresarial para conceder acesso.
- Dado dados legados com usuário Cessionário associado a uma empresa, quando a migração é executada, então a empresa referencial é criada uma única vez e ligada ao usuário e às demandas abertas por ele sem alterar histórico, autoria, protocolo ou snapshot de nome.
- Dado usuário Cessionário ou demanda legada sem empresa resolvida, quando a migração valida os registros, então não cria vínculo empresarial presumido e apresenta erro identificável, sem habilitar acesso desse registro.
- Dado GL / Administrador ou Responsável da Área, quando usa as operações já previstas, então as permissões configuráveis do Cessionário não reduzem sua visibilidade global ou por área, nem ampliam suas capacidades.
- Dado empresa Cessionária inativa, quando um representante autenticado tenta executar ação Cessionário ou iniciar locação para a empresa, então a operação é negada e os registros históricos permanecem preservados.
- Dado função inativada, quando se recalculam as permissões do representante associado, então nenhuma permissão dessa função é concedida, sem remover o histórico de ações anteriores.

### CA — Entrada tipada

- Dado GL / Administrador na meta de prazo, quando digita letras ou um número fora de 1 a 8760, então o campo fica só com dígitos e o valor inválido é recusado no portal e na API; em branco continua sem meta.
- Dado contato de telefone ou WhatsApp, quando o número é digitado, então a máscara com DDD aparece na hora; número incompleto é recusado no portal e na API.
- Dado e-mail de responsável, de representante ou de contato sem @ e domínio, quando se tenta gravar, então o cadastro é recusado.
- Dado código de espaço, quando se digita, então só permanecem letras, números e hífen, em maiúsculas.
- Dado arquivo que não é JPG, PNG, WEBP ou PDF, ou que passa de 5 MB, quando se anexa, então o envio é recusado.
- Dado descrição, mensagem, ponto, assunto, motivo ou comentário de avaliação acima do limite, quando se envia, então o sistema recusa sem gravar o excedente.

### CA — Segurança

- Dado usuário sem perfil adequado, quando tenta ação restrita (ex.: aprovar obra), então recebe 403.
- Dado acesso ao portal, quando não autenticado no AD, então é redirecionado ao login.

---

## 10. Rastreabilidade (docx → PDR)

| Seção do docx | Artefato PDR |
|---------------|--------------|
| 1 Objetivo | §1 Visão |
| 2 Fluxo principal | §4.2 |
| 3 Classificação | §3 |
| 4 Visibilidade GL | §2.2, EF-03 |
| 5 WhatsApp | RN-06/07, EF-04 |
| 6–9 Manutenção/Obras | §3.3, §4.3, EF-05 |
| 10 Status | §4.1 |
| 11 Histórico | RN-15, EF-06, RF-06.2 |
| 12 Perfis | §2 |
| 13 Organograma | §3 + §4 |
| 14 Parametrização | RN-16, EF-07 |
| Portal — coluna única e celular do Cessionário | §2.1, §3.2, RF-01.4, EF-08, RNF-08 |
| Portal — ditado e preenchimento da abertura | §3.2, RF-01.3, RF-01.5, RN-16, RNF-04 |
| Ficha do espaço do Cessionário | §2.1, EF-09, RF-09.1 a RF-09.4 |
| Inventário de espaços, locações e representantes do Cessionário | §2, EF-13, EF-14, RN-29 a RN-37 |
| Entrada tipada e máscaras | EF-15, RF-15.1, RF-15.2, RN-38, RN-18, RF-07.4 |
| Início operacional por perfil | §2, EF-10, RF-10.1 a RF-10.8, RN-04, RN-05, RN-16, RN-19, RN-20 |
| Notificação no celular do Cessionário | §2.1, EF-11, RF-11.1 a RF-11.6, RN-21 |
| Operação, quadro, reclamação e nota do atendimento | EF-12, RF-12.1 a RF-12.8, RN-14, RN-16, RN-22 a RN-28 |

---

## 11. Itens abertos (para validação com cliente)

Documentados em detalhe (Q-01 a Q-19) em `docs/Analise-Funcional-Pontos-Atencao.docx`:

- Taxonomia Obras vs Civil (fronteira e obrigatoriedade dos 4 docs).
- Ownership de transição de status, encerramento e SLA por categoria.
- Comportamento de falha/retry WhatsApp e canal in-app.
- Cancelamento pelo Cessionário; reclassificação; transferência entre áreas.
- Multi-unidade / multi-cessionário no mesmo login AD; mapeamento AD → perfis.
- Política de versão de documentos em reenvio de Obras; alerta de seguro.
- Escopo de parametrização de status/fluxos na v1; abertura de demanda pelo GL.
- Dono do cadastro de entrega do espaço e da vistoria fotográfica (interpretação atual: ficha de leitura do Cessionário, consulta do GL / Administrador e do Responsável da Área no contexto da demanda; gravação ainda não especificada).
- Se a reclamação deve ser categoria própria ou permanecer uma marca na abertura (RN-24). Nesta versão, é uma marca do chamado, no mesmo fluxo e nos mesmos três perfis.
- Se a nota de 0 a 10 e o índice promotor/detrator (RN-25) são a escala definitiva do cliente, ou se haverá outra pergunta por serviço.
- Q-19 — Validar o limite da parametrização da cadeia: tarefas compostas apenas por campos e ações disponíveis no catálogo do sistema ou criação de ações/status livres; e se alterações na configuração passam a valer apenas para novas demandas ou também para demandas em andamento.
