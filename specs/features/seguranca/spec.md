# Segurança

**Estado:** Parcial  
**Atores:** Cessionário, GL / Administrador, Responsável da Área. Sem outros cargos no token.  
**Fonte:** PDR §9 CA — Segurança, RN-17, RNF

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

### RF-SEG.1 Ação restrita
**Estado:** Feito  
Usuário sem o perfil da ação recebe acesso negado. Aprovar, ajustar ou reprovar é só do GL / Administrador. O Responsável da Área não vê demanda de outra área. O Cessionário não vê outra empresa.  
**CA:** Dado Responsável da Área, quando tenta aprovar um chamado, então a API responde acesso negado e a situação não muda. Dado sessão ausente, quando chama uma rota de demanda, então a API não devolve a fila.  
**Trace:** PDR §9 / RN-04 / RN-05 / RN-10

### RF-SEG.2 Autenticação do portal
**Estado:** Parcial  
Quem não tem sessão é levado ao login. A API valida o token da sessão. O modo Entra já pode validar JWT quando `Auth:Mode=Entra`. O portal ainda entra com e-mail e senha de demonstração e guarda o token local da sessão.  
**CA (já vale):** Dado visitante sem sessão, quando abre uma rota interna, então o portal mostra o login. Dado token inválido, quando chama a API, então a chamada é recusada.  
**CA (ainda não):** Dado o portal, quando o usuário entra, então a autenticação é Azure AD (MSAL) e a API aceita só o JWT emitido por esse diretório (RN-17). A senha de demonstração deixa de ser o acesso do produto.  
**Trace:** RN-17 / PDR §7.1

### RF-SEG.3 Segredos
**Estado:** Feito  
A credencial SQL, a chave do modelo de preenchimento e as chaves de push não ficam no código. Anexo vai para Blob quando o ambiente está configurado; em desenvolvimento local pode usar pasta.  
**CA:** Dado o repositório, quando se procura senha de banco ou chave de API versionada, então elas não estão no código-fonte.  
**Trace:** RNF-04
