# EF-15 Entrada tipada e máscaras

**Estado:** Feito  
**Atores:** Cessionário, GL / Administrador e Responsável da Área, nos campos que cada um já pode editar.  
**Fonte:** PDR EF-15, RN-38, RN-18

**Artefatos:** [tarefas](tasks.md) · [modelo](data-model.md) · [arquitetura](architecture.md) · [contrato](contracts/api.md) · [quickstart](quickstart.md) · [pesquisa](research.md) · [auditoria](architecture-audit.md)

Ao evoluir esta feature, atualize estes arquivos na mesma pasta antes de encerrar.

Pesquisa, filtro e seleção de opção não recebem máscara. O portal bloqueia na digitação o que não pertence ao tipo. A API recusa o mesmo valor.

| Campo | Tipo | Regra já aplicada |
|---|---|---|
| Meta de prazo | Horas inteiras | Só dígitos, 1 a 8760, ou em branco |
| E-mail | E-mail | Sem espaço, com @ e domínio, 6 a 320 caracteres |
| Telefone e WhatsApp | Telefone | Máscara com DDD; prefixo 55 gravado sem ele |
| Código do espaço | Código | Letras, números e hífen, maiúsculas, até 40 |
| Nomes de cadastro | Texto | Mínimo 2, não só espaços |
| Logo | Endereço | Opcional, até 300; se http, URL absoluta |
| Descrição do espaço | Texto | Opcional, até 1000 |
| Assunto, descrição, ponto, mensagem | Texto | 120, 2000, 200 e 2000. Descrição obrigatória na abertura |
| Datas | Data | Data desejada não no passado. Término de locação não antes do início |
| Comentário da avaliação | Texto | Opcional, até 500. Nota 0 a 10 |
| Motivo e comentário de avanço | Texto | Até 2000. Motivo obrigatório em ajuste e reprovação |
| Anexo | Arquivo | JPG, JPEG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX, MP3, WAV, M4A ou OGG, até 5 MB |

### RF-15.1 Máscara no portal
**Estado:** Feito  
**CA:** Dado a meta de prazo, quando se digita letra, então o campo fica só com dígitos. Dado telefone, quando se digita o número, então a máscara com DDD aparece. Dado e-mail sem domínio, quando se tenta gravar, então o cadastro não segue.  
**Trace:** RN-38

### RF-15.2 A API repete a regra
**Estado:** Feito  
**CA:** Dado anexo que não é imagem, PDF, Word, Excel ou áudio, ou que passa de 5 MB, quando a API recebe o arquivo, então recusa e não grava. Dado descrição acima de 2000 caracteres, quando a abertura é enviada direto à API, então recusa sem gravar o excedente. Dado um anexo aceito, quando o usuário abre o arquivo no chamado, então imagem, PDF, Word, Excel e áudio são exibidos ou reproduzidos no portal.  
**Trace:** RN-18 / RN-38
