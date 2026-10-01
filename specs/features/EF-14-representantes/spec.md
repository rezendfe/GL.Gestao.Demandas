# EF-14 Representantes e permissões do Cessionário

**Estado:** Parcial  
**Atores:** GL / Administrador cadastra empresa, representante, contato e função. As permissões não criam cargo novo.  
**Fonte:** PDR EF-14, RN-31 a RN-37

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

Catálogo de permissões: consultar empresa, abrir demanda, responder/complementar, anexar, validar serviço, avaliar atendimento. A autorização efetiva é a união das funções ativas, restrita à empresa, e a API repete a checagem.

### RF-14.1 Empresa e representante
**Estado:** Parcial  
O GL / Administrador cadastra a empresa e o representante pelo e-mail de login. Um e-mail não se liga a duas empresas.  
**CA (já vale):** Dado GL / Administrador, quando cadastra empresa e representante com e-mail ainda livre, então o usuário Cessionário fica nessa empresa. Dado e-mail já ligado a outra empresa, quando tenta associar de novo, então a API recusa.  
**CA (ainda não):** Dado login Azure AD, quando o representante entra, então a autorização usa o identificador estável do token, e o e-mail é só o vínculo inicial de cadastro. Hoje a sessão de demonstração autentica pelo e-mail e senha.  
**Trace:** RN-31 / RN-17

### RF-14.2 Contatos
**Estado:** Feito  
E-mail, telefone e WhatsApp. Vários contatos; um principal por tipo. Contato não dispara comunicação.  
**CA:** Dado dois telefones, quando o GL / Administrador marca um como principal, então só esse é principal e o e-mail principal não muda.  
**Trace:** PDR RF-14.2

### RF-14.3 Funções
**Estado:** Feito  
**CA:** Dado representante com duas funções ativas, quando a API calcula a permissão, então vale a união, sem ação fora do catálogo.  
**Trace:** RN-32

### RF-14.4 API repete a permissão
**Estado:** Feito  
O portal esconde a ação, e a API recusa identidade ausente, representante inativo, permissão ausente ou outra empresa, sem revelar o dado protegido.  
**CA:** Dado Cessionário sem permissão de anexar, quando envia arquivo pela API, então recebe acesso negado e o anexo não é gravado. Dado demanda de outra empresa, quando consulta pelo identificador, então a API nega sem devolver descrição, mensagem ou anexo.  
**Trace:** RN-32 / RN-35

### RF-14.5 Quem administra
**Estado:** Feito  
GL / Administrador mantém os cadastros. Responsável da Área não altera empresa, espaço nem permissão. Função de Cessionário não reduz a visão do GL / Administrador nem a da área.  
**CA:** Dado Responsável da Área, quando altera uma função de Cessionário, então a API recusa.  
**Trace:** PDR RF-14.5

### RF-14.6 Empresa da demanda
**Estado:** Feito  
Demanda nova guarda a empresa do representante. A checagem usa essa chave, não o texto do nome.  
**CA:** Dado duas empresas com nomes parecidos, quando o representante de uma consulta a demanda da outra, então a API nega mesmo que o nome exibido seja semelhante.  
**Trace:** RN-35

### RF-14.7 Migração
**Estado:** Feito  
A migração cria uma empresa por cessionário legado, liga o usuário e preenche a empresa da demanda pelo representante que abriu. Sem empresa resolvida, não há vínculo por comparação de texto.  
**CA:** Dado demanda legada cujo representante já tem empresa, quando a migração roda, então a demanda aponta para essa empresa e protocolo, autor e histórico permanecem. Dado usuário sem empresa resolvida, quando a migração valida, então o registro é reportado e não ganha empresa presumida.  
**Trace:** RN-36 / RN-37

### RF-14.8 Ativar e inativar
**Estado:** Feito  
Empresa inativa não inicia locação nem executa ação de Cessionário. Função inativa deixa de somar permissão. Nada é apagado: locação, demanda, contato e histórico ficam.  
**CA:** Dado empresa inativa, quando o representante tenta abrir demanda, então a API recusa e as demandas antigas continuam consultáveis conforme a regra de leitura. Dado função inativada, quando as permissões são recalculadas, então as ações dessa função não entram.  
**Trace:** PDR RF-14.8
