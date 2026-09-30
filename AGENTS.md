# AGENTS.md — Orquestração Spec-Driven Development

Este repositório segue **Spec-Driven Development**. Código só após especificação alinhada ao [PDR.md](PDR.md) e à fonte [Fluxo de Demandas.docx](Fluxo%20de%20Demandas.docx).

## Perfis de negócio (imutáveis)

Use **somente** os nomes do documento funcional:

1. **Cessionário**
2. **GL / Administrador**
3. **Responsável da Área**

Não inventar cargos (ex.: “supervisor”, “agente”) na especificação, no código (roles/claims) nem na UI — salvo labels de apresentação que mapeiem 1:1 para estes três.

## Fluxo SDD

```
Business Analyst → Product Spec Writer → Architect
        → Backend (.NET) + Frontend (React) → QA Validator
```

1. **BA** valida gaps e RN contra o docx / PDR.
2. **Spec Writer** atualiza PDR e specs de aceite.
3. **Architect** define bounded contexts, contratos, filas Azure, SQL Server, AD.
4. **Backend / Frontend** implementam contra a spec (hexagonal + portal MSAL).
5. **QA** valida critérios de aceite do PDR; regressão de Obras e segurança.

Mudanças de fluxo, status ou permissões **passam pelo PDR** antes do merge.

## Agentes ↔ Skills

| Agente | Skill | Quando invocar |
|--------|-------|----------------|
| Product / Spec Writer | `.cursor/skills/sdd-product-spec/SKILL.md` | Novos requisitos, aceite, traceability |
| Architect | `.cursor/skills/sdd-architect/SKILL.md` | Bounded contexts, hexagonal, Azure, AD, filas |
| Backend .NET | `.cursor/skills/sdd-backend-dotnet/SKILL.md` | APIs, ports/adapters, outbox, RBAC |
| Frontend React | `.cursor/skills/sdd-frontend-react/SKILL.md` | Portal, jornadas por perfil, MSAL |
| QA / Validator | `.cursor/skills/sdd-qa-validator/SKILL.md` | Aceite, regressão, segurança |
| Business Analyst | `.cursor/skills/sdd-business-analyst/SKILL.md` | Gaps, dúvidas de fluxo, RN |

## Convenções técnicas obrigatórias

- **Arquitetura hexagonal** (domain no centro; adapters para SQL, HTTP, Service Bus).
- **Microsserviços** .NET com fronteiras do PDR §7.2.
- **SQL Server** transacional por contexto.
- **Filas sempre Azure** (Service Bus / Queue); sem filas in-process como transporte de integração.
- **Azure AD / Entra ID** para login do portal; JWT nas APIs.
- **Key Vault** + Managed Identity para segredos.
- **RBAC** alinhado aos 3 perfis do documento.

## Artefatos de referência

| Artefato | Uso |
|----------|-----|
| `PDR.md` | Fonte da verdade de produto e aceite |
| `docs/Analise-Funcional-Pontos-Atencao.docx` | Gaps e dúvidas para workshop com cliente |
| `presentation/jornada-demandas.html` | Apresentação explorável de jornadas |
| `Fluxo de Demandas.docx` | Documento funcional original |

## Regras para agentes de código

- Antes de implementar: citar RN/RF/CA do PDR impactados.
- Não hardcodar categorias/fluxos se o PDR exige parametrização (RN-16).
- Eventos de domínio → Outbox → Azure Service Bus.
- Testes de aceite mapeados aos CA do PDR §9.
- Em dúvida de negócio: registrar no estilo do doc de análise; não assumir cargo novo.
