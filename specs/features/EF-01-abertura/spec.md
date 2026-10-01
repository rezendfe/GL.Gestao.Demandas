# EF-01 Abertura e protocolo

**Estado:** Parcial  
**Atores:** Cessionário abre. GL / Administrador e Responsável da Área não abrem chamado.  
**Fonte:** PDR §6 EF-01, RN-01, RN-02, RN-16, RN-17, RN-26

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

## O que já está no produto

O Cessionário autenticado abre a demanda em coluna única, dita a descrição em português, revisa o preenchimento e recebe protocolo `GL-AAAA-NNNNN`. O local sai da locação da empresa. A categoria sugerida usa o catálogo ou as regras. O login desta entrega é e-mail e senha de demonstração, não Azure AD.

### RF-01.1 Login e abertura pelo Cessionário
**Estado:** Parcial  
O Cessionário entra no portal e envia uma demanda da própria empresa, se a função permitir abrir. Sem a permissão, a API recusa. GL / Administrador e Responsável da Área não abrem chamado.  
**CA:** Dado um Cessionário com permissão de abrir demanda e uma locação da empresa, quando envia descrição, categoria válida e local, então a demanda nasce com protocolo único e situação Novo, ou Aguardando aprovação quando o fluxo do tipo exige aprovação e ela não é automática. Dado outro perfil, quando chama a abertura, então a API recusa. Dado Cessionário sem a permissão, quando chama a abertura, então a API recusa e nada é gravado.  
**CA (ainda não):** Dado o portal, quando o Cessionário autentica, então o login é Azure AD (Entra ID) e o token é a identidade autorizada (RN-17). Hoje o portal usa e-mail e senha de demonstração.  
**Trace:** PDR EF-01 / RN-01 / RN-17 / [seguranca](../seguranca/spec.md)

### RF-01.2 Categoria, subcategoria e protocolo
**Estado:** Feito  
Manutenção exige subcategoria. O protocolo é gerado no envio e não é digitado pelo usuário.  
**CA:** Dado categoria Manutenção, quando o Cessionário envia sem subcategoria, então a API recusa. Dado envio válido, quando a demanda é gravada, então o protocolo tem a forma `GL-AAAA-NNNNN` e não repete número já usado.  
**Trace:** docx §3 / RN-01 / RN-02

### RF-01.3 Ditado da descrição
**Estado:** Feito  
No campo «O que eu preciso», o microfone transcreve em pt-BR e acrescenta ao texto. Encerrar o microfone ou editar o campo interrompe o ditado. Sem microfone, sem suporte ou com permissão negada, o campo continua digitável e a tela explica a limitação. O áudio não vai à API nem é persistido.  
**CA:** Dado navegador com fala, quando o Cessionário dita e encerra o microfone, então o texto fica no campo e segue editável. Dado navegador sem fala, quando a tela de abertura abre, então o campo aceita digitação e informa a limitação.  
**Trace:** PDR RF-01.3

### RF-01.4 Coluna única
**Estado:** Feito  
Em tela larga, rótulo à esquerda e controle à direita, um campo por linha. Em celular, rótulo acima do controle, sem rolagem horizontal.  
**CA:** Dado a abertura em 360px, quando o Cessionário percorre o formulário, então não há rolagem horizontal e cada campo ocupa a largura útil.  
**Trace:** PDR RF-01.4 / RNF-08

### RF-01.5 Preenchimento a partir do ditado
**Estado:** Feito  
Ao encerrar o microfone com fala transcrita, o sistema preenche assunto, ponto, data desejada, período, itens e autorização só com o que foi dito. O local não sai da fala: um único aluguel da empresa já vem preenchido; mais de um deixa o local em branco para a lista. O telefone não aparece na abertura. A categoria sugerida usa o nome do modelo se existir no catálogo; senão, as regras. Sem modelo, a leitura local preenche o que reconhecer e a tela informa essa origem. O Cessionário revisa antes de abrir.  
**CA:** Dado uma empresa com um único espaço locado, quando a abertura abre, então o local já vem preenchido. Dado mais de um aluguel, quando a abertura abre, então o local começa em branco. Dado fala transcrita e modelo indisponível, quando o microfone encerra, então a leitura local preenche só o que reconhecer e a origem informada é a leitura local.  
**Trace:** PDR RF-01.5 / RN-16 / RN-26
