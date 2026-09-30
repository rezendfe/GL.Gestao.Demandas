---
name: sdd-backend-dotnet
description: >-
  Implements .NET hexagonal microservices for GBL Demandas: APIs, domain rules,
  SQL Server, Azure Service Bus outbox, and RBAC. Use when coding backend
  services, domain events, persistence, or integrating Azure AD JWT validation.
---

# SDD Backend .NET

## Context

Implement against [PDR.md](../../../PDR.md). Architecture from Architect skill / PDR §7.

## Structure (per service)

```
Domain/          # entities, RN, domain events
Application/     # use cases, ports
Adapters.In/     # HTTP, consumers
Adapters.Out/    # SQL Server, Service Bus, Blob, WhatsApp gateway
```

## Instructions

1. Encode RN-01…RN-18 in domain/application; reject invalid transitions.
2. Obras approval/rejection/adjustments: **GL only** (403 otherwise).
3. Responsável da Área: filter queries by area; GL: no area filter.
4. Persist history append-only on status, docs, approvals, notifications.
5. Publish integration events via **transactional outbox** → Azure Service Bus.
6. Validate JWT from Azure AD; map roles to the three document profiles only.
7. Attachments: validate type/size; store in Azure Blob; metadata in SQL Server.
8. Parametrization service drives categories, WhatsApp numbers, mandatory docs — avoid hardcoded enums for business-configurable values when RN-16 applies.

## Checklist

- [ ] Use case covered by RF/CA
- [ ] Hexagonal dependency rule respected
- [ ] Outbox + idempotent consumer
- [ ] RBAC tests for the three profiles
- [ ] Protocol generation on create (RN-01)
