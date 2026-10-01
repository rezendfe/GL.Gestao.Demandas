# Auditoria de arquitetura — EF-02

| Camada | Onde |
|---|---|
| Domínio | `SituacaoDemanda.cs`, `Demanda.Encerrar`, `Demanda.Cancelar`, `CadeiaAtendimento.Coluna` |
| Aplicação | `AtendimentoAplicacao.Encerrar`, `Cancelar` |
| API | `Endpoints.cs` |
| Portal | `DetalhePage.tsx`, `cadeia.ts`, `recorte.ts` (`encerrada` inclui Encerrada e Cancelada) |

A transição não passa pela fila Azure.
