# EF-20 Documentos da operação

**Estado:** Não feito  
**Fase:** C  
**Atores:** GL / Administrador grava, consulta, substitui e encerra. A consulta dos outros perfis está em aberto.  
**Contexto:** Parametrização. Distinto do dossiê em Obras. Não há serviço novo.  
**Fonte:** PDR EF-20, RN-13, RN-15, RN-18, RN-41, RNF-08

Arquitetura, modelo e contrato ficam para o arquiteto.

Não há senha extra nem cofre. O alerta de seguro da obra continua em EF-05.

### RF-20.1 Cadastro com validade
**Estado:** Não feito  
O GL / Administrador grava nome, arquivo e validade. O arquivo segue RN-18.  
**CA:** Dado GL / Administrador em 360px e em largura de computador, quando grava o documento, então vê nome, validade e o próximo passo, sem rolagem horizontal da página. Dado outro perfil, quando tenta gravar, então a API recusa.  
**Trace:** RN-18 / RN-41 / EnterCondo RF-DO01

### RF-20.2 Alerta de validade
**Estado:** Não feito  
Documento vencido, ou dentro do prazo de alerta gravado pelo GL / Administrador, aparece para ele. Não altera o seguro da obra.  
**CA:** Dado validade vencida, quando o GL / Administrador abre a lista, então o documento aparece em alerta. Dado apólice de obra, quando este alerta dispara, então o dossiê de Obras não muda.  
**Trace:** RN-13 / RN-41 / EnterCondo RF-DO02

### RF-20.3 Substituir ou encerrar
**Estado:** Não feito  
A troca de arquivo ou o encerramento fica no histórico.  
**CA:** Dado documento vigente, quando o GL / Administrador substitui o arquivo ou encerra, então o histórico registra e a lista mostra o estado novo. Não há campo de senha extra.  
**Trace:** RN-15 / RN-41 / EnterCondo RF-DO03 fica de fora
