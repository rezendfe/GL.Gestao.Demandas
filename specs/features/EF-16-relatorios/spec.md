# EF-16 Relatórios básicos e exportação

**Estado:** Feito  
**Fase:** B  
**Atores:** Cessionário, GL / Administrador e Responsável da Área exportam a fila que cada um já pode ver.  
**Contexto:** Demandas. Não há serviço novo.  
**Fonte:** PDR EF-16, RN-04, RN-05, RN-15, RN-33, RNF-08

O contrato da exportação está em [contracts/api.md](contracts/api.md). Não há tabela nova.

A exportação não cria heatmap, painel configurável nem indicador novo. Os números da fila continuam em EF-10 e EF-12.

### RF-16.1 Planilha da fila visível
**Estado:** Feito  
O perfil exporta em CSV as demandas que já vê. GL / Administrador exporta a operação. Responsável da Área exporta a própria área. Cessionário exporta as demandas da empresa que pode consultar.  
**CA:** Dado o perfil em 360px e em largura de computador, quando aciona exportar, então a ação está visível, a página não rola na horizontal e a planilha só contém a fila autorizada. Dado demanda de outra área ou de outra empresa, então ela não entra no arquivo.  
**Trace:** RN-04 / RN-05 / RN-33 / EnterCondo RF-C09 / WBS F4.46 / F5.17

### RF-16.2 PDF do protocolo
**Estado:** Feito  
O perfil gera o PDF de uma demanda que já pode abrir. O arquivo traz protocolo, empresa, local, categoria, situação e descrição. A exportação não muda a situação. Mudança posterior da demanda continua no histórico (RN-15).  
**CA:** Dado demanda da fila visível, quando o perfil gera o PDF no celular ou no computador, então o arquivo traz esses campos e a página não rola na horizontal. Dado demanda fora da fila, quando se pede o PDF, então a API recusa.  
**Trace:** RN-04 / RN-05 / RN-15 / EnterCondo RF-O05 / RF-R01 / WBS F4.46 / F5.17
