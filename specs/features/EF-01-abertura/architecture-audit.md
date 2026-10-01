# Auditoria de arquitetura — EF-01

Código existe no monólito.

| Camada | Onde |
|---|---|
| Domínio | `backend/src/Gl.Demandas.Domain/Protocolo.cs`, `Demanda.cs`, `LeituraSolicitacao.cs` |
| Aplicação | `AtendimentoAplicacao` |
| Infraestrutura | `ExtratorOpenAi`, `ClassificadorDemanda` |
| API | `Endpoints.cs` rotas de abertura, sugestão e preenchimento |
| Portal | `web/src/presentation/pages/AbrirPage.tsx`, `CampoDitado.tsx` |

Não há outbox nesta feature. O login de demonstração não é a arquitetura alvo (RN-17).
