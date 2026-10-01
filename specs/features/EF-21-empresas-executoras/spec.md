# EF-21 Empresas executoras

**Estado:** Não feito  
**Fase:** C  
**Atores:** GL / Administrador cadastra e referencia na obra. Responsável da Área e Cessionário não gravam este cadastro. A empresa executora não entra no portal.  
**Contexto:** Obras. Substitui o texto livre já previsto no formulário. Não há serviço novo.  
**Fonte:** PDR EF-21, RN-10, RN-15, RN-42, RNF-08

Arquitetura, modelo e contrato ficam para o arquiteto.

Não é quarto perfil. Não há login nem ranking financeiro. A aprovação da obra continua exclusiva do GL / Administrador (RN-10).

### RF-21.1 Cadastro administrativo
**Estado:** Não feito  
Nome e contato. Sem usuário.  
**CA:** Dado GL / Administrador, quando grava nome e contato, então a consulta devolve o registro. Dado tentativa de autenticar essa empresa, então não há acesso. Dado outro perfil, quando tenta gravar, então a API recusa.  
**Trace:** RN-42 / EnterCondo RF-K02, sem o ranking

### RF-21.2 Referência na obra
**Estado:** Não feito  
A obra aponta a empresa cadastrada. Texto livre antigo permanece legível até a troca.  
**CA:** Dado obra em 360px e em largura de computador, quando o GL / Administrador escolhe a empresa, então o detalhe mostra o nome, a situação da obra e o próximo passo, sem rolagem horizontal da página. A troca entra no histórico (RN-15).  
**Trace:** RN-15 / RN-42 / PDR §3.3
