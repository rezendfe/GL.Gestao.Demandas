# EF-13 Inventário de espaços e locações

**Estado:** Feito  
**Atores:** GL / Administrador cadastra. Cessionário consulta o que a função e a empresa permitem. Responsável da Área não administra o inventário.  
**Fonte:** PDR EF-13, RN-29, RN-30

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

A ficha visual de entrega e vistoria está em [EF-09](../EF-09-ficha-mensageria/spec.md). Este épico é o inventário gravado em SQL.

### RF-13.1 Cadastro do espaço
**Estado:** Feito  
Identificação, localização e descrição. Modos Cartões e Grade, pesquisa e filtro Disponível, Locado e Inativo.  
**CA:** Dado GL / Administrador, quando cadastra um espaço ativo, então ele aparece como Disponível se não houver locação vigente. Dado código fora do formato (letras, números e hífen, maiúsculas, até 40), quando grava, então a API recusa.  
**Trace:** PDR RF-13.1 / RN-38

### RF-13.2 Iniciar e encerrar locação
**Estado:** Feito  
Uma locação liga espaço e empresa, com início e término ao encerrar. Espaço Inativo não aceita locação. Espaço com locação vigente não aceita outra vigente. Encerrar não apaga o histórico.  
**CA:** Dado espaço Disponível e empresa ativa, quando o GL / Administrador inicia a locação, então o espaço fica Locado. Dado locação vigente, quando inicia outra, então a API recusa e a primeira permanece. Dado término anterior ao início, quando encerra, então a API recusa.  
**Trace:** RN-29 / RN-30

### RF-13.3 Situação derivada
**Estado:** Feito  
Locado decorre da locação vigente. Sem vigente, espaço ativo fica Disponível. Inativo permanece Inativo. Inativação é bloqueada com locação vigente.  
**CA:** Dado locação encerrada e espaço ativo, quando se consulta, então a situação é Disponível e a locação encerrada continua no histórico. Dado locação vigente, quando se tenta inativar o espaço, então a API recusa.  
**Trace:** RN-29 / RN-30

### RF-13.4 Quem consulta
**Estado:** Feito  
GL / Administrador vê localização, situação, empresa da locação vigente e histórico. Cessionário só consulta espaços da própria empresa se a função permitir. Responsável da Área não altera o inventário.  
**CA:** Dado Cessionário de outra empresa, quando consulta o espaço pela API, então recebe acesso negado sem o cadastro alheio. Dado Responsável da Área, quando tenta gravar espaço, então a API recusa.  
**Trace:** PDR RF-13.4 / RN-32
