# EF-23 Usabilidade do portal

**Estado:** Feito  
**Fase:** B  
**Atores:** Cessionário, GL / Administrador e Responsável da Área.  
**Contexto:** o portal das jornadas já existentes. Não há serviço novo.  
**Fonte:** PDR EF-23, RNF-08, RN-04, RN-05, RN-15, RN-33

Ativo, documento da operação e preventiva ainda não existem. Quando existirem, a mesma faixa de situação e próximo passo vale para eles.

### RF-23.1 Estado e próximo passo
**Estado:** Feito  
Demanda, obra, espaço, comunicado e arquivo exportado mostram a situação e uma ação principal para acompanhar ou concluir.  
**CA:** Dado qualquer um dos três perfis em 360px e em largura de computador, quando abre um desses objetos que já pode ver, então vê o estado, a ação principal e o próximo passo, sem rolagem horizontal da página. Se a ação muda o objeto, o histórico registra (RN-15).  
**Trace:** RNF-08 / RN-15 / PDR EF-23

### RF-23.2 Vazio, carregando e erro
**Estado:** Feito  
A tela diz o que aconteceu e oferece tentar de novo, limpar o filtro ou voltar.  
**CA:** Dado lista vazia, espera ou falha, quando a tela aparece, então há uma ação clara. A página não rola na horizontal.  
**Trace:** RNF-08 / RF-23.2

### RF-23.3 Celular e computador
**Estado:** Feito  
A jornada do GL / Administrador e a do Responsável da Área cabem no celular como a do Cessionário. Alvo de toque não fica miúdo.  
**CA:** Dado GL / Administrador ou Responsável da Área em 360px, quando acompanha uma demanda da própria fila até o próximo passo, então conclui sem rolagem horizontal da página. A mesma jornada abre em largura de computador.  
**Trace:** RNF-08 / RF-08.1

### RF-23.4 Busca na fila autorizada
**Estado:** Feito  
A busca encontra protocolo, empresa e espaço. O resultado não sai da fila do perfil. Serviço, responsável, situação e prioridade continuam nos filtros ao lado, não no texto da busca.  
**CA:** Dado protocolo, nome de empresa ou espaço que está na fila visível, quando o perfil busca, então o item aparece. Dado o mesmo texto numa demanda de outra área ou de outra empresa, então não aparece.  
**Trace:** RN-04 / RN-05 / RN-33 / RNF-08
