# Baseline GL Eventos / Riocentro

Registro do que já está em execução no portal e na API. As specs de aceite do produto estão em [specs/features](../features/README.md). Perfis, somente: **Cessionário**, **GL / Administrador**, **Responsável da Área**.

## Histórias

1. Cessionário descreve a ocorrência, confirma a classificação sugerida e recebe protocolo `GL-2026-00128`. A demanda entra na fila do GL como Novo.
2. GL confirma ou altera a classificação e redireciona. O Responsável da Área da manutenção registra o andamento. O histórico guarda autor, data, situação anterior e nova. O cessionário vê a notificação não lida. Outro cessionário recebe 403.
3. GL aprova `GL-2026-00131`. Cessionário e Responsável da Área recebem 403.
4. Obras mostra a etapa Análise e o checklist: Projeto Executivo recebido; ART, Seguro da Obra e Cronograma pendentes.
5. Na abertura, o Cessionário dita a descrição pelo microfone. A fala entra no campo em português, enquanto fala, e o texto segue editável. Sem microfone ou sem suporte do navegador, o campo continua digitável e a tela explica a limitação. O áudio não é enviado à API. Ao encerrar o microfone, os outros campos da abertura são preenchidos com o que a fala indicar. A chave é a `OPENAI_API_KEY` do Board2Brief, no servidor. O modelo padrão é `gpt-4o`, porque essa chave não libera `gpt-4.1-mini`. Se ele não responder, a leitura local preenche data, período, itens conhecidos e autorização, e a categoria continua nas regras. O telefone é o do cadastro da empresa e não aparece na abertura. O local é um aluguel desse cadastro: um único já vem preenchido; mais de um começa em branco e o Cessionário escolhe na lista.
6. O portal usa o padrão visual de painel claro (barra lateral, barra superior e cartões), no espírito do demonstrativo CRMi, sem copiar assets do tema. A mensageria segue o exemplo de comunicação: lista, thread e ficha lateral. O Cessionário abre Meu espaço e vê a própria foto, a sala, como o espaço foi entregue e as fotos da última vistoria. Cada cartão abre o detalhe. Outro cessionário não vê essa ficha. GL / Administrador abre a mesma ficha pela lista de espaços. Foto, entrega e vistoria são demonstração por sala.
7. GL / Administrador e Responsável da Área veem, no início, o que está em atraso e a ação agora. O menu abre o Quadro (Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão) e a Operação (ação agora, atraso, reclamações, pontos de atenção e nota dos serviços). Avançar o cartão abre o modal do que a próxima etapa exige. Cada informação da etapa pode ser obrigatória ou opcional; só a obrigatória bloqueia o avanço. Etapa automática não exige tarefa obrigatória. O GL / Administrador configura essa cadeia por tipo de atendimento (infraestrutura, refrigeração e os demais) e pode deixar a aprovação automática só naquele tipo. A validação é do Cessionário do chamado. O Cessionário marca reclamação na abertura e, no serviço concluído, dá uma nota de 0 a 10. Atraso é previsão vencida. Sem previsão, a meta de prazo em horas da categoria, gravada pelo GL / Administrador, também marca atraso quando o tempo desde a abertura já passou; previsão ainda no futuro não marca. Sem meta e sem previsão, o chamado não entra em atraso.

## Situações em uso

Novo, Recebido, Em andamento, Aguardando aprovação, Liberado para execução, Aguardando ajuste, Aguardando validação, Reprovado, Concluído, Encerrada, Cancelada.

Novo corresponde à abertura, Recebido ao direcionamento, Em andamento ao atendimento e Liberado para execução à aprovação. O mapa completo está no PDR §4.1. Encerrada e Cancelada são desfechos do GL / Administrador (RF-02.3, RF-02.4).

## Persistência

### RF-POC.1 Catálogo Azure SQL
A API em execução grava e lê o catálogo `gl-demandas` em `smartezy.database.windows.net`, schema `app`. O processo da API não mantém cadastro em memória. Os testes automatizados também não usam provedor em memória: cada execução abre um catálogo SQL Server isolado, criado e apagado ao fim, e não grava em `gl-demandas`.
**CA:** Dado a API com `ConnectionStrings:Sql` desse catálogo, quando o GL / Administrador salva um cadastro e a API reinicia, então o cadastro continua disponível na consulta seguinte. Dado a suíte de testes, quando ela executa, então lê e grava só no catálogo isolado indicado por `GL_TEST_SQL` (ou no LocalDB, se a variável não existir).
**Trace:** PDR §7.1 / RNF-04

### RF-POC.3 Prints do Playwright
As imagens geradas pelo Playwright ficam em `web/playwright`.
**CA:** Dado o portal em execução, quando a suíte `web/e2e` tira um print, então o arquivo é gravado em `web/playwright`.
**Trace:** PDR §9

### RF-POC.2 Meta de prazo da categoria
O GL / Administrador informa, em Cadastros, a meta de prazo da categoria em horas inteiras de 1 a 8760, ou deixa em branco. A fila visível usa essa meta na consulta (RN-22, RF-07.4).
**CA:** Dado a categoria Manutenção com meta de 2 horas, quando um chamado em aberto dessa categoria não tem previsão e foi aberto há mais de 2 horas, então GL / Administrador e o Responsável da Área da fila o veem em atraso. Dado previsão ainda no futuro, então não entra em atraso. Dado Responsável da Área, quando grava a meta, então a API recusa.
**Trace:** PDR RN-22 / RF-07.4 / RN-16

## Fora desta POC

WhatsApp real, o parametrizador além da meta de prazo da categoria, seis microsserviços, Service Bus e o bloqueio da RN-09 (todos os documentos de obra antes do envio). A mensageria da tela é simulada. A classificação lê termos da tabela `app.Regra_Classificacao`. O modelo de linguagem entra só no preenchimento da abertura (RF-01.5). O quadro e a operação leem a fila já visível ao perfil. O cartão avança só para a próxima etapa manual da cadeia do tipo de atendimento daquele chamado, configurada pelo GL / Administrador.

## RBAC

| Ação | Cessionário | Responsável da Área | GL / Administrador |
|---|---|---|---|
| Abrir chamado | Sim | Não | Não |
| Ver próprias demandas | Sim | Não | Sim, vê todas |
| Ver demandas da área | Não | Sim | Sim |
| Classificar e redirecionar | Não | Não | Sim |
| Registrar andamento | Não | Sim, na própria área | Sim |
| Aprovar | Não | Não | Sim |
| Configurar a cadeia do quadro | Não | Não | Sim |
| Validar o atendimento do próprio chamado | Sim | Não | Não |
| Avaliar serviço concluído | Sim, o próprio chamado, uma vez | Não | Não |
| Ver quadro e operação | Não | Sim, a própria área | Sim, a operação inteira |
| Ver obras | Sim | Sim | Sim |
| Ver a própria ficha de espaço | Sim | Não | Não |
| Ver ficha de qualquer espaço | Não | Sim, a partir da demanda | Sim, pela lista |
