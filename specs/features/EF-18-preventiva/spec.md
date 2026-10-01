# EF-18 Manutenção preventiva

**Estado:** Não feito  
**Fase:** C  
**Atores:** GL / Administrador grava a recorrência. O sistema abre a demanda. Responsável da Área executa na área da categoria. Cessionário não grava a agenda.  
**Contexto:** Parametrização guarda a recorrência. Demandas abre a demanda no ciclo atual. Não há serviço novo.  
**Fonte:** PDR EF-18, RN-01, RN-03, RN-16, RN-35, RN-39, RNF-08

Arquitetura, modelo e contrato ficam para o arquiteto.

Não há ordem de serviço, situação nova nem perfil novo. Obras continua subcategoria de Manutenção.

### RF-18.1 Recorrência por categoria
**Estado:** Não feito  
O GL / Administrador escolhe uma categoria parametrizada e a periodicidade. Outro perfil não grava.  
**CA:** Dado GL / Administrador, quando grava a recorrência, então a consulta devolve categoria e periodicidade. Dado Responsável da Área ou Cessionário, quando tenta gravar, então a API recusa.  
**Trace:** RN-16 / RN-39 / EnterCondo RF-P01

### RF-18.2 Demanda no ciclo atual
**Estado:** Não feito  
No vencimento, o sistema abre demanda com protocolo, na área da categoria, no ciclo da §4. A área acompanha e conclui por esse ciclo. A empresa da demanda não é presumida (RN-35).  
**CA:** Dado o vencimento, quando a demanda nasce, então ela segue a §4 e não nasce ordem de serviço. Dado a área em 360px e em largura de computador, quando abre essa demanda, então vê a situação e o próximo passo, sem rolagem horizontal da página. Mudança de situação entra no histórico (RN-15).  
**Trace:** RN-01 / RN-03 / RN-15 / RN-39 / fluxo 5.2 do exemplo, sem OS
