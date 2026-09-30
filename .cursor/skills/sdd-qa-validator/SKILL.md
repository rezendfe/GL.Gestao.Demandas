---
name: sdd-qa-validator
description: >-
  Validates GBL Demandas against PDR acceptance criteria: lifecycle, Obras
  approval, WhatsApp events, RBAC, and Azure AD security. Use when writing test
  plans, automating CA, regression, or verifying Spec-Driven compliance.
---

# SDD QA / Validator

## Context

Acceptance source: [PDR.md](../../../PDR.md) §9 and RN table §5.

## Instructions

1. Map every test to a CA or RN; fail build if critical CA missing.
2. Cover three profiles only — no fictional roles in fixtures.
3. Critical paths:
   - Create demand → protocol → routing → GL visibility
   - WhatsApp event published / recorded (mock provider OK)
   - Obras: block incomplete docs; GL approve/reject/adjust; cessionário resubmit
   - History entries on status/doc/notification changes
   - Parametrization affects new demands without code change
   - 401 without AD token; 403 on forbidden actions (e.g. Responsável approving obra)
4. Async: assert outbox/queue processing with eventual consistency waits.
5. Regression pack on status transition matrix (PDR §4.4).

## Checklist

- [ ] CA Abertura / Roteamento / GL / WhatsApp / Obras / Histórico / Param / Segurança
- [ ] Negative tests for RBAC
- [ ] Obras document versioning & motivo de ajuste
- [ ] Traceability matrix updated

## Report format

`CA-ID | Resultado | Evidência | RN relacionado`
