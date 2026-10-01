# Objetos do sistema

Validação da baseline em execução contra o [PDR.md](../../PDR.md). Perfis, somente: **Cessionário**, **GL / Administrador**, **Responsável da Área**. Funções do Cessionário não são cargos novos.

Veredito: **válido** (PDR e código batem), **parcial** (existe, com campo ou regra faltando), **ausente** (só na spec).

A 1ª entrega é o monólito hexagonal (`Gl.Demandas.Domain` → Application → Infrastructure → Api) no catálogo `gl-demandas`, schema `app`. O dono da coluna «Serviço alvo» é o bounded context do PDR §7.2; hoje todos vivem na mesma API.

## Demanda e trilha

| Objeto | Veredito | Campos que o produto usa | Tabela | Classe | Serviço alvo |
|---|---|---|---|---|---|
| Demanda | Parcial | Protocolo, empresa, representante, categoria, subcategoria, área, local, ponto, descrição, situação, fluxo, natureza (Serviço/Reclamação), previsão, nota 0–10 | `app.Demanda` | `Demanda` | Demandas |
| Protocolo | Válido | `GL-AAAA-NNNNN`, único no envio | `Demanda.CD_Protocolo` | `Protocolo` | Demandas |
| Mensagem | Válido | Texto, canal, finalidade (mensagem ou complemento), autor, data | `app.Mensagem` | `Mensagem` | Demandas |
| Anexo | Parcial | Nome, tipo, tamanho, caminho. Tipos JPG, PNG, WEBP, PDF até 5 MB. Ainda não vincula tarefa da cadeia | `app.Anexo` | `Anexo` | Demandas |
| Histórico | Válido | Autor, data, situação anterior, situação nova, comentário, tipo. Append-only | `app.Historico_Demanda` | `HistoricoDemanda` | Demandas |
| Decisão de aprovação | Válido | Aprovar, Solicitar ajuste, Reprovar; motivo obrigatório em ajuste e reprovação | `app.Decisao_Aprovacao` | `DecisaoAprovacao` | Demandas |
| Avaliação | Válido | Nota 0–10 uma vez, comentário opcional, data. Só o Cessionário do chamado, só em Concluído | colunas em `Demanda` | `Demanda.Avaliar` | Demandas |

Situações gravadas: Novo, Recebido, Em andamento, Aguardando aprovação, Liberado para execução, Aguardando ajuste, Aguardando validação, Reprovado, Concluído, Encerrada, Cancelada. Encerrada e Cancelada são desfechos do GL / Administrador (RF-02.3, RF-02.4). O Cessionário ainda não cancela: o parâmetro da §4.4 segue em aberto (Q-09).

Mapa para o ciclo do §4.1, sem trocar o rótulo da tela:

| Situação em uso | Corresponde no §4.1 |
|---|---|
| Novo | Aberta |
| Recebido | Recebida |
| Aguardando aprovação | Em análise |
| Aguardando ajuste | Aguardando informação/documentação |
| Liberado para execução | Aprovada |
| Em andamento | Em execução |
| Aguardando validação | Aguardando conclusão |
| Concluído | Concluída |
| Reprovado | Reprovada |
| Encerrada | Encerrada |
| Cancelada | Cancelada |

## Catálogo e cadeia

| Objeto | Veredito | Campos | Tabela | Classe |
|---|---|---|---|---|
| Área | Válido | Nome | `app.Area` | `Area` |
| Categoria | Válido | Nome, meta de prazo em horas (1–8760 ou nulo) | `app.Categoria` | `Categoria` |
| Subcategoria (tipo de atendimento) | Válido | Nome, categoria, área, fluxo Atendimento / Aprovação / Obra | `app.Subcategoria` | `Subcategoria` |
| Regra de classificação | Válido | Termos que sugerem categoria. Não é entidade nomeada no PDR; cobre RF-01.5 | `app.Regra_Classificacao` | `RegraClassificacao` |
| Etapa da cadeia | Parcial | Cinco nós fixos, flag automática, tarefas. Faltam tipo de campo além de comentário, previsão e anexo, e regra de aplicabilidade condicional | `app.Etapa_Cadeia` | `EtapaCadeia`, `TarefaCadeia` |
| Prazo | Válido | Meta da categoria ou previsão do chamado marca atraso (RN-22) | `Categoria.NR_Prazo_Horas`, `Demanda.DT_Previsao_Atendimento` | `PrazoAtendimento` |

## Acesso

| Objeto | Veredito | Campos | Tabela | Classe |
|---|---|---|---|---|
| Usuário | Parcial | Perfil, área, empresa, e-mail, nome, foto, logo. Senha só no login demo. Identificador Entra ainda não é a chave de autorização | `app.Usuario` | `Usuario` |
| Empresa Cessionária | Parcial | Nome, logo, ativa. Sem classe de domínio; o registro vive na infraestrutura | `app.Empresa_Cessionaria` | `EmpresaCessionariaRegistro` |
| Representante | Válido | Usuário Cessionário de uma empresa, ativo | `Usuario.ID_Empresa_Cessionaria` | `Usuario` |
| Contato | Válido | E-mail, telefone ou WhatsApp; um principal por tipo. Contato não dispara mensagem | `app.Representante_Contato` | `ContatoCessionario` |
| Função | Válido | Nome único na empresa, ativa. Permissões: consultar empresa, abrir demanda, responder/complementar, anexar, validar serviço, avaliar | `app.Funcao_Cessionario`, `Funcao_Cessionario_Permissao`, `Representante_Funcao` | `FuncaoCessionario` |
| Espaço | Parcial | Código, nome, localização, descrição, Disponível / Locado / Inativo. Entrega e vistoria não são colunas: ficam na ficha de demonstração do portal | `app.Espaco` | `Espaco` |
| Locação | Válido | Empresa, início, término. No máximo uma vigente. Histórico preservado | `app.Locacao` | `Locacao` |

## Obras e aviso

| Objeto | Veredito | Campos | Tabela | Classe |
|---|---|---|---|---|
| Obra | Parcial | Nome, local, descrição, datas, empresa executora, responsável, contato, etapa do painel. Sem FK para Demanda | `app.Obra` | `Obra` |
| Documento de obra | Parcial | Nome e situação Recebido/Pendente. Não há Projeto com versão, ART, Seguro nem Cronograma | `app.Obra_Documento` | `DocumentoObra` |
| Notificação no portal | Válido | Texto, demanda, usuário, lida ou não lida | `app.Notificacao` | `Notificacao` |
| Inscrição de celular | Válido | Endpoint HTTPS, chaves do aparelho, usuário autenticado | `app.Inscricao_Push` | `InscricaoPush` |
| WhatsApp da categoria | Ausente | Números por categoria/subcategoria e envio na criação | — | — |
| Evento de integração | Ausente | Outbox e fila Azure do §7.3 | — | — |

## Leitura da abertura

`LeituraSolicitacao` não é tabela. Extrai assunto, ponto, data, período, itens e autorização do texto ditado. O local vem da locação da empresa, não da fala.
