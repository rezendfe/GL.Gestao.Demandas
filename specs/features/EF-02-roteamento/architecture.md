# Arquitetura — EF-02

- Domínio: `SituacaoDemanda`, `Demanda.Redirecionar`, `RegistrarAndamento`, `Avancar`, `Decidir`, `Encerrar`, `Cancelar`. `CadeiaAtendimento` escolhe a coluna e quem avança.
- Aplicação: `AtendimentoAplicacao`.
- API: classificação, redirecionamento, andamento, avanço, aprovação, `POST /api/demandas/{id}/encerramento`, `POST /api/demandas/{id}/cancelamento`.
- Portal: `DetalhePage` (encerrar e cancelar), `QuadroPage`, `ModalAvanco`. Coluna Conclusão inclui Encerrada e Cancelada (`web/src/domain/cadeia.ts`).

Chamado Encerrada ou Cancelada deixa de estar em aberto e não dispara aviso novo de celular.
