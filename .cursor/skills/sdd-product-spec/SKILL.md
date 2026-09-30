---
name: sdd-product-spec
description: >-
  Writes and updates Spec-Driven product specs, acceptance criteria, and
  traceability for the GBL Demandas system. Use when creating or revising PDR
  sections, RF/CA, user stories, or mapping Fluxo de Demandas.docx to specs.
---

# SDD Product / Spec Writer

## Context

- Source of truth: [PDR.md](../../../PDR.md)
- Functional source: `Fluxo de Demandas.docx`
- Orchestration: [AGENTS.md](../../../AGENTS.md)

## Roles (do not invent)

Cessionário · GL / Administrador · Responsável da Área

## Instructions

1. Read PDR before drafting; never contradict RN-01…RN-18 without updating the PDR first.
2. Specs must name actors exactly as above.
3. For each change, produce: **RF**, **CA** (Given/When/Then), and traceability to docx section or RN.
4. Keep Obras as Manutenção subcategory with mandatory docs and GL-only approval.
5. Prefer parametrization (RN-16) over hardcoded category lists in specs.
6. Stack assumptions in NFR: Azure AD login, Azure queues, SQL Server, hexagonal services — do not specify implementation code.

## Checklist

- [ ] Actors match document names only
- [ ] Status lifecycle aligned with PDR §4
- [ ] WhatsApp and GL visibility covered
- [ ] Acceptance criteria testable
- [ ] Open questions linked to análise doc, not silently assumed

## Output format

```markdown
### RF-X.Y Título
Descrição...
**CA:** Dado ..., quando ..., então ...
**Trace:** docx §N / RN-XX
```
