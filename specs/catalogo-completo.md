# Catálogo completo do GBL

O EnterCondo (`util/entercondo-requisitos.docx`, RF-A01 a RF-R03, TELA-01 a TELA-50, fluxos 5.1 a 5.4) é plataforma de exemplo. Não é fonte de regra. Cada item está coberto pelo que o GBL já especifica, entra numa fase, ou fica de fora porque contradiz os três perfis ou não é este produto.

Atores, somente: **Cessionário**, **GL / Administrador**, **Responsável da Área**.

Obras continua subcategoria de Manutenção, com aprovação exclusiva do GL / Administrador.

A WBS (`docs/WBS-Tarefas-Desenvolvimento-GBL-revisada.xlsx`) é o plano de construção da base. A aba **Módulos do Sistema** para em Identity, Demandas, Obras, Notificações, Parametrização, BFF, Portal e Azure, e cita EF-01 a EF-07. Está atrás deste catálogo. A premissa da planilha (sem ERP, sem app nativo, sem chat WhatsApp, sem BI avançado) permanece. Tarefa WBS só aparece na matriz quando existe.

Cada objeto de negócio precisa de um caminho: achar, ver o estado e concluir. Isso vale no computador e no celular, a partir de 360px (RNF-08, EF-23).

## Fases

| Fase | O que é | Épicos |
|---|---|---|
| A | Já especificado. O texto dos RF permanece. | EF-01 a EF-15 e Segurança |
| B | Fechar achar, acompanhar e concluir no celular e no computador, para os três perfis | EF-23, EF-16, EF-17, EF-22 e RF-07.5 em EF-07 |
| C | Objetos da operação que também se acham, acompanham e concluem | EF-18, EF-19, EF-20, EF-21 |
| D | Ainda serve ao ciclo, mas não nesta entrega. Há pergunta ao cliente. | PMOC ligado a ativo de Refrigeração; escalonamento pelos canais já existentes |
| Fora | Contradiz os três perfis ou não é este produto | Lista no fim deste arquivo |

## Fase A — já compõe o sistema

- EF-01 Abertura e protocolo
- EF-02 Roteamento e ciclo
- EF-03 Visibilidade GL
- EF-04 WhatsApp outbound
- EF-05 Obras
- EF-06 Histórico
- EF-07 Parametrização (cadeia, tarefas, meta de prazo; modelos de abertura entram na fase B como RF-07.5)
- EF-08 Portal móvel
- EF-09 Ficha e mensageria
- EF-10 Início operacional
- EF-11 Notificação no celular
- EF-12 Operação, quadro e avaliação
- EF-13 Espaços e locações
- EF-14 Representantes e permissões
- EF-15 Entrada tipada
- Segurança (Azure AD / Entra ID, JWT, RBAC dos três perfis)

EF-23 aplica-se a essas jornadas sem reescrever os RF delas.

## Matriz de requisitos do EnterCondo

Decisão: **coberto**, **fase B**, **fase C**, **fase D** ou **fora**.

| ID EnterCondo | Requisito no exemplo | Decisão | Épico GBL | WBS |
|---|---|---|---|---|
| RF-A01 | Login por e-mail e senha | fora | O acesso é Entra ID (Segurança, RN-17) | — |
| RF-A02 | Recuperação de senha | fora | Senha local não existe | — |
| RF-A03 | Autocadastro | fora | Sem trial nem conta local | — |
| RF-A04 | Encerrar sessão | coberto | Segurança / Entra ID | — |
| RF-M01 | Isolamento por empresa | coberto | EF-14, RN-33 | — |
| RF-M02 | Seletor de condomínio | fora | O GBL não é plataforma multi-condomínio | — |
| RF-M03 | Escopo do usuário | coberto | RN-04, RN-05, RN-33. O escopo é perfil, área e empresa | — |
| RF-C01 | Abrir e consultar chamado | coberto | EF-01, EF-02. A demanda é o único fluxo | — |
| RF-C02 | Kanban | coberto | EF-12. As colunas são as da §4, não as seis do exemplo | — |
| RF-C03 | Prazo no cartão | coberto | EF-12, RN-22. Atraso usa previsão e meta da categoria | — |
| RF-C04 | Filtros combinados | coberto | EF-12 | — |
| RF-C05 | Modelo de abertura | fase B | EF-07, RF-07.5, RN-16 | — |
| RF-C06 | Gerar ordem de serviço | fora | Não há segunda entidade. A execução é o ciclo §4 / EF-02 | — |
| RF-C07 | Fotos e conversa no chamado | coberto | EF-09, RN-18 | — |
| RF-C08 | QR para abrir chamado sem login | fora | Abertura anônima não existe. QR autenticado é EF-19 | — |
| RF-C09 | Exportar a lista | coberto | EF-16. Planilha da fila visível | F4.46, F5.17 |
| RF-O01 | Cadastro de ordem de serviço | fora | Ciclo único, EF-02 | — |
| RF-O02 | Cinco tipos de ordem de serviço | fora | A classificação é categoria parametrizada (RN-16) | — |
| RF-O03 | Oito situações de ordem de serviço | fora | As situações são as da §4 | — |
| RF-O04 | Designar técnico com acesso | fora | Não há perfil de técnico. O cadastro sem login é EF-21 | — |
| RF-O05 | PDF do registro | coberto | EF-16. PDF do protocolo, não dossiê de OS | F4.46, F5.17 |
| RF-O06 | Origem rastreável | coberto | EF-06, RN-15 | — |
| RF-OC01 | Ocorrência como entidade | fora | Reclamação é marca do chamado (RN-24) | — |
| RF-OC02 | QR público de ocorrência | fora | Sem abertura anônima | — |
| RF-OC03 | Exportar ocorrências | coberto | EF-16. Exporta a fila visível, não uma lista paralela | F4.46, F5.17 |
| RF-OC04 | Workflow próprio de ocorrência | fora | O ciclo é o da §4 | — |
| RF-D01 | Kanban de demandas | coberto | EF-12 | — |
| RF-D02 | Quinze áreas fixas | coberto | EF-07, RN-16. Área é parâmetro, não lista fixa | — |
| RF-D03 | Minhas demandas | coberto | EF-10, RN-05, RN-20 | — |
| RF-K01 | Condomínios e importação | fora | Não é cadastro de condomínios | — |
| RF-K02 | Fornecedor com ranking financeiro | fase C | EF-21. Entra nome e contato. Ranking financeiro fica de fora | — |
| RF-K03 | Técnico com usuário | fora | Não cria perfil | — |
| RF-K04 | Ativo com QR | fase C | EF-19. QR só com Entra ID já autenticado | — |
| RF-K05 | Estoque de materiais | fora | Estoque e custo não são este produto (sem ERP) | — |
| RF-P01 | Agenda de preventiva | fase C | EF-18. Abre demanda no ciclo atual, sem OS | — |
| RF-P02 | PMOC como módulo legal | fase D | Documento ligado a ativo de Refrigeração. Não nesta entrega | — |
| RF-P03 | Checklists | coberto | RN-28, RF-07.3, RF-12.8. Sem módulo paralelo | — |
| RF-P04 | Vistoria com nota de IA | fora | Laudo com nota de IA não entra | — |
| RF-DO01 | Documentos do empreendimento | fase C | EF-20. Distinto do dossiê de Obras (EF-05) | — |
| RF-DO02 | Alerta de validade | fase C | EF-20. O alerta de seguro da obra continua RN-13 / EF-05 | — |
| RF-DO03 | Área com senha extra | fora | Sem cofre e sem segunda senha | — |
| RF-F01 | Contas a pagar e a receber | fora | Financeiro | — |
| RF-F02 | Vínculo contábil da OS | fora | Sem ERP | — |
| RF-F03 | Faturas | fora | Financeiro | — |
| RF-OR01 | Solicitação de orçamento | fora | Fluxo 5.4 | — |
| RF-OR02 | Comparar propostas | fora | Fluxo 5.4 | — |
| RF-OR03 | Adjudicar proposta | fora | Fluxo 5.4 | — |
| RF-E01 | Cotação de engenharia | fora | Não é o ciclo de demandas | — |
| RF-E02 | Métrica de economia | fora | Indicador financeiro | — |
| RF-AD01 | Catorze perfis | fora | Permanecem três perfis. Funções do Cessionário: RN-32 | — |
| RF-AD02 | 131 permissões | fora | O catálogo de ações do Cessionário é o da RN-32 | — |
| RF-AD03 | Convite por e-mail para criar senha | fora | O vínculo do representante é Entra ID (EF-14) | — |
| RF-AD04 | Simular outro perfil | fora | Sem impersonação | — |
| RF-AD05 | Auditoria | coberto | EF-06, RN-15 | — |
| RF-AD06 | Cofre de senhas | fora | Sem cofre | — |
| RF-CA01 | Visita e ronda | fora | Ronda não é demanda | — |
| RF-CA02 | Check-in por GPS | fora | Sem geolocalização de presença | — |
| RF-CA03 | Ler QR em campo | fase C | EF-19. Só ativo, e só usuário já autenticado. Ronda não entra | — |
| RF-IA01 | Copiloto de risco | fora | Sem score de IA | — |
| RF-IA02 | Vistoria com score de IA | fora | Sem nota de IA | — |
| RF-R01 | Vários relatórios PDF e Excel | coberto | EF-16. Só a fila visível em planilha e o PDF do protocolo | F4.46, F5.17 |
| RF-R02 | Heatmap | fora | Sem mapa de calor | — |
| RF-R03 | Indicadores da fila | coberto | EF-10, EF-12. Sem dashboard configurável | F4.46, F5.17 |

F4.46 é a API de indicadores básicos, com exportação simples e sem BI. F5.17 é a tela desses indicadores e da exportação. O heatmap e o BI configurável não entram nessas tarefas.

## Telas do exemplo

| Tela | No exemplo | Decisão | Épico GBL |
|---|---|---|---|
| TELA-01 | Login e-mail/senha | fora | Segurança usa Entra ID |
| TELA-02 | Primeira tela depois do login | coberto | EF-10 |
| TELA-03 | Escolher condomínio | fora | Não é multi-condomínio |
| TELA-04 | Painel com GPS | coberto | EF-10 e EF-12, sem check-in GPS |
| TELA-05 | Kanban de chamados | coberto | EF-12 |
| TELA-06 | Abrir chamado | coberto | EF-01. O modelo sugerido é RF-07.5 |
| TELA-07 | Detalhe do chamado | coberto | EF-03, EF-06, EF-09 |
| TELA-08 | Lista de ordens de serviço | fora | Sem OS |
| TELA-09 | Nova ordem de serviço | fora | Sem OS |
| TELA-10 | Detalhe da ordem de serviço | fora | O detalhe é o da demanda |
| TELA-11 | Lista de ocorrências | fora | Reclamação em RN-24 |
| TELA-12 | Nova ocorrência | fora | A marca nasce na abertura (RF-12.4) |
| TELA-13 | Kanban de demandas | coberto | EF-12 |
| TELA-14 | Calendário | coberto | EF-17. Usa datas que a demanda e a obra já têm |
| TELA-15 | Meu dia | coberto | EF-10 e EF-12. Diário pessoal, meta semanal e placar não entram |
| TELA-16 | Copiloto | fora | Sem score de risco |
| TELA-17 | Operação ao vivo | coberto | EF-12, sem GPS |
| TELA-18 | Condomínios | fora | — |
| TELA-19 | Novo condomínio | fora | — |
| TELA-20 | Fornecedores | fase C | EF-21, sem ranking |
| TELA-21 | Novo fornecedor | fase C | EF-21 |
| TELA-22 | Técnicos com acesso | fora | — |
| TELA-23 | Ativos | fase C | EF-19 |
| TELA-24 | Materiais | fora | — |
| TELA-25 | Cargos | fora | Não cria cargo |
| TELA-26 | Grupos de usuários | fora | Funções do Cessionário continuam EF-14 |
| TELA-27 | Preventivas | fase C | EF-18 |
| TELA-28 | PMOC | fase D | Não nesta entrega |
| TELA-29 | Checklists | coberto | RF-07.3, RF-12.8 |
| TELA-30 | Vistorias formais | fora | A ficha fotográfica do espaço permanece pergunta do EF-09 |
| TELA-31 | Etiquetas QR | fase C | EF-19, só para usuário autenticado |
| TELA-32 | Documentos prediais | fase C | EF-20 |
| TELA-33 | Documentos com senha extra | fora | — |
| TELA-34 | Orçamentos | fora | — |
| TELA-35 | Engenharia | fora | — |
| TELA-36 | Cotações | fora | — |
| TELA-37 | Financeiro | fora | — |
| TELA-38 | Relatórios | fase B | EF-16, sem heatmap |
| TELA-39 | Usuários | coberto | EF-14. Sem convite para criar senha |
| TELA-40 | 13 perfis e 131 permissões | fora | Três perfis; RN-32 |
| TELA-41 | Meu perfil | coberto | EF-14 e EF-11. Troca de senha local não se aplica |
| TELA-42 | Auditoria | coberto | EF-06 |
| TELA-43 | Cofre | fora | — |
| TELA-44 | Notificação formal com contestação | fora | O aviso de chamado no celular é EF-11. Contestação não é este fluxo |
| TELA-45 | Comunicados | coberto | EF-22 |
| TELA-46 | Compras | fora | — |
| TELA-47 | Carteira com senha extra | fora | — |
| TELA-48 | Visita com GPS | fora | — |
| TELA-49 | Planos e assinatura | fora | — |
| TELA-50 | Manual do fornecedor | fora | Não é objeto de demanda |

## Fluxos 5.1 a 5.4

| Fluxo no exemplo | No GBL |
|---|---|
| 5.1 Chamado, ordem de serviço e conclusão | A demanda abre, segue o ciclo §4 e conclui. Gerar OS fica de fora. |
| 5.2 Preventiva que gera OS | Fase C, EF-18. O sistema abre demanda no ciclo atual. A área executa. Não nasce OS. Quem abre permanece pergunta. |
| 5.3 PMOC anual com responsável técnico e doze tarefas | Fase D. Não nesta entrega. Sem cargo novo. |
| 5.4 Orçamento, proposta e adjudicação | Fora. Financeiro. |

## Fase D — não nesta entrega

- **PMOC.** Documento ou plano ligado a ativo da subcategoria Refrigeração, para achar, acompanhar validade e concluir o registro. Não é perfil novo nem produto jurídico próprio. Só segue se o cliente confirmar que a Lei 13.589 entra no fluxo de demandas. Refrigeração já existe como subcategoria parametrizável.
- **Escalonamento.** Demanda em atraso e sem responsável dispara aviso no WhatsApp já cadastrado na categoria (EF-04) e na notificação já especificada no portal (EF-11). Mora em Parametrização e Notificações. Não nesta entrega. A regra de prazo continua RN-22.

## Fora, com o motivo

- Financeiro, orçamentos, cotações, propostas, compras, estoque e vínculo contábil. O produto não é ERP.
- Login por e-mail e senha, autocadastro, recuperação de senha, trial, planos e assinatura. O acesso é Entra ID.
- QR anônimo, check-in GPS, ronda, PWA offline e app nativo.
- Cofre de senhas, área com senha extra e simulação de outro perfil.
- Treze perfis, 131 permissões, copiloto de risco, heatmap e vistoria com nota de IA.
- Ordem de serviço e ocorrência como entidades. O único fluxo é o ciclo da demanda. Reclamação continua marca (RN-24).
- Chat e WhatsApp bidirecional. O WhatsApp do GBL é saída (EF-04).
