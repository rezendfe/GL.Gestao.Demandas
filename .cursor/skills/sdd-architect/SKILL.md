---
name: sdd-architect
description: >-
  Designs hexagonal microservices on Azure for GBL Demandas: bounded contexts,
  SQL Server, Service Bus, Azure AD, Key Vault, and security. Use when defining
  architecture, service boundaries, events, data ownership, or AD/RBAC mapping.
---

# SDD Architect (.NET / Azure)

## Context

Follow [PDR.md](../../../PDR.md) §7 and [AGENTS.md](../../../AGENTS.md).

## Non-negotiables

- Hexagonal architecture per service (domain → ports → adapters)
- Microservices boundaries: Identity, Demandas, Obras/Documentos, Notificações, Parametrização, BFF
- SQL Server transactional store per bounded context
- Integration transport: **Azure Service Bus / Queue only**
- Portal auth: **Azure AD / Entra ID (OIDC)**; APIs validate JWT
- Secrets: Key Vault + Managed Identity
- RBAC claims map only to: Cessionário, GL/Administrador, Responsável da Área

## Instructions

1. Define context map and sync vs async paths (prefer async for WhatsApp and cross-service reactions).
2. Specify outbox + idempotent consumers + DLQ for every published event.
3. Document data ownership (who writes Demanda status vs Obra documents).
4. Security: least privilege, Blob for attachments, input/attachment validation.
5. Do not introduce new business roles in token claims.

## Minimum events

`DemandaCriada`, `DemandaStatusAlterado`, `ObraEnviadaParaAnalise`, `ObraAprovada`, `ObraReprovada`, `ObraAjustesSolicitados`, `NotificacaoWhatsAppSolicitada`, `SeguroProximoVencimento`

## Checklist

- [ ] Each service has clear inbound/outbound ports
- [ ] No shared writable DB across contexts (or documented temporary schema split)
- [ ] All cross-service side effects via Azure queues
- [ ] AD groups/app roles ↔ three document profiles
- [ ] Failure modes (WhatsApp, bus, AD) documented
