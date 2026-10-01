# Especificações de feature

Cada épico é uma pasta. Para evoluir uma feature, trabalhe só nela e atualize os artefatos da pasta antes de encerrar.

| Arquivo | Papel |
|---|---|
| `spec.md` | RF, critério de aceite e rastreio. Inclui o que já está feito |
| `tasks.md` | Tarefas feitas e em aberto. Marque ao concluir |
| `data-model.md` | Tabelas e campos que a feature lê ou grava |
| `architecture.md` | Camadas, portas e fluxo |
| `contracts/api.md` | Rotas desta feature |
| `quickstart.md` | Como exercitar |
| `research.md` | Decisão já tomada ou pergunta ainda aberta |
| `architecture-audit.md` | Onde o código está, ou a ausência dele |

Marca na spec: **Feito**, **Parcial** ou **Não feito**.

Fonte de regra: [PDR.md](../../PDR.md). Objetos: [objetos-do-sistema.md](../modelo/objetos-do-sistema.md).

| Épico | Estado | Pasta |
|---|---|---|
| EF-01 Abertura e protocolo | Parcial | [EF-01-abertura](EF-01-abertura/spec.md) |
| EF-02 Roteamento e ciclo | Parcial | [EF-02-roteamento](EF-02-roteamento/spec.md) |
| EF-03 Visibilidade GL | Feito | [EF-03-visibilidade-gl](EF-03-visibilidade-gl/spec.md) |
| EF-04 WhatsApp | Não feito | [EF-04-whatsapp](EF-04-whatsapp/spec.md) |
| EF-05 Obras | Parcial | [EF-05-obras](EF-05-obras/spec.md) |
| EF-06 Histórico | Feito | [EF-06-historico](EF-06-historico/spec.md) |
| EF-07 Parametrização | Parcial | [EF-07-parametrizacao](EF-07-parametrizacao/spec.md) |
| EF-08 Portal móvel | Feito | [EF-08-portal-movel](EF-08-portal-movel/spec.md) |
| EF-09 Ficha e mensageria | Parcial | [EF-09-ficha-mensageria](EF-09-ficha-mensageria/spec.md) |
| EF-10 Início operacional | Feito | [EF-10-inicio](EF-10-inicio/spec.md) |
| EF-11 Notificação no celular | Feito | [EF-11-notificacao-celular](EF-11-notificacao-celular/spec.md) |
| EF-12 Operação, quadro e avaliação | Feito | [EF-12-operacao-quadro](EF-12-operacao-quadro/spec.md) |
| EF-13 Espaços e locações | Feito | [EF-13-espacos](EF-13-espacos/spec.md) |
| EF-14 Representantes e permissões | Parcial | [EF-14-representantes](EF-14-representantes/spec.md) |
| EF-15 Entrada tipada | Feito | [EF-15-entrada-tipada](EF-15-entrada-tipada/spec.md) |
| Segurança | Parcial | [seguranca](seguranca/spec.md) |
| EF-16 Relatórios básicos e exportação | Feito · fase B | [EF-16-relatorios](EF-16-relatorios/spec.md) |
| EF-17 Agenda operacional | Feito · fase B | [EF-17-agenda](EF-17-agenda/spec.md) |
| EF-18 Manutenção preventiva | Não feito · fase C | [EF-18-preventiva](EF-18-preventiva/spec.md) |
| EF-19 Ativos da operação | Não feito · fase C | [EF-19-ativos](EF-19-ativos/spec.md) |
| EF-20 Documentos da operação | Não feito · fase C | [EF-20-documentos-operacao](EF-20-documentos-operacao/spec.md) |
| EF-21 Empresas executoras | Não feito · fase C | [EF-21-empresas-executoras](EF-21-empresas-executoras/spec.md) |
| EF-22 Comunicados | Feito · fase B | [EF-22-comunicados](EF-22-comunicados/spec.md) |
| EF-23 Usabilidade do portal | Feito · fase B | [EF-23-usabilidade](EF-23-usabilidade/spec.md) |

Atores, somente: **Cessionário**, **GL / Administrador**, **Responsável da Área**.
