---
name: sdd-frontend-react
description: >-
  Builds the React portal for GBL Demandas with MSAL Azure AD login and journeys
  for Cessionário, GL/Administrador, and Responsável da Área. Use when
  implementing UI flows, forms (including Obras), status views, or RBAC-aware screens.
---

# SDD Frontend React

## Context

Portal journeys from [PDR.md](../../../PDR.md) §2–§4. Auth: Azure AD via MSAL.

## Profiles (UI labels — exact names)

- Cessionário
- GL / Administrador
- Responsável da Área

## Instructions

1. Protect all routes with MSAL; redirect unauthenticated users to AD login.
2. Show navigation and actions based on role claims (hide approve obra unless GL).
3. Cessionário: create demand, own list, respond, upload, track status/history.
4. Responsável da Área: area inbox, update status, interact, complete.
5. GL: global inbox, detail with all visibility fields (PDR EF-03), approve obras, parametrization screens.
6. Manutenção → subcategories including Obras; Obras form with dedicated upload slots (Projeto, ART, Seguro, Cronograma) and version/status for Projeto.
7. Surface protocol number prominently after create; show WhatsApp notification state from history when available.
8. Prefer accessible, clear operational UI; do not invent extra role dashboards.

## Checklist

- [ ] MSAL login works; API calls send bearer token
- [ ] Role-gated actions match matriz RBAC do PDR
- [ ] Obras blocks submit without mandatory docs
- [ ] Status lifecycle labels match PDR §4.1
- [ ] No fictional job titles in copy
