# EF-19 Ativos da operação

**Estado:** Não feito  
**Fase:** C  
**Atores:** GL / Administrador cadastra. Quem já pode editar a demanda de Manutenção aponta o ativo. O QR exige usuário já autenticado no Entra ID.  
**Contexto:** Parametrização guarda o ativo. Demandas guarda o apontamento. Não há serviço novo.  
**Fonte:** PDR EF-19, RN-15, RN-16, RN-17, RN-40, RNF-08

Arquitetura, modelo e contrato ficam para o arquiteto.

### RF-19.1 Cadastro do ativo
**Estado:** Não feito  
O GL / Administrador grava equipamento ligado a Manutenção, com local e categoria. Outro perfil não grava.  
**CA:** Dado GL / Administrador, quando cadastra o ativo, então a consulta devolve local e categoria. Dado outro perfil, quando tenta gravar, então a API recusa.  
**Trace:** RN-16 / RN-40 / EnterCondo RF-K04

### RF-19.2 Demanda aponta o ativo
**Estado:** Não feito  
Na demanda de Manutenção, o apontamento aparece no detalhe e no histórico.  
**CA:** Dado demanda de Manutenção que o perfil pode editar, quando aponta um ativo, então o detalhe mostra o ativo e o histórico registra. Dado em 360px e em largura de computador, então a situação e o próximo passo ficam visíveis, sem rolagem horizontal da página.  
**Trace:** RN-15 / RN-40

### RF-19.3 QR só autenticado
**Estado:** Não feito  
O QR não abre demanda para quem não tem sessão. Com sessão, mostra o ativo.  
**CA:** Dado QR sem sessão, quando o endereço abre, então não nasce demanda e o portal pede o Entra ID. Dado a mesma pessoa já autenticada, quando abre o QR, então vê o ativo.  
**Trace:** RN-17 / RN-40 / EnterCondo RF-C08 fica de fora / RF-CA03 só neste recorte
