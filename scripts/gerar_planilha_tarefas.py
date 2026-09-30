# -*- coding: utf-8 -*-
"""
Gera planilha WBS do Sistema de Gestão de Demandas (GBL).

Premissas de estimativa (sempre em HORAS, nível PLENO):

1) Estimativa Pleno (h)
   - Colaborador pleno no papel (BE/FE/QA/etc.), sem pressupor fluência em SDD.
   - Esforço líquido (análise + execução + teste unitário próprio); exclui espera de terceiros.

2) Estimativa SDD (h)
   - Mesma tarefa executada por engenheiro pleno EXPERIENTE em Spec-Driven Development
     (PDR/RF/CA/ADR antes do código, DoD com rastreabilidade, menos rediscovery/retrabalho).
   - Fatores aplicados sobre a estimativa pleno (ver estimativa_sdd_horas).

3) Classificação SDD (Sim/Parcial/Não)
   - Indica se a tarefa é guiada por spec funcional, parcialmente por NFR/ADR, ou só operacional.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "WBS-Tarefas-Desenvolvimento-GBL.xlsx"
OUT_FALLBACK = ROOT / "docs" / "WBS-Tarefas-Desenvolvimento-GBL-revisada.xlsx"

HEADERS = [
    "ID",
    "Fase",
    "Épico / Módulo",
    "Frente",
    "Tarefa",
    "Descrição",
    "Perfil Executor",
    "Perfil Apoio",
    "Referência PDR",
    "Dependências",
    "Entregável",
    "Complexidade",
    "Estimativa Pleno (h)",
    "Estimativa SDD (h)",
    "Delta SDD (h)",
    "Dias Pleno",
    "Dias SDD",
    "Classificação SDD",
    "Status",
]

# Tupla:
# (fase_code, fase, epico, frente, tarefa, desc, executor, apoio, ref, deps, entregavel, complex, horas_pleno, sdd)
# sdd: "Sim" | "Parcial" | "Não"
# horas_sdd é derivada por estimativa_sdd_horas()


def estimativa_sdd_horas(horas_pleno: int, sdd: str, frente: str) -> int:
    """
    Esforço em horas se um engenheiro pleno fluente em SDD executar a tarefa.

    Redução típica vem de: spec clara (RF/CA), menos retrabalho, menos rediscovery,
    QA/homologação com aceite já testável. Tarefas só operacionais mantêm o mesmo esforço.
    """
    if sdd == "Não":
        return horas_pleno

    if frente in ("Análise de Negócio", "Documentação") and sdd == "Sim":
        # Pleno em SDD produz specs melhores com menos idas e vindas
        factor = 0.88
    elif frente in ("Back-end", "Front-end", "DBA") and sdd == "Sim":
        factor = 0.78
    elif frente == "Testes de QA" and sdd == "Sim":
        factor = 0.82
    elif frente == "Homologação" and sdd == "Sim":
        factor = 0.72
    elif frente in ("Arquitetura de Sistemas", "Arquitetura de Solução") and sdd == "Sim":
        factor = 0.85
    elif frente in ("Arquitetura de Sistemas", "Arquitetura de Solução") and sdd == "Parcial":
        factor = 0.90
    elif frente in ("Ambientes / DevOps", "Segurança", "Gestão de Projeto") and sdd == "Parcial":
        factor = 0.93
    elif sdd == "Parcial":
        factor = 0.90
    else:
        factor = 0.85

    return max(1, int(round(horas_pleno * factor)))

TASKS: list[tuple] = [
    # ========== F0 — INCEPTION / REQUISITOS ==========
    ("F0", "Inception / Requisitos", "Governança SDD", "Análise de Negócio",
     "Mapeamento de stakeholders e RACI do projeto",
     "Identificar decisor, key users dos 3 perfis de negócio, TI, segurança e operação; matriz RACI.",
     "Business Analyst", "Tech Lead / PM", "PDR §2", "—", "RACI + mapa stakeholders", "B", 8, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Análise de Negócio",
     "Workshop AS-IS / TO-BE do fluxo de demandas",
     "Modelar processo atual vs alvo (abertura → roteamento → atendimento → Obras → encerramento).",
     "Business Analyst", "Product Spec Writer", "PDR §4 / docx", "F0.01", "BPMN/fluxos AS-IS TO-BE", "A", 24, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Análise de Negócio",
     "Workshop de alinhamento — itens abertos PDR §11",
     "Taxonomia Obras vs Civil, ownership de status/SLA, falha WhatsApp, cancelamento, multi-unidade, versão de docs.",
     "Business Analyst", "Product Spec Writer", "PDR §11", "F0.02", "Ata + decisões formalizadas", "A", 16, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Análise de Negócio",
     "Levantamento de requisitos não funcionais com cliente",
     "SLA/SLO, RPO/RTO, volume estimado, janelas, retenção, LGPD e canais de suporte.",
     "Business Analyst", "Arquiteto de Solução", "PDR §8 / RNF-01", "F0.01", "Catálogo NFR priorizado", "M", 16, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Análise de Negócio",
     "Matriz RBAC detalhada (tela × API × perfil)",
     "Expandir §2.4; apenas Cessionário, GL/Administrador, Responsável da Área.",
     "Business Analyst", "Arquiteto de Sistemas", "PDR §2.4 / RN-04/05/10/17", "F0.03", "Matriz RBAC", "M", 16, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Análise de Negócio",
     "Classificação de dados e requisitos LGPD/privacidade",
     "Inventário de PII (telefone, e-mail, documentos); bases legais; retenção; mascaramento em Hml.",
     "Business Analyst", "Segurança da Informação", "RN-18 / §8", "F0.04", "Data classification + DPIA leve", "M", 16, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Documentação",
     "Atualizar PDR com decisões do workshop (versão controlada)",
     "Incorporar RN/RF/CA; manter rastreabilidade docx → PDR; changelog.",
     "Product Spec Writer", "Business Analyst", "PDR §1–§11 / RN-01..18", "F0.03", "PDR v1.1+", "M", 16, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Documentação",
     "Especificar RF/CA Given-When-Then por épico (EF-01…07)",
     "Critérios testáveis alinhados ao §9; Definition of Ready por história.",
     "Product Spec Writer", "QA", "PDR §6 / §9", "F0.07", "Spec pack RF/CA", "A", 40, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Documentação",
     "User stories / jornadas por perfil de negócio",
     "Jornadas Cessionário, GL/Administrador e Responsável da Área com aceite.",
     "Product Spec Writer", "Business Analyst", "PDR §2 / §7.4", "F0.08", "Backlog de jornadas", "M", 24, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Documentação",
     "Glossário de domínio e dicionário de status/eventos",
     "Nomenclatura oficial de status, categorias, protocolo e eventos de domínio.",
     "Business Analyst", "Product Spec Writer", "PDR §3 / §4.1 / §7.3", "F0.07", "Glossário versionado", "B", 8, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Documentação",
     "Definition of Done (DoD) e Definition of Ready (DoR) do time",
     "Incluir: PDR citado, testes CA, Outbox/eventos, RBAC e docs mínimos.",
     "Tech Lead / PM", "QA", "AGENTS.md / SDD", "F0.08", "DoD/DoR", "B", 6, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Gestão de Projeto",
     "Roadmap de releases (MVP → Obras → Parametrização avançada)",
     "MVP: abertura, roteamento, visão GL, WhatsApp básico; ondas seguintes.",
     "Tech Lead / PM", "Arquiteto de Solução", "PDR §1.2", "F0.08", "Roadmap + MVP scope", "M", 12, "Sim"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Gestão de Projeto",
     "Plano de riscos, premissas e restrições",
     "Riscos AD, WhatsApp provider, multi-unidade, dependências de cliente.",
     "Tech Lead / PM", "Business Analyst", "PDR §11", "F0.03", "Risk register", "M", 8, "Parcial"),
    ("F0", "Inception / Requisitos", "Governança SDD", "Análise de Negócio",
     "Protótipo/wireframes de baixa fidelidade das jornadas críticas",
     "Abertura, detalhe GL, aprovação Obras, parametrização — validação rápida.",
     "Business Analyst", "Desenvolvedor Frontend", "§2 / EF-03/05/07", "F0.09", "Wireframes aprovados", "M", 20, "Sim"),

    # ========== F1 — ARQUITETURA ==========
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "Desenho da landing zone Azure (Dev/Hml/Prod)",
     "Subscriptions, RGs, naming, tags, regiões, networking e isolamento.",
     "Arquiteto de Solução", "DevOps", "PDR §7 / RNF-01/04", "F0.12", "Diagrama landing zone", "A", 24, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "ADR — seleção de serviços Azure (compute, SQL, Bus, Blob, KV, Insights)",
     "Justificar App Service/AKS e stack alinhada a .NET + React + filas Azure.",
     "Arquiteto de Solução", "Arquiteto de Sistemas", "PDR §7.1–7.5", "F1.01", "ADR plataforma", "M", 12, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "Arquitetura Azure AD / Entra ID (app roles × 3 perfis)",
     "App registrations portal+APIs; grupos/roles; redirect URIs por ambiente.",
     "Arquiteto de Solução", "Segurança da Informação", "RN-17", "F1.02", "Desenho AD + roles", "A", 20, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "Arquitetura Azure Service Bus (queues/topics, DLQ, retry)",
     "Mapear eventos mínimos do PDR; políticas de poison message.",
     "Arquiteto de Solução", "Arquiteto de Sistemas", "PDR §7.3 / RNF-05", "F1.02", "Modelo de mensageria", "A", 16, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "Arquitetura Blob Storage + retenção + antivírus/policy",
     "Containers privados, MI, lifecycle, scan de malware (RNF-06).",
     "Arquiteto de Solução", "Segurança da Informação", "RN-18 / RNF-06", "F1.02", "ADR Blob", "M", 12, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "Arquitetura Key Vault + Managed Identity + rotação",
     "Zero secrets em config/repo; least privilege por serviço.",
     "Arquiteto de Solução", "DevOps", "RNF-04", "F1.02", "ADR Key Vault", "M", 10, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "Observabilidade (App Insights, Log Analytics, alertas SLO)",
     "Correlação protocolo/correlationId; alertas API, DLQ, SQL, Blob.",
     "Arquiteto de Solução", "DevOps", "RNF-07", "F1.02", "Plano observabilidade", "M", 16, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "Rede, WAF/Front Door/APIM, TLS e exposição do BFF",
     "APIs internas; portal/BFF públicos; diagramas de confiança.",
     "Arquiteto de Solução", "Segurança da Informação", "PDR §7.5", "F1.02", "Diagrama de rede", "A", 20, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "FinOps — capacidade e custo por ambiente",
     "Dimensionamento SQL, Bus, compute e Blob; budget alerts.",
     "Arquiteto de Solução", "Tech Lead / PM", "RNF-01", "F1.02", "Planilha custos", "M", 12, "Não"),
    ("F1", "Arquitetura", "Arquitetura de Solução Azure", "Arquitetura de Solução",
     "Estratégia de DR/backup (RPO/RTO) alinhada ao NFR",
     "SQL PITR, Blob soft-delete/versioning, runbook de restore.",
     "Arquiteto de Solução", "DBA", "RNF-01 / F0.04", "F1.01", "ADR DR", "M", 12, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "Context map e ownership de dados (bounded contexts)",
     "Identity, Demandas, Obras, Notificações, Parametrização, BFF — sync vs async.",
     "Arquiteto de Sistemas", "Arquiteto de Solução", "PDR §7.2", "F1.02", "Context map + ADRs", "A", 24, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "Template de microsserviço hexagonal (.NET)",
     "Domain/Application/Adapters; DI; health; Outbox stub; testes de domínio.",
     "Arquiteto de Sistemas", "Desenvolvedor Backend", "PDR §7.1 / AGENTS.md", "F1.11", "Template serviço", "A", 32, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "Contratos REST OpenAPI (BFF + serviços) + erros padrão",
     "Versionamento, paginação, problem+json, correlation headers, idempotency-key.",
     "Arquiteto de Sistemas", "Desenvolvedor Backend", "PDR §7.2/7.4", "F1.12", "OpenAPI v0", "A", 24, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "Catálogo de eventos de domínio + schemas JSON",
     "DemandaCriada, StatusAlterado, Obra*, NotificacaoWhatsApp, SeguroProximoVencimento.",
     "Arquiteto de Sistemas", "Desenvolvedor Backend", "PDR §7.3", "F1.11", "Event catalog", "A", 16, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "ADR Transactional Outbox + consumidores idempotentes + DLQ",
     "Padrão obrigatório antes de publicar no Service Bus.",
     "Arquiteto de Sistemas", "Desenvolvedor Backend", "PDR §7.3 / RNF-05", "F1.14", "ADR Outbox", "A", 16, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "ADR autenticação/autorização JWT + políticas RBAC",
     "Claims → 3 perfis; enforcement em API e BFF.",
     "Arquiteto de Sistemas", "Segurança da Informação", "RN-17 / CA Segurança", "F1.03", "ADR AuthZ", "A", 16, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "Guia Clean Code / coding standards (.NET + React)",
     "Naming, erros, logging, lint, PR checklist, revisão de arquitetura.",
     "Arquiteto de Sistemas", "Tech Lead / PM", "AGENTS.md", "F1.12", "Engineering guidelines", "M", 12, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "ADR resiliência (retry, circuit breaker, timeout, bulkhead)",
     "Políticas SQL, Bus, Blob e provedor WhatsApp.",
     "Arquiteto de Sistemas", "Arquiteto de Solução", "RNF-05", "F1.04", "ADR resiliência", "M", 12, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "ADR cache, rate limit e proteção do BFF",
     "Throttle por cliente; cache de parametrização read-only; CORS para SPA.",
     "Arquiteto de Sistemas", "Segurança da Informação", "§7.4 / RNF-01", "F1.13", "ADR BFF hardening", "M", 12, "Parcial"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "ADR multi-unidade / multi-cessionário (decisão §11)",
     "Modelo de tenancy após workshop; impacto em Identity e Demandas.",
     "Arquiteto de Sistemas", "Business Analyst", "PDR §11", "F0.03", "ADR tenancy", "M", 12, "Sim"),
    ("F1", "Arquitetura", "Arquitetura de Sistemas", "Arquitetura de Sistemas",
     "Matriz de modos de falha (WhatsApp, Bus, AD, Blob, SQL)",
     "Comportamento degradado, retries e mensagens ao usuário.",
     "Arquiteto de Sistemas", "QA", "§11 / RNF-05", "F1.04 / F1.18", "Failure modes doc", "M", 12, "Sim"),

    # ========== F2 — AMBIENTES / DEVOPS ==========
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "Definir branching strategy e versionamento semântico",
     "Trunk/GitFlow simplificado; tags de release; proteção de main.",
     "DevOps", "Tech Lead / PM", "AGENTS.md", "F0.11", "Git workflow doc", "B", 6, "Não"),
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "IaC (Bicep/Terraform) base multi-ambiente",
     "Módulos reutilizáveis; parâmetros Dev/Hml/Prod; state remoto.",
     "DevOps", "Arquiteto de Solução", "RNF-04", "F1.01", "Repo IaC", "A", 40, "Parcial"),
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "Provisionar ambiente Desenvolvimento",
     "SQL, Service Bus, Blob, Key Vault, Insights, hosts APIs/portal.",
     "DevOps", "Arquiteto de Solução", "PDR §7", "F2.02", "Ambiente Dev", "A", 24, "Não"),
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "Provisionar ambiente Homologação",
     "Topologia espelhada; isolation e sizing para UAT.",
     "DevOps", "Arquiteto de Solução", "RNF-01/04", "F2.02", "Ambiente Hml", "A", 24, "Não"),
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "Provisionar ambiente Produção",
     "HA, backups, WAF, diagnósticos e controles de mudança.",
     "DevOps", "Arquiteto de Solução", "RNF-01/04", "F2.02", "Ambiente Prod", "A", 32, "Não"),
    ("F2", "Ambientes / DevOps", "CI/CD", "Ambientes / DevOps",
     "Pipeline CI backend (.NET): build, test, SCA, publish",
     "Quality gates; artefatos por serviço; fail on critical CVE.",
     "DevOps", "Desenvolvedor Backend", "AGENTS.md", "F2.01 / F1.12", "CI backend", "A", 24, "Parcial"),
    ("F2", "Ambientes / DevOps", "CI/CD", "Ambientes / DevOps",
     "Pipeline CI frontend (React): lint, test, build, publish",
     "Artefato estático; análise estática; budgets de bundle.",
     "DevOps", "Desenvolvedor Frontend", "PDR §7.4", "F2.01", "CI frontend", "M", 16, "Parcial"),
    ("F2", "Ambientes / DevOps", "CI/CD", "Ambientes / DevOps",
     "Pipelines CD Dev → Hml → Prod com gates de aprovação",
     "Secrets via KV; slots/swap se aplicável; evidências de deploy.",
     "DevOps", "Tech Lead / PM", "RNF-04", "F2.06 / F2.07", "CD multi-env", "A", 24, "Não"),
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "Configurar Azure AD apps/grupos por ambiente",
     "Separar registrations; mapear roles aos 3 perfis.",
     "DevOps", "Arquiteto de Solução", "RN-17", "F1.03 / F2.03", "AD apps por env", "M", 12, "Sim"),
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "Ambiente local (compose/scripts) + README onboarding",
     "SQL container, Bus emulator/dev, seed mínimo, MSAL Dev.",
     "DevOps", "Desenvolvedor Backend", "AGENTS.md", "F1.12", "Dev local guide", "M", 16, "Parcial"),
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "Backup, restore drill e runbook DR",
     "Teste de restore em Hml; documentar RPO/RTO reais.",
     "DevOps", "DBA", "RNF-01 / F1.10", "F2.05", "Runbook DR + evidência", "A", 16, "Não"),
    ("F2", "Ambientes / DevOps", "CI/CD", "Ambientes / DevOps",
     "Quality gate Sonar/equivalente + cobertura mínima",
     "Bloquear PR abaixo do limiar acordado no DoD.",
     "DevOps", "Tech Lead / PM", "F0.11", "F2.06", "Quality gates", "M", 12, "Parcial"),
    ("F2", "Ambientes / DevOps", "Ambientes", "Ambientes / DevOps",
     "Dashboards e alertas operacionais (SLO)",
     "Latência P95, taxa 5xx, profundidade de fila, DLQ, falhas WhatsApp.",
     "DevOps", "Arquiteto de Solução", "RNF-07", "F1.07 / F2.03", "Dashboards Azure", "M", 16, "Parcial"),
    ("F2", "Ambientes / DevOps", "Segurança", "Segurança",
     "Baseline hardening Azure (NSG/PE/diagnostics/RBAC)",
     "Least privilege MI; diagnostic settings; private endpoints onde couber.",
     "Segurança da Informação", "DevOps", "RNF-04 / §7.1", "F2.05", "Checklist segurança Azure", "A", 20, "Parcial"),

    # ========== F3 — DBA ==========
    ("F3", "Modelagem de Dados", "DBA — Demandas", "DBA",
     "Modelo lógico/físico contexto Demandas",
     "Protocolo, status, roteamento, prazos, histórico append-only, metadados de anexos.",
     "DBA", "Arquiteto de Sistemas", "EF-01/02/06 / RN-01/15", "F1.11", "ER + DDL Demandas", "A", 32, "Sim"),
    ("F3", "Modelagem de Dados", "DBA — Obras", "DBA",
     "Modelo lógico/físico contexto Obras/Documentos",
     "Projeto (versão), ART, Seguro (vigência), Cronograma, motivos ajuste/reprovação.",
     "DBA", "Arquiteto de Sistemas", "EF-05 / RN-09..14", "F1.11", "ER + DDL Obras", "A", 32, "Sim"),
    ("F3", "Modelagem de Dados", "DBA — Parametrização", "DBA",
     "Modelo lógico/físico contexto Parametrização",
     "Categorias/subs, áreas, responsáveis, WhatsApp, docs obrigatórios, prazos, regras.",
     "DBA", "Arquiteto de Sistemas", "EF-07 / RN-16", "F1.11", "ER + DDL Param", "A", 24, "Sim"),
    ("F3", "Modelagem de Dados", "DBA — Notificações", "DBA",
     "Modelo lógico/físico contexto Notificações",
     "Pedidos, tentativas, status sucesso/falha, correlação com protocolo.",
     "DBA", "Arquiteto de Sistemas", "EF-04 / RN-07", "F1.11", "ER + DDL Notif", "M", 16, "Sim"),
    ("F3", "Modelagem de Dados", "DBA — Identity", "DBA",
     "Modelo auxiliar Identity (mapeamento área↔usuário)",
     "Sem substituir Azure AD como IdP; suporte a RN-05.",
     "DBA", "Arquiteto de Sistemas", "RN-17 / §7.2", "F1.03", "ER Identity auxiliar", "B", 8, "Sim"),
    ("F3", "Modelagem de Dados", "DBA — Transversal", "DBA",
     "Tabelas Outbox/Inbox + índices de idempotência",
     "Por bounded context; limpeza/retention de outbox processado.",
     "DBA", "Arquiteto de Sistemas", "§7.3 / RNF-05", "F1.15", "DDL Outbox/Inbox", "M", 12, "Sim"),
    ("F3", "Modelagem de Dados", "DBA — Transversal", "DBA",
     "Migrations versionadas por contexto + estratégia de rollback",
     "EF Core/DbUp; pipeline migrate Dev/Hml/Prod.",
     "DBA", "Desenvolvedor Backend", "AGENTS.md", "F3.01–F3.06", "Pacote migrations", "A", 20, "Parcial"),
    ("F3", "Modelagem de Dados", "DBA — Transversal", "DBA",
     "Seeds iniciais (taxonomia §3.1 incl. Obras)",
     "Comercial, Estacionamento, Recepção, Manutenção+subs parametrizáveis.",
     "DBA", "Business Analyst", "PDR §3.1 / RN-16", "F3.03", "Seed scripts", "M", 12, "Sim"),
    ("F3", "Modelagem de Dados", "DBA — Transversal", "DBA",
     "Índices e tuning inicial (listagens GL/área/protocolo)",
     "Planos de consulta; estatísticas; paginação eficiente.",
     "DBA", "Desenvolvedor Backend", "EF-03 / RNF-02", "F3.01", "Índices + review", "M", 12, "Parcial"),
    ("F3", "Modelagem de Dados", "DBA — Transversal", "DBA",
     "Mascaramento/anonimização de dados sensíveis em Hml",
     "Política alinhada à classificação LGPD.",
     "DBA", "Segurança da Informação", "F0.06 / RNF-01", "F2.04 / F3.07", "Política dados Hml", "M", 12, "Parcial"),
    ("F3", "Modelagem de Dados", "DBA — Transversal", "DBA",
     "Revisão de integridade referencial e convenções de naming SQL",
     "Padrões de PK/FK, audit columns, soft constraints entre contextos (sem DB compartilhado gravável).",
     "DBA", "Arquiteto de Sistemas", "§7.1", "F3.01–F3.05", "SQL conventions", "B", 8, "Parcial"),

    # ========== F4 — BACKEND ==========
    ("F4", "Desenvolvimento Backend", "Identity / Access", "Back-end",
     "Bootstrap serviço Identity (hexagonal + health)",
     "Ports/adapters, config KV, health/readiness.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.2 Identity", "F1.12 / F2.03", "API Identity skeleton", "M", 16, "Sim"),
    ("F4", "Desenvolvimento Backend", "Identity / Access", "Back-end",
     "Validação JWT Azure AD (middleware)",
     "Issuer/audience, JWKS cache, rejeição de tokens inválidos.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "RN-17", "F1.16 / F4.01", "Auth middleware", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "Identity / Access", "Back-end",
     "Policies RBAC (claims → 3 perfis de negócio)",
     "Handlers/autorização por endpoint; testes de 403.",
     "Desenvolvedor Backend", "Business Analyst", "PDR §2 / F0.05", "F4.02", "Policy handlers", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "Identity / Access", "Back-end",
     "API GET /me (perfil, áreas, permissões)",
     "Contrato para o portal montar menus/jornadas.",
     "Desenvolvedor Backend", "Desenvolvedor Frontend", "§7.4", "F4.03", "GET /me", "M", 12, "Sim"),

    ("F4", "Desenvolvimento Backend", "Parametrização", "Back-end",
     "Bootstrap serviço Parametrização + persistência",
     "CRUD interno; isolamento de schema/DB.",
     "Desenvolvedor Backend", "DBA", "EF-07 / RN-16", "F3.03 / F1.12", "API Param skeleton", "M", 16, "Sim"),
    ("F4", "Desenvolvimento Backend", "Parametrização", "Back-end",
     "CRUD categorias/subcategorias (Manutenção → Obras)",
     "Hierarquia; ativar/desativar; sem hardcode em outros serviços (RN-16).",
     "Desenvolvedor Backend", "Business Analyst", "RN-02/16 / §3.1", "F4.05", "APIs categorias", "A", 24, "Sim"),
    ("F4", "Desenvolvimento Backend", "Parametrização", "Back-end",
     "CRUD responsáveis por área/categoria + vínculo AD",
     "Associação usuário↔área para filtro RN-05.",
     "Desenvolvedor Backend", "Business Analyst", "RN-03/05/16", "F4.05", "APIs responsáveis", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "Parametrização", "Back-end",
     "CRUD WhatsApp por categoria/subcategoria",
     "Múltiplos números; validação de formato E.164.",
     "Desenvolvedor Backend", "Business Analyst", "RN-06/16 / EF-04", "F4.05", "APIs WhatsApp config", "M", 12, "Sim"),
    ("F4", "Desenvolvimento Backend", "Parametrização", "Back-end",
     "Parametrização docs obrigatórios, prazos e regras de aprovação",
     "Suportar RNF-03 sem deploy para novos tipos dentro do modelo.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "RN-16 / RNF-03", "F4.06", "APIs regras/prazos/docs", "A", 28, "Sim"),
    ("F4", "Desenvolvimento Backend", "Parametrização", "Back-end",
     "APIs de leitura + cache para Demandas/Obras/BFF",
     "Contratos estáveis; sem DB compartilhado gravável.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.2 / F1.19", "F4.06–F4.09", "Read APIs Param", "M", 12, "Sim"),

    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Bootstrap serviço Demandas (hexagonal + Outbox)",
     "Domínio ciclo de vida; ports; publicação de eventos.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.2 Demandas", "F1.12 / F3.01", "API Demandas skeleton", "A", 24, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Abertura de demanda + protocolo único",
     "Validar categoria/sub; status Aberta; emitir DemandaCriada.",
     "Desenvolvedor Backend", "DBA", "RF-01 / RN-01/02 / CA Abertura", "F4.11 / F4.10", "POST demanda", "A", 28, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Roteamento automático à área responsável",
     "Usar Parametrização; fila da área + visão GL (CA Roteamento).",
     "Desenvolvedor Backend", "Business Analyst", "RF-02.1 / RN-03", "F4.07 / F4.12", "Roteador", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Máquina de estados e transições (§4.1 / §4.4)",
     "Validação por perfil; terminais Reprovada/Cancelada; testes de domínio.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§4 / RF-02.2 / RN-15", "F4.11", "Status engine", "A", 40, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "APIs listagem/detalhe por perfil (próprias/área/todas)",
     "Filtros, paginação, campos mínimos GL (EF-03).",
     "Desenvolvedor Backend", "Desenvolvedor Frontend", "EF-03 / RN-04/05", "F4.03 / F4.13", "GETs demandas", "A", 28, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Andamento, comentários e metadados de anexos",
     "Integração Blob; validação tipo/tamanho; trilha histórica.",
     "Desenvolvedor Backend", "Arquiteto de Solução", "RN-15/18 / RNF-06", "F1.05 / F4.11", "APIs andamento/anexos", "A", 28, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Histórico append-only imutável",
     "Quem/quando/o quê/status ant-novo/comentários/docs/notificações.",
     "Desenvolvedor Backend", "DBA", "EF-06 / RN-15 / CA Histórico", "F3.01 / F4.16", "API histórico", "A", 24, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Cancelamento e encerramento (regras parametrizadas)",
     "Após decisão §11; permissões Cessionário/GL conforme parâmetro.",
     "Desenvolvedor Backend", "Business Analyst", "§4.4 / §11", "F0.03 / F4.14", "APIs cancel/encerrar", "M", 16, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Publishers DemandaCriada / DemandaStatusAlterado (Outbox)",
     "correlationId=protocolo; idempotência documentada.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.3 / RNF-05/07", "F1.15 / F4.12", "Publishers Demandas", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "Demandas", "Back-end",
     "Solicitar informação/documentação (transição + notificação)",
     "Status Aguardando informação; mensagem ao Cessionário (evento).",
     "Desenvolvedor Backend", "Business Analyst", "§4.1 / RN-08", "F4.14 / F4.19", "API solicitar docs", "M", 16, "Sim"),

    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Bootstrap serviço Obras + domínio documentos",
     "Agregados Projeto, ART, Seguro, Cronograma, aprovação GL.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.2 Obras / EF-05", "F3.02 / F1.12", "API Obras skeleton", "A", 24, "Sim"),
    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Formulário Obras + validação docs obrigatórios",
     "Bloquear análise sem Projeto, ART, Seguro e Cronograma (CA Obras).",
     "Desenvolvedor Backend", "Business Analyst", "RN-09 / RF-05.1", "F4.21", "POST obra + validação", "A", 32, "Sim"),
    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Versionamento de Projeto e status de análise",
     "Versão, data envio, observações GL; política de reenvio (§11).",
     "Desenvolvedor Backend", "DBA", "RN-12 / RF-05.2", "F4.22", "API versões projeto", "A", 24, "Sim"),
    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Workflow aprovação exclusivo GL (aprovar/reprovar/ajustes)",
     "Motivo obrigatório; reenvio; nova análise exigida.",
     "Desenvolvedor Backend", "Business Analyst", "RN-10/11 / CA Obras", "F4.03 / F4.23", "APIs decisão GL", "A", 28, "Sim"),
    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Cronograma (5 etapas) + detecção de atrasos",
     "Mobilização…Finalização; indicadores de atraso (RN-14).",
     "Desenvolvedor Backend", "Business Analyst", "RN-14 / §3.3", "F4.21", "API cronograma", "A", 24, "Sim"),
    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Seguro de obra + job SeguroProximoVencimento",
     "Scheduler/worker; evento de alerta de validade.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "RN-13 / §7.3", "F4.21 / F4.28", "Alerta seguro", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Publishers eventos Obra* no Service Bus",
     "EnviadaParaAnalise, Aprovada, Reprovada, AjustesSolicitados.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.3", "F1.15 / F4.24", "Publishers Obras", "M", 12, "Sim"),
    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Integração eventual Obras ↔ Demandas (status/histórico)",
     "Consumers; ownership documentado no context map.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.2 / RN-15", "F4.19 / F4.27", "Consumers cruzados", "A", 24, "Sim"),
    ("F4", "Desenvolvimento Backend", "Obras / Documentos", "Back-end",
     "Upload versionado de documentos de obra (Blob)",
     "Validação RN-18; metadados; antivírus hook se previsto.",
     "Desenvolvedor Backend", "Segurança da Informação", "RN-18 / RNF-06", "F1.05 / F4.22", "Upload docs obra", "A", 20, "Sim"),

    ("F4", "Desenvolvimento Backend", "Notificações", "Back-end",
     "Bootstrap worker Notificações + consumer Service Bus",
     "Consumir eventos e NotificacaoWhatsAppSolicitada.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.2 / EF-04", "F1.04 / F3.04", "Worker Notificações", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "Notificações", "Back-end",
     "Adapter provedor WhatsApp (outbound + sandbox)",
     "HTTP client; timeouts; mapeamento de erros; ambiente de teste.",
     "Desenvolvedor Backend", "Arquiteto de Solução", "RN-07 / §1.2", "F10.01 / F4.30", "WhatsApp adapter", "A", 28, "Sim"),
    ("F4", "Desenvolvimento Backend", "Notificações", "Back-end",
     "Resolver destinatários via Parametrização",
     "WhatsApps da categoria/subcategoria no momento do envio.",
     "Desenvolvedor Backend", "Desenvolvedor Backend", "RN-06/07", "F4.08 / F4.30", "Resolver destinatários", "M", 10, "Sim"),
    ("F4", "Desenvolvimento Backend", "Notificações", "Back-end",
     "Registrar sucesso/falha no histórico da demanda",
     "Callback/evento para Demandas (CA WhatsApp).",
     "Desenvolvedor Backend", "Desenvolvedor Backend", "RF-04.3 / CA WhatsApp", "F4.17 / F4.31", "Feedback notificação", "A", 16, "Sim"),
    ("F4", "Desenvolvimento Backend", "Notificações", "Back-end",
     "Retry, DLQ, idempotência e runbook de reprocessamento",
     "Cumprir RNF-05; métricas de falha.",
     "Desenvolvedor Backend", "DevOps", "RNF-05", "F1.15 / F4.30", "Resiliência consumer", "A", 16, "Sim"),
    ("F4", "Desenvolvimento Backend", "Notificações", "Back-end",
     "Templates de mensagem parametrizáveis (criação/status/seguro)",
     "Conteúdo aprovado; variáveis protocolo/categoria/status.",
     "Desenvolvedor Backend", "Business Analyst", "RN-07 / F10.03", "F4.31 / F10.03", "Template engine", "M", 12, "Sim"),

    ("F4", "Desenvolvimento Backend", "BFF / Gateway", "Back-end",
     "BFF — agregação portal (orquestração + anti-corruption)",
     "Reduzir chatiness; mapear DTOs de UI; correlation.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "§7.2 BFF", "F4.04 / F4.15 / F4.10", "BFF API", "A", 32, "Sim"),
    ("F4", "Desenvolvimento Backend", "BFF / Gateway", "Back-end",
     "Endpoints jornada Cessionário no BFF",
     "Abrir, minhas demandas, detalhe, anexos, reenvio Obras.",
     "Desenvolvedor Backend", "Desenvolvedor Frontend", "§2.1 / EF-01/05", "F4.36", "BFF Cessionário", "A", 24, "Sim"),
    ("F4", "Desenvolvimento Backend", "BFF / Gateway", "Back-end",
     "Endpoints jornada GL/Administrador no BFF",
     "Todas demandas, aprovação Obras, parametrização, indicadores.",
     "Desenvolvedor Backend", "Desenvolvedor Frontend", "§2.2 / EF-03/07", "F4.36", "BFF GL", "A", 28, "Sim"),
    ("F4", "Desenvolvimento Backend", "BFF / Gateway", "Back-end",
     "Endpoints jornada Responsável da Área no BFF",
     "Fila da área, status, andamento.",
     "Desenvolvedor Backend", "Desenvolvedor Frontend", "§2.3 / EF-02", "F4.36", "BFF Responsável", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "BFF / Gateway", "Back-end",
     "Upload/download seguro de anexos (SAS curta / MI)",
     "Validação RN-18; sem blob público.",
     "Desenvolvedor Backend", "Segurança da Informação", "RN-18 / RNF-06", "F1.05 / F4.36", "APIs anexos BFF", "A", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "BFF / Gateway", "Back-end",
     "Rate limiting, CORS e problem details no BFF",
     "Conforme ADR F1.19; respostas consistentes ao portal.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "F1.19", "F4.36", "Hardening BFF", "M", 12, "Parcial"),

    ("F4", "Desenvolvimento Backend", "Transversal", "Back-end",
     "Shared libs (logging, correlation, errors, auth helpers)",
     "NuGet interno sem acoplar domínios.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "RNF-07", "F1.17", "Shared packages", "M", 16, "Parcial"),
    ("F4", "Desenvolvimento Backend", "Transversal", "Back-end",
     "Testes unitários de domínio (Demandas, Obras, Param, RBAC)",
     "Cobrir RN críticas; parte do DoD.",
     "Desenvolvedor Backend", "QA", "§5 / §9 / F0.11", "F4.11–F4.25", "Suíte unitária BE", "A", 40, "Sim"),
    ("F4", "Desenvolvimento Backend", "Transversal", "Back-end",
     "Testes de integração (API + SQL + Bus emulator)",
     "Fluxos DemandaCriada → Notificação; Outbox end-to-end em Dev.",
     "Desenvolvedor Backend", "QA", "§7.3 / RNF-05", "F4.19 / F4.30", "Integration tests BE", "A", 32, "Sim"),
    ("F4", "Desenvolvimento Backend", "Transversal", "Back-end",
     "Contract tests OpenAPI / Pact (BFF ↔ serviços)",
     "Quebra de contrato falha no CI.",
     "Desenvolvedor Backend", "QA", "F1.13", "F4.36", "Contract tests", "M", 16, "Sim"),
    ("F4", "Desenvolvimento Backend", "Relatórios", "Back-end",
     "APIs indicadores básicos (GL) — sem BI avançado",
     "Volumes por status/categoria/prazo; export CSV simples se previsto.",
     "Desenvolvedor Backend", "Business Analyst", "§2.2 / §1.2", "F4.15", "APIs indicadores", "M", 20, "Sim"),
    ("F4", "Desenvolvimento Backend", "Transversal", "Back-end",
     "Health/readiness probes e métricas custom por serviço",
     "Dependências SQL/Bus/Blob; export para App Insights.",
     "Desenvolvedor Backend", "DevOps", "RNF-07", "F2.13 / F4.01", "Probes + metrics", "M", 12, "Parcial"),

    # ========== F5 — FRONTEND ==========
    ("F5", "Desenvolvimento Frontend", "Portal React", "Front-end",
     "Scaffold portal React + estrutura de pastas/roteamento",
     "Alinhar ao design system corporativo existente (se houver).",
     "Desenvolvedor Frontend", "Arquiteto de Sistemas", "§7.4", "F1.17", "App React base", "M", 16, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Portal React", "Front-end",
     "Integração MSAL (login/logout/silent renew)",
     "Guards de rota; tratamento de interação necessária.",
     "Desenvolvedor Frontend", "Arquiteto de Solução", "RN-17 / CA Segurança", "F2.09 / F4.02", "Auth MSAL", "A", 20, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Portal React", "Front-end",
     "Shell + navegação RBAC por perfil de negócio",
     "Menus distintos Cessionário / GL / Responsável da Área.",
     "Desenvolvedor Frontend", "Business Analyst", "§2 / §7.4", "F4.04 / F5.02", "Layout + nav", "A", 20, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Portal React", "Front-end",
     "API client BFF (401/403, correlation, retries leves)",
     "Error boundaries; toasts; tipagem OpenAPI se gerada.",
     "Desenvolvedor Frontend", "Desenvolvedor Backend", "F4.36", "F5.02", "HTTP client", "M", 12, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Portal React", "Front-end",
     "Telemetria client-side (App Insights JS)",
     "Page views, erros, correlation com protocolo quando aplicável.",
     "Desenvolvedor Frontend", "DevOps", "RNF-07", "F1.07 / F5.01", "FE telemetry", "B", 8, "Parcial"),

    ("F5", "Desenvolvimento Frontend", "Jornada Cessionário", "Front-end",
     "Formulário abertura de demanda (genérico)",
     "Categoria/sub, local, descrição, anexos; validação alinhada ao CA.",
     "Desenvolvedor Frontend", "Business Analyst", "§3.2 / RF-01 / CA Abertura", "F4.37 / F5.04", "Form abertura", "A", 28, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada Cessionário", "Front-end",
     "Minhas demandas + detalhe (status/histórico)",
     "Acompanhar protocolo, prazos e comunicação.",
     "Desenvolvedor Frontend", "Business Analyst", "§2.1 / EF-06", "F4.37", "Telas minhas demandas", "A", 24, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada Cessionário", "Front-end",
     "Formulário Obras + uploads obrigatórios/versão",
     "Projeto, ART, Seguro, Cronograma; feedback de status.",
     "Desenvolvedor Frontend", "Business Analyst", "§3.3 / RF-05.1 / CA Obras", "F4.38 / F4.29", "UI Obras", "A", 40, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada Cessionário", "Front-end",
     "Reenvio após ajustes solicitados pelo GL",
     "Exibir motivo; corrigir; reenviar para nova análise.",
     "Desenvolvedor Frontend", "Business Analyst", "RN-11 / CA Obras", "F5.08", "UI reenvio Obras", "M", 16, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada Cessionário", "Front-end",
     "Responder solicitação de informação/documentação",
     "Anexar/comentar em Aguardando informação.",
     "Desenvolvedor Frontend", "Business Analyst", "§4.1 / §2.1", "F4.20 / F5.07", "UI resposta docs", "M", 12, "Sim"),

    ("F5", "Desenvolvimento Frontend", "Jornada Responsável da Área", "Front-end",
     "Fila da área + filtros (RN-05)",
     "Somente demandas das áreas do usuário.",
     "Desenvolvedor Frontend", "Business Analyst", "§2.3 / RN-05", "F4.39", "UI fila área", "A", 20, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada Responsável da Área", "Front-end",
     "Atualizar status, andamento e anexos",
     "Transições permitidas; visível ao GL (RN-08).",
     "Desenvolvedor Frontend", "Business Analyst", "RF-02.2 / RN-08", "F4.39 / F4.16", "UI atendimento", "A", 24, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada Responsável da Área", "Front-end",
     "Acompanhar/atualizar cronograma de Obras",
     "Etapas e atrasos na execução.",
     "Desenvolvedor Frontend", "Business Analyst", "RN-14 / RF-05.3", "F4.25", "UI cronograma área", "M", 16, "Sim"),

    ("F5", "Desenvolvimento Frontend", "Jornada GL / Administrador", "Front-end",
     "Lista global + detalhe completo (EF-03)",
     "Campos mínimos do documento funcional.",
     "Desenvolvedor Frontend", "Business Analyst", "EF-03 / RN-04 / CA GL", "F4.38", "UI visão global GL", "A", 28, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada GL / Administrador", "Front-end",
     "Painel aprovação Obras (aprovar/reprovar/ajustes)",
     "Motivo obrigatório; exclusivo GL.",
     "Desenvolvedor Frontend", "Business Analyst", "RN-10/11 / RF-05.2", "F4.38 / F4.24", "UI aprovação Obras", "A", 24, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada GL / Administrador", "Front-end",
     "CRUD parametrização administrativa",
     "Categorias, responsáveis, WhatsApp, docs, prazos, fluxos.",
     "Desenvolvedor Frontend", "Business Analyst", "EF-07 / RN-16 / CA Param", "F4.38 / F4.05–F4.09", "UI admin param", "A", 40, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada GL / Administrador", "Front-end",
     "Indicadores básicos + exportação",
     "Sem BI avançado (fora de escopo v1).",
     "Desenvolvedor Frontend", "Business Analyst", "§2.2 / §1.2", "F4.46", "UI indicadores", "M", 20, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada GL / Administrador", "Front-end",
     "Painel prazos e alertas de seguro",
     "SLA e apólices próximas do vencimento.",
     "Desenvolvedor Frontend", "Business Analyst", "RN-13 / §2.2", "F4.26 / F4.46", "UI prazos/alertas", "M", 16, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Jornada GL / Administrador", "Front-end",
     "Solicitar documentos / analisar demanda (ações GL)",
     "Fluxos de análise e pedido de informação a partir do detalhe.",
     "Desenvolvedor Frontend", "Business Analyst", "§2.2 / F4.20", "F5.14 / F4.20", "UI ações GL", "M", 16, "Sim"),

    ("F5", "Desenvolvimento Frontend", "UX Transversal", "Front-end",
     "Componente de upload (tipo/tamanho/progresso)",
     "Feedback de erros; múltiplos arquivos.",
     "Desenvolvedor Frontend", "Desenvolvedor Backend", "RN-18 / RNF-06", "F4.40", "Upload component", "M", 12, "Sim"),
    ("F5", "Desenvolvimento Frontend", "UX Transversal", "Front-end",
     "Timeline de histórico da demanda",
     "Trilha imutável legível (CA Histórico).",
     "Desenvolvedor Frontend", "QA", "CA Histórico / RN-15", "F4.17", "History timeline", "M", 12, "Sim"),
    ("F5", "Desenvolvimento Frontend", "UX Transversal", "Front-end",
     "Estados vazios/loading/erro + tratamento 403",
     "Alinhado a CA Segurança.",
     "Desenvolvedor Frontend", "QA", "CA Segurança", "F5.03", "UI states", "B", 8, "Sim"),
    ("F5", "Desenvolvimento Frontend", "UX Transversal", "Front-end",
     "Responsividade web (desktop/tablet/mobile browser)",
     "App nativo fora de escopo; portal utilizável.",
     "Desenvolvedor Frontend", "QA", "§1.2", "F5.01", "UI responsiva", "M", 16, "Parcial"),
    ("F5", "Desenvolvimento Frontend", "UX Transversal", "Front-end",
     "Acessibilidade básica (WCAG 2.1 AA — checklist crítico)",
     "Foco, labels, contraste, teclado nas jornadas principais.",
     "Desenvolvedor Frontend", "QA", "NFR UX", "F5.06–F5.16", "a11y checklist FE", "M", 16, "Parcial"),
    ("F5", "Desenvolvimento Frontend", "UX Transversal", "Front-end",
     "Testes unitários/componentes + e2e críticos",
     "Login, abertura, aprovação Obras, RBAC de telas (Playwright/Cypress).",
     "Desenvolvedor Frontend", "QA", "§9", "F5.06–F5.16", "Suíte FE tests", "A", 32, "Sim"),
    ("F5", "Desenvolvimento Frontend", "Apresentação", "Front-end",
     "Atualizar presentation/jornada-demandas.html se fluxo mudar",
     "Manter artefato explorável alinhado ao PDR.",
     "Desenvolvedor Frontend", "Product Spec Writer", "presentation/", "F0.07", "HTML jornadas", "B", 8, "Sim"),

    # ========== F6 — DOCUMENTAÇÃO ==========
    ("F6", "Documentação", "Documentação Técnica", "Documentação",
     "Documentação C4 / diagramas Azure e de sequência",
     "Context, container, component; fluxo Obras e WhatsApp.",
     "Arquiteto de Sistemas", "Arquiteto de Solução", "§7", "F1.*", "Docs arquitetura", "A", 24, "Sim"),
    ("F6", "Documentação", "Documentação Técnica", "Documentação",
     "Runbooks (deploy, DLQ, restore, incidente WhatsApp, AD)",
     "Procedimentos operacionais e escalonamento.",
     "DevOps", "Desenvolvedor Backend", "RNF-05/07", "F2.* / F4.34", "Runbooks", "A", 20, "Parcial"),
    ("F6", "Documentação", "Documentação Técnica", "Documentação",
     "Publicar OpenAPI e guia de consumo interno",
     "Portal de specs para FE e QA.",
     "Desenvolvedor Backend", "Arquiteto de Sistemas", "F1.13", "F4.36", "OpenAPI publicado", "M", 12, "Sim"),
    ("F6", "Documentação", "Documentação Funcional", "Documentação",
     "Manual do Cessionário",
     "Abrir demanda, Obras, acompanhar, reenviar docs.",
     "Product Spec Writer", "Business Analyst", "§2.1", "F5.06–F5.10", "Manual Cessionário", "M", 16, "Sim"),
    ("F6", "Documentação", "Documentação Funcional", "Documentação",
     "Manual do Responsável da Área",
     "Fila, status, andamento, anexos.",
     "Product Spec Writer", "Business Analyst", "§2.3", "F5.11–F5.13", "Manual Responsável", "M", 12, "Sim"),
    ("F6", "Documentação", "Documentação Funcional", "Documentação",
     "Manual do GL / Administrador",
     "Visão global, aprovação Obras, parametrização, relatórios.",
     "Product Spec Writer", "Business Analyst", "§2.2", "F5.14–F5.19", "Manual GL", "M", 16, "Sim"),
    ("F6", "Documentação", "Documentação Técnica", "Documentação",
     "Guia de onboarding de desenvolvedores",
     "Setup local, hexagonal, AD Dev, seeds, DoD.",
     "Tech Lead / PM", "DevOps", "AGENTS.md", "F2.10", "Dev onboarding", "B", 8, "Parcial"),
    ("F6", "Documentação", "Documentação Técnica", "Documentação",
     "Matriz de rastreabilidade RN/RF/CA → testes → código",
     "Manter SDD auditável a cada release.",
     "Product Spec Writer", "QA", "§9 / §10", "F0.08 / F7.01", "Traceability matrix", "M", 16, "Sim"),
    ("F6", "Documentação", "Documentação Técnica", "Documentação",
     "Catálogo de ADRs (índice e status)",
     "Indexar decisões de arquitetura e plataforma.",
     "Arquiteto de Sistemas", "Arquiteto de Solução", "F1.*", "F1.*", "ADR index", "B", 6, "Parcial"),

    # ========== F7 — QA ==========
    ("F7", "QA", "Planejamento", "Testes de QA",
     "Plano de testes mapeado aos CA do PDR §9",
     "Estratégia pirâmide; entrada/saída de fases; riscos.",
     "QA", "Product Spec Writer", "PDR §9", "F0.08", "Plano de testes", "A", 24, "Sim"),
    ("F7", "QA", "Planejamento", "Testes de QA",
     "Matriz de dados de teste e personas AD (3 perfis + negativos)",
     "Massas por categoria; Obras completa/incompleta; multi-área.",
     "QA", "DevOps", "§2 / CA Segurança", "F2.09", "Dados de teste", "M", 16, "Sim"),
    ("F7", "QA", "Planejamento", "Testes de QA",
     "Critérios de entrada/saída UAT e regressão",
     "Alinhados ao DoD; bloqueadores vs menores.",
     "QA", "Tech Lead / PM", "F0.11 / §9", "F7.01", "Exit criteria QA/UAT", "B", 6, "Sim"),
    ("F7", "QA", "Testes Funcionais", "Testes de QA",
     "Executar CA — Abertura e protocolo",
     "RN-01/02; status Aberta; evidências.",
     "QA", "Desenvolvedor Backend", "CA Abertura", "F4.12 / F5.06", "Evidências CA Abertura", "M", 12, "Sim"),
    ("F7", "QA", "Testes Funcionais", "Testes de QA",
     "Executar CA — Roteamento e fila da área",
     "Área + visão GL; casos sem responsável cadastrado.",
     "QA", "Desenvolvedor Backend", "CA Roteamento", "F4.13 / F5.11", "Evidências CA Roteamento", "M", 12, "Sim"),
    ("F7", "QA", "Testes Funcionais", "Testes de QA",
     "Executar CA — Visibilidade GL (campos mínimos)",
     "Conferir EF-03 no detalhe.",
     "QA", "Desenvolvedor Frontend", "CA GL", "F5.14", "Evidências CA GL", "M", 12, "Sim"),
    ("F7", "QA", "Testes Funcionais", "Testes de QA",
     "Executar CA — WhatsApp (envio + histórico + falha)",
     "Sucesso/falha; amostrar retry/DLQ.",
     "QA", "Desenvolvedor Backend", "CA WhatsApp / RNF-05", "F4.30–F4.34", "Evidências CA WhatsApp", "A", 20, "Sim"),
    ("F7", "QA", "Testes Funcionais", "Testes de QA",
     "Executar CA — Obras (bloqueio, ajustes, reenvio, versão)",
     "Regressão crítica Manutenção → Obras.",
     "QA", "Desenvolvedor Frontend", "CA Obras / RN-09..12", "F4.22–F4.24 / F5.08–F5.09 / F5.15", "Evidências CA Obras", "A", 28, "Sim"),
    ("F7", "QA", "Testes Funcionais", "Testes de QA",
     "Executar CA — Histórico e Parametrização",
     "Nova subcategoria/WhatsApp sem mudança de código.",
     "QA", "Desenvolvedor Backend", "CA Histórico / CA Param", "F4.09 / F4.17 / F5.16", "Evidências CA Hist/Param", "A", 16, "Sim"),
    ("F7", "QA", "Testes Funcionais", "Testes de QA",
     "Testes exploratórios das jornadas (session-based)",
     "Além do roteiro; achar gaps de UX e edge cases.",
     "QA", "Business Analyst", "§2 / §4", "F7.04–F7.09", "Relatório exploratório", "M", 16, "Sim"),
    ("F7", "QA", "Testes de Segurança", "Testes de QA",
     "Testes RBAC/autenticação (matriz negativa)",
     "403 aprovar obra sem GL; redirect se não autenticado; IDOR entre áreas.",
     "QA", "Segurança da Informação", "CA Segurança / RN-04/05/10", "F4.03 / F5.02", "Relatório RBAC/IDOR", "A", 24, "Sim"),
    ("F7", "QA", "Testes de Segurança", "Testes de QA",
     "Testes de upload (tipo/tamanho) e exposição Blob",
     "RN-18 / RNF-06; tentativas de path traversal/MIME spoof.",
     "QA", "Segurança da Informação", "RN-18 / RNF-06", "F4.40 / F5.20", "Relatório anexos", "M", 12, "Sim"),
    ("F7", "QA", "Testes Não Funcionais", "Testes de QA",
     "Smoke/carga leve em listagens GL e filas (Hml)",
     "Baseline P95; sem meta de BI.",
     "QA", "DevOps", "RNF-01", "F2.04 / F5.14", "Relatório performance", "M", 16, "Parcial"),
    ("F7", "QA", "Testes Não Funcionais", "Testes de QA",
     "Testes de resiliência Service Bus / WhatsApp down",
     "Validar retry, DLQ e UX degradada.",
     "QA", "Desenvolvedor Backend", "RNF-05 / F1.21", "F4.34", "Relatório resiliência", "A", 16, "Sim"),
    ("F7", "QA", "Testes Não Funcionais", "Testes de QA",
     "Testes de compatibilidade de browsers suportados",
     "Chromium/Edge/Firefox/Safari conforme política do cliente.",
     "QA", "Desenvolvedor Frontend", "§7.4", "F5.23", "Relatório browsers", "B", 8, "Parcial"),
    ("F7", "QA", "Testes Não Funcionais", "Testes de QA",
     "Checklist de acessibilidade (amostra jornadas críticas)",
     "Validar F5.24; bugs priorizados.",
     "QA", "Desenvolvedor Frontend", "F5.24", "F5.24", "Relatório a11y", "M", 12, "Parcial"),
    ("F7", "QA", "Automação", "Testes de QA",
     "Automatizar regressão dos CA críticos no pipeline Hml",
     "Suite mínima no CD; relatório publicado.",
     "QA", "DevOps", "§9", "F7.01 / F5.25", "Automação regressão", "A", 32, "Sim"),
    ("F7", "QA", "Regressão", "Testes de QA",
     "Bateria regressão Obras + RBAC antes de cada release",
     "Obrigatório por AGENTS.md.",
     "QA", "Tech Lead / PM", "AGENTS.md / CA Obras / CA Segurança", "F7.08 / F7.11", "Checklist regressão", "M", 12, "Sim"),
    ("F7", "QA", "Gestão de Defects", "Testes de QA",
     "Processo de triagem de bugs (severidade × CA)",
     "Kanban de defects; definição de bloqueador de release.",
     "QA", "Tech Lead / PM", "F7.03", "F7.01", "Bug triage process", "B", 6, "Parcial"),

    # ========== F8 — HOMOLOGAÇÃO ==========
    ("F8", "Homologação", "UAT", "Homologação",
     "Preparar Hml (seeds, personas AD, templates WhatsApp)",
     "Dados das categorias §3.1; Obras com docs de exemplo.",
     "DevOps", "QA", "F2.04 / F3.08", "F2.04", "Hml pronto UAT", "M", 12, "Parcial"),
    ("F8", "Homologação", "UAT", "Homologação",
     "Roteiro de UAT por perfil de negócio",
     "Scripts Cessionário, GL/Administrador, Responsável da Área.",
     "QA", "Business Analyst", "§2 / §9", "F7.01", "Roteiro UAT", "M", 16, "Sim"),
    ("F8", "Homologação", "UAT", "Homologação",
     "Sessões de homologação com key users",
     "Executar roteiro; registrar bugs e decisões de negócio.",
     "Business Analyst", "QA", "§11", "F8.02", "Ata UAT + bugs", "A", 24, "Sim"),
    ("F8", "Homologação", "UAT", "Homologação",
     "Correção de defects UAT (backend)",
     "Priorizar bloqueadores de CA.",
     "Desenvolvedor Backend", "QA", "§9", "F8.03", "Fixes backend UAT", "A", 40, "Sim"),
    ("F8", "Homologação", "UAT", "Homologação",
     "Correção de defects UAT (frontend)",
     "Usabilidade e RBAC de telas.",
     "Desenvolvedor Frontend", "QA", "§9", "F8.03", "Fixes frontend UAT", "A", 32, "Sim"),
    ("F8", "Homologação", "UAT", "Homologação",
     "Re-teste e sign-off formal de homologação",
     "Aceite por perfil e por épico.",
     "Business Analyst", "Tech Lead / PM", "§9", "F8.04–F8.05", "Termo aceite Hml", "M", 12, "Sim"),
    ("F8", "Homologação", "Go-Live", "Homologação",
     "Checklist go-live Produção",
     "AD Prod, seeds, monitoramento, runbooks, rollback.",
     "DevOps", "Arquiteto de Solução", "RNF-01/04/07", "F2.05 / F6.02", "Checklist go-live", "A", 12, "Parcial"),
    ("F8", "Homologação", "Go-Live", "Homologação",
     "Deploy Produção + smoke tests pós-release",
     "Login AD, abertura, WhatsApp, aprovação Obras.",
     "DevOps", "QA", "§9", "F8.07", "Release Prod + smoke", "A", 16, "Sim"),
    ("F8", "Homologação", "Go-Live", "Homologação",
     "Hypercare pós go-live",
     "Incidentes, ajuste de alertas, war-room leve.",
     "Tech Lead / PM", "DevOps", "RNF-01", "F8.08", "Relatório hypercare", "M", 40, "Não"),
    ("F8", "Homologação", "Treinamento", "Homologação",
     "Treinamento operacional dos 3 perfis",
     "Hands-on em Hml com manuais.",
     "Business Analyst", "Product Spec Writer", "§2 / F6.04–F6.06", "F6.04–F6.06", "Treinamentos", "M", 16, "Sim"),
    ("F8", "Homologação", "Go-Live", "Homologação",
     "Plano de rollback e comunicação de release",
     "Stakeholders, janela, critérios de abort.",
     "Tech Lead / PM", "DevOps", "F8.07", "F8.07", "Comms + rollback plan", "B", 8, "Não"),

    # ========== F9 — SEGURANÇA ==========
    ("F9", "Segurança & Compliance", "Segurança", "Segurança",
     "Threat modeling (portal, APIs, uploads, filas)",
     "STRIDE; abuso de RBAC; ameaças a Blob e WhatsApp tokens.",
     "Segurança da Informação", "Arquiteto de Sistemas", "§7.1 / CA Segurança", "F1.16", "Threat model", "A", 20, "Sim"),
    ("F9", "Segurança & Compliance", "Segurança", "Segurança",
     "Revisão de secrets e Managed Identities (3 envs)",
     "Garantir RNF-04; sem keys em logs.",
     "Segurança da Informação", "DevOps", "RNF-04", "F2.05 / F2.14", "Relatório secrets", "M", 12, "Parcial"),
    ("F9", "Segurança & Compliance", "Segurança", "Segurança",
     "SCA contínuo + DAST leve / pentest pré go-live",
     "Corrigir críticos antes de Prod.",
     "Segurança da Informação", "QA", "CA Segurança", "F8.07 / F2.06", "Relatório pentest/scan", "A", 32, "Parcial"),
    ("F9", "Segurança & Compliance", "Segurança", "Segurança",
     "Revisão LGPD: logs, retenção, direitos do titular (mínimo v1)",
     "Alinhado a F0.06; o que está no escopo v1 vs backlog.",
     "Segurança da Informação", "Business Analyst", "F0.06", "F0.06", "Checklist LGPD v1", "M", 12, "Sim"),

    # ========== F10 — INTEGRAÇÕES ==========
    ("F10", "Integrações", "WhatsApp Provider", "Arquitetura de Solução",
     "Seleção/configuração WhatsApp Business API",
     "Conta, números teste/prod, limites, webhooks se houver (outbound-only v1).",
     "Arquiteto de Solução", "Business Analyst", "EF-04 / §1.2", "F0.03", "Conta WhatsApp", "A", 16, "Sim"),
    ("F10", "Integrações", "WhatsApp Provider", "Arquitetura de Solução",
     "PoC/spike envio WhatsApp (sandbox → Dev)",
     "Validar latência, templates e erros antes do adapter final.",
     "Desenvolvedor Backend", "Arquiteto de Solução", "EF-04", "F10.01", "PoC WhatsApp", "M", 16, "Parcial"),
    ("F10", "Integrações", "WhatsApp Provider", "Ambientes / DevOps",
     "Credenciais WhatsApp no Key Vault por ambiente",
     "Sem secrets no repositório.",
     "DevOps", "Desenvolvedor Backend", "RNF-04", "F10.01 / F2.03", "Secrets WhatsApp", "B", 4, "Não"),
    ("F10", "Integrações", "WhatsApp Provider", "Documentação",
     "Templates de mensagem e textos aprovados pelo negócio",
     "Criação, status, seguro; variáveis e tom de voz.",
     "Business Analyst", "Product Spec Writer", "RN-07", "F10.01", "Templates aprovados", "M", 12, "Sim"),
    ("F10", "Integrações", "WhatsApp Provider", "Testes de QA",
     "Homologação ponta a ponta das notificações WhatsApp",
     "Números reais de teste; evidências no histórico.",
     "QA", "Desenvolvedor Backend", "CA WhatsApp", "F4.31 / F10.04", "Evidências E2E WhatsApp", "M", 12, "Sim"),
]


def build() -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Tarefas"

    header_fill = PatternFill("solid", fgColor="1F4E79")
    header_font = Font(color="FFFFFF", bold=True, size=11)
    thin = Border(
        left=Side(style="thin", color="B0B0B0"),
        right=Side(style="thin", color="B0B0B0"),
        top=Side(style="thin", color="B0B0B0"),
        bottom=Side(style="thin", color="B0B0B0"),
    )
    wrap = Alignment(wrap_text=True, vertical="top")

    frente_fills = {
        "Análise de Negócio": "E2EFDA",
        "Documentação": "DDEBF7",
        "Gestão de Projeto": "FCE4D6",
        "Arquitetura de Solução": "FFF2CC",
        "Arquitetura de Sistemas": "FCE4D6",
        "Ambientes / DevOps": "E4DFEC",
        "Segurança": "F8CBAD",
        "DBA": "DDEBF7",
        "Back-end": "C6EFCE",
        "Front-end": "BDD7EE",
        "Testes de QA": "F4B183",
        "Homologação": "FFC7CE",
    }
    sdd_fills = {
        "Sim": PatternFill("solid", fgColor="C6EFCE"),
        "Parcial": PatternFill("solid", fgColor="FFF2CC"),
        "Não": PatternFill("solid", fgColor="F2F2F2"),
    }

    for col, h in enumerate(HEADERS, 1):
        cell = ws.cell(1, col, h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    phase_counters: dict[str, int] = {}
    rows_out: list[list] = []
    for t in TASKS:
        (
            fase_code, fase, epico, frente, tarefa, desc, executor, apoio,
            ref, deps, entregavel, complex_, horas, sdd,
        ) = t
        phase_counters[fase_code] = phase_counters.get(fase_code, 0) + 1
        tid = f"{fase_code}.{phase_counters[fase_code]:02d}"
        horas_sdd = estimativa_sdd_horas(horas, sdd, frente)
        delta = horas_sdd - horas  # negativo = economia com SDD
        rows_out.append([
            tid, fase, epico, frente, tarefa, desc, executor, apoio,
            ref, deps, entregavel, complex_,
            horas, horas_sdd, delta,
            round(horas / 8, 2), round(horas_sdd / 8, 2),
            sdd, "Não iniciada",
        ])

    # Índices: 12 pleno h, 13 sdd h, 14 delta, 15 dias pleno, 16 dias sdd, 17 class SDD, 18 status
    for r_idx, row in enumerate(rows_out, 2):
        frente = row[3]
        fill = PatternFill("solid", fgColor=frente_fills.get(frente, "FFFFFF"))
        for c_idx, val in enumerate(row, 1):
            cell = ws.cell(r_idx, c_idx, val)
            cell.border = thin
            cell.alignment = wrap
            if c_idx == 4:
                cell.fill = fill
            elif c_idx in (12, 13, 14, 15, 16):
                cell.alignment = Alignment(horizontal="center", vertical="top")
                if c_idx == 14 and isinstance(val, (int, float)) and val < 0:
                    cell.font = Font(color="006100")
            elif c_idx == 17:
                cell.fill = sdd_fills.get(val, PatternFill())
                cell.alignment = Alignment(horizontal="center", vertical="top")

    widths = [10, 22, 28, 22, 46, 50, 24, 24, 26, 20, 26, 11, 14, 14, 12, 11, 11, 14, 13]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[1].height = 40
    last_col = get_column_letter(len(HEADERS))
    ws.auto_filter.ref = f"A1:{last_col}{len(rows_out) + 1}"
    ws.freeze_panes = "A2"

    dv_status = DataValidation(
        type="list",
        formula1='"Não iniciada,Em andamento,Bloqueada,Concluída,Cancelada"',
        allow_blank=True,
    )
    ws.add_data_validation(dv_status)
    dv_status.add(f"S2:S{len(rows_out) + 1}")

    dv_sdd = DataValidation(
        type="list",
        formula1='"Sim,Parcial,Não"',
        allow_blank=False,
    )
    ws.add_data_validation(dv_sdd)
    dv_sdd.add(f"R2:R{len(rows_out) + 1}")

    total = len(rows_out)
    total_h = sum(r[12] for r in rows_out)
    total_sdd = sum(r[13] for r in rows_out)
    economia = total_h - total_sdd

    # ----- Resumo por Frente -----
    ws2 = wb.create_sheet("Resumo por Frente")
    for col, h in enumerate(
        ["Frente", "Qtd.", "Horas Pleno", "Horas SDD", "Economia (h)", "Dias Pleno", "Dias SDD"], 1
    ):
        cell = ws2.cell(1, col, h)
        cell.fill = header_fill
        cell.font = header_font

    hours_by_frente: dict[str, int] = defaultdict(int)
    sdd_by_frente: dict[str, int] = defaultdict(int)
    count_by_frente: Counter = Counter()
    for r in rows_out:
        hours_by_frente[r[3]] += r[12]
        sdd_by_frente[r[3]] += r[13]
        count_by_frente[r[3]] += 1

    for i, (frente, qtd) in enumerate(
        sorted(count_by_frente.items(), key=lambda x: (-hours_by_frente[x[0]], x[0])), 2
    ):
        h = hours_by_frente[frente]
        hs = sdd_by_frente[frente]
        ws2.cell(i, 1, frente).fill = PatternFill("solid", fgColor=frente_fills.get(frente, "FFFFFF"))
        ws2.cell(i, 2, qtd)
        ws2.cell(i, 3, h)
        ws2.cell(i, 4, hs)
        ws2.cell(i, 5, h - hs)
        ws2.cell(i, 6, round(h / 8, 1))
        ws2.cell(i, 7, round(hs / 8, 1))
    end = len(count_by_frente) + 2
    ws2.cell(end, 1, "TOTAL").font = Font(bold=True)
    ws2.cell(end, 2, total).font = Font(bold=True)
    ws2.cell(end, 3, total_h).font = Font(bold=True)
    ws2.cell(end, 4, total_sdd).font = Font(bold=True)
    ws2.cell(end, 5, economia).font = Font(bold=True, color="006100")
    ws2.cell(end, 6, round(total_h / 8, 1)).font = Font(bold=True)
    ws2.cell(end, 7, round(total_sdd / 8, 1)).font = Font(bold=True)
    for col, w in enumerate([28, 8, 12, 12, 12, 11, 11], 1):
        ws2.column_dimensions[get_column_letter(col)].width = w

    # ----- Resumo por Perfil -----
    ws3 = wb.create_sheet("Resumo por Perfil Executor")
    for col, h in enumerate(
        ["Perfil Executor", "Qtd.", "Horas Pleno", "Horas SDD", "Economia (h)", "Dias SDD", "Qtd. Apoio"], 1
    ):
        cell = ws3.cell(1, col, h)
        cell.fill = header_fill
        cell.font = header_font

    exec_h: dict[str, int] = defaultdict(int)
    exec_sdd: dict[str, int] = defaultdict(int)
    exec_n: Counter = Counter()
    apoio_n: Counter = Counter()
    for r in rows_out:
        exec_h[r[6]] += r[12]
        exec_sdd[r[6]] += r[13]
        exec_n[r[6]] += 1
        apoio_n[r[7]] += 1
    for i, perfil in enumerate(sorted(exec_h, key=lambda p: -exec_h[p]), 2):
        h = exec_h[perfil]
        hs = exec_sdd[perfil]
        ws3.cell(i, 1, perfil)
        ws3.cell(i, 2, exec_n[perfil])
        ws3.cell(i, 3, h)
        ws3.cell(i, 4, hs)
        ws3.cell(i, 5, h - hs)
        ws3.cell(i, 6, round(hs / 8, 1))
        ws3.cell(i, 7, apoio_n.get(perfil, 0))
    for col, w in enumerate([28, 8, 12, 12, 12, 11, 12], 1):
        ws3.column_dimensions[get_column_letter(col)].width = w

    # ----- Comparativo Pleno vs SDD -----
    ws_sdd = wb.create_sheet("Comparativo Pleno vs SDD")
    for col, h in enumerate(["Métrica", "Valor"], 1):
        cell = ws_sdd.cell(1, col, h)
        cell.fill = header_fill
        cell.font = header_font
    comparativo = [
        ("Total de tarefas", total),
        ("Estimativa Pleno (h)", total_h),
        ("Estimativa Pleno (dias-pessoa)", round(total_h / 8, 1)),
        ("Estimativa SDD — pleno experiente em SDD (h)", total_sdd),
        ("Estimativa SDD (dias-pessoa)", round(total_sdd / 8, 1)),
        ("Economia com SDD (h)", economia),
        ("Economia com SDD (%)", round(100 * economia / total_h, 1)),
        ("Premissa SDD", "Engenheiro pleno fluente em Spec-Driven (PDR/RF/CA/ADR → código → CA)"),
    ]
    for i, (k, v) in enumerate(comparativo, 2):
        ws_sdd.cell(i, 1, k).font = Font(bold=True)
        ws_sdd.cell(i, 2, v)
    ws_sdd.column_dimensions["A"].width = 52
    ws_sdd.column_dimensions["B"].width = 18

    # classificação
    ws_sdd.cell(12, 1, "Classificação SDD")
    ws_sdd.cell(12, 2, "Qtd. tarefas")
    ws_sdd.cell(12, 3, "Horas Pleno")
    ws_sdd.cell(12, 4, "Horas SDD")
    for col in range(1, 5):
        ws_sdd.cell(12, col).fill = header_fill
        ws_sdd.cell(12, col).font = header_font

    class_pleno: dict[str, int] = defaultdict(int)
    class_sdd: dict[str, int] = defaultdict(int)
    class_n: Counter = Counter()
    for r in rows_out:
        class_pleno[r[17]] += r[12]
        class_sdd[r[17]] += r[13]
        class_n[r[17]] += 1
    for i, label in enumerate(["Sim", "Parcial", "Não"], 13):
        ws_sdd.cell(i, 1, label).fill = sdd_fills[label]
        ws_sdd.cell(i, 2, class_n[label])
        ws_sdd.cell(i, 3, class_pleno[label])
        ws_sdd.cell(i, 4, class_sdd[label])
    ws_sdd.column_dimensions["C"].width = 14
    ws_sdd.column_dimensions["D"].width = 12

    # Fatores
    ws_sdd.cell(17, 1, "Fatores usados (Estimativa SDD ÷ Estimativa Pleno)")
    ws_sdd.cell(17, 1).font = Font(bold=True, size=12)
    fatores = [
        ("Back-end / Front-end / DBA + classificação Sim", "× 0,78"),
        ("Testes de QA + Sim", "× 0,82"),
        ("Homologação + Sim", "× 0,72"),
        ("Análise de Negócio / Documentação + Sim", "× 0,88"),
        ("Arquitetura + Sim", "× 0,85"),
        ("Arquitetura + Parcial", "× 0,90"),
        ("DevOps / Segurança / Gestão + Parcial", "× 0,93"),
        ("Demais Parcial", "× 0,90"),
        ("Classificação Não (operacional)", "× 1,00 (sem ganho)"),
    ]
    ws_sdd.cell(18, 1, "Cenário")
    ws_sdd.cell(18, 2, "Fator")
    ws_sdd.cell(18, 1).fill = header_fill
    ws_sdd.cell(18, 2).fill = header_fill
    ws_sdd.cell(18, 1).font = header_font
    ws_sdd.cell(18, 2).font = header_font
    for i, (cen, fat) in enumerate(fatores, 19):
        ws_sdd.cell(i, 1, cen)
        ws_sdd.cell(i, 2, fat)

    # ----- Resumo por Fase -----
    ws_fase = wb.create_sheet("Resumo por Fase")
    for col, h in enumerate(["Fase", "Qtd.", "Horas Pleno", "Horas SDD", "Economia (h)", "Dias SDD"], 1):
        cell = ws_fase.cell(1, col, h)
        cell.fill = header_fill
        cell.font = header_font
    fase_h: dict[str, int] = defaultdict(int)
    fase_sdd: dict[str, int] = defaultdict(int)
    fase_n: Counter = Counter()
    fase_order: list[str] = []
    for r in rows_out:
        if r[1] not in fase_h:
            fase_order.append(r[1])
        fase_h[r[1]] += r[12]
        fase_sdd[r[1]] += r[13]
        fase_n[r[1]] += 1
    for i, fase in enumerate(fase_order, 2):
        ws_fase.cell(i, 1, fase)
        ws_fase.cell(i, 2, fase_n[fase])
        ws_fase.cell(i, 3, fase_h[fase])
        ws_fase.cell(i, 4, fase_sdd[fase])
        ws_fase.cell(i, 5, fase_h[fase] - fase_sdd[fase])
        ws_fase.cell(i, 6, round(fase_sdd[fase] / 8, 1))
    end = len(fase_order) + 2
    ws_fase.cell(end, 1, "TOTAL").font = Font(bold=True)
    ws_fase.cell(end, 2, total).font = Font(bold=True)
    ws_fase.cell(end, 3, total_h).font = Font(bold=True)
    ws_fase.cell(end, 4, total_sdd).font = Font(bold=True)
    ws_fase.cell(end, 5, economia).font = Font(bold=True, color="006100")
    ws_fase.cell(end, 6, round(total_sdd / 8, 1)).font = Font(bold=True)
    for col, w in enumerate([36, 8, 12, 12, 12, 11], 1):
        ws_fase.column_dimensions[get_column_letter(col)].width = w

    # ----- Legenda -----
    ws4 = wb.create_sheet("Legenda e Premissas")
    legend = [
        ("Produto", "Sistema de Gestão de Demandas (GBL)"),
        ("Unidade", "Todas as estimativas estão em HORAS de esforço (nível PLENO)"),
        ("Estimativa Pleno (h)", "Colaborador pleno no papel, sem pressupor fluência em Spec-Driven Development"),
        ("Estimativa SDD (h)", "Mesma tarefa feita por engenheiro pleno EXPERIENTE em SDD (spec → código → CA)"),
        ("Delta SDD (h)", "Estimativa SDD − Estimativa Pleno (negativo = economia de esforço)"),
        ("Dias Pleno / Dias SDD", "Horas ÷ 8 (dias-pessoa; não é prazo de calendário)"),
        ("Classificação SDD", "Sim = guiada por PDR/RF/CA; Parcial = NFR/ADR; Não = operacional puro"),
        ("O que inclui", "Análise da tarefa + implementação + testes unitários do próprio executor"),
        ("O que exclui", "Espera por aprovações, reuniões de status genéricas, férias, retrabalho ilimitado além da faixa"),
        ("Por que SDD reduz horas", "Menos ambiguidade, menos rediscovery, CA testáveis, menos defeitos em UAT"),
        ("Calendário", "Esforço ≠ prazo: paralelizar BE/FE/DevOps reduz elapsed time"),
        ("Perfis de negócio (portal)", "Cessionário | GL / Administrador | Responsável da Área"),
        ("Fora de escopo v1", "App nativo | ERP | Chat WhatsApp bidirecional | BI avançado"),
    ]
    ws4["A1"] = "Item"
    ws4["B1"] = "Descrição"
    ws4["A1"].fill = header_fill
    ws4["B1"].fill = header_fill
    ws4["A1"].font = header_font
    ws4["B1"].font = header_font
    for i, (k, v) in enumerate(legend, 2):
        ws4.cell(i, 1, k).font = Font(bold=True)
        ws4.cell(i, 2, v).alignment = wrap
    ws4.column_dimensions["A"].width = 28
    ws4.column_dimensions["B"].width = 110

    # ----- Catálogo perfis -----
    ws5 = wb.create_sheet("Catálogo de Perfis")
    ws5["A1"] = "Perfil técnico (executor)"
    ws5["B1"] = "Responsabilidades típicas"
    for col in range(1, 3):
        ws5.cell(1, col).fill = header_fill
        ws5.cell(1, col).font = header_font
    catalog = [
        ("Business Analyst", "Requisitos, workshops, RACI, LGPD funcional, UAT, treinamento"),
        ("Product Spec Writer", "PDR, RF/CA, manuais, rastreabilidade SDD"),
        ("Arquiteto de Solução", "Azure, AD, filas, Blob, KV, rede, FinOps, WhatsApp provider"),
        ("Arquiteto de Sistemas", "Bounded contexts, hexagonal, REST/eventos, Clean Code, ADRs"),
        ("DBA", "Modelagem SQL por contexto, migrations, seeds, índices, mascaramento"),
        ("Desenvolvedor Backend", "Microsserviços .NET, Outbox, Bus, RBAC APIs, BFF, testes BE"),
        ("Desenvolvedor Frontend", "Portal React, MSAL, jornadas dos 3 perfis, a11y, e2e"),
        ("DevOps", "IaC, Dev/Hml/Prod, CI/CD, observabilidade, DR"),
        ("QA", "Plano CA §9, segurança funcional, NFR, automação, regressão Obras/RBAC"),
        ("Segurança da Informação", "Threat model, hardening, secrets, pentest, LGPD técnica"),
        ("Tech Lead / PM", "Roadmap, DoD, riscos, hypercare, onboarding"),
    ]
    for i, (p, d) in enumerate(catalog, 2):
        ws5.cell(i, 1, p)
        ws5.cell(i, 2, d).alignment = wrap
    ws5.column_dimensions["A"].width = 28
    ws5.column_dimensions["B"].width = 90

    # ----- Módulos -----
    ws6 = wb.create_sheet("Módulos do Sistema")
    for col, h in enumerate(["Módulo / Contexto", "Escopo resumido (PDR)", "Épicos / RN"], 1):
        cell = ws6.cell(1, col, h)
        cell.fill = header_fill
        cell.font = header_font
    modules = [
        ("Identity / Access", "Azure AD OIDC, JWT, claims → 3 perfis", "RN-17; CA Segurança"),
        ("Demandas", "Abertura, protocolo, roteamento, status, histórico, anexos", "EF-01/02/03/06; RN-01..05,15,18"),
        ("Obras / Documentos", "Formulário Obras, Projeto/ART/Seguro/Cronograma, aprovação GL", "EF-05; RN-09..14"),
        ("Notificações", "Eventos, WhatsApp outbound, sucesso/falha", "EF-04; RN-06/07; RNF-05"),
        ("Parametrização", "Categorias, responsáveis, WhatsApp, prazos, docs, fluxos", "EF-07; RN-16; RNF-03"),
        ("BFF / API Gateway", "Agregação para o portal React", "§7.2 / §7.4"),
        ("Portal React", "Jornadas por perfil + MSAL", "§7.4; §2"),
        ("Plataforma Azure", "SQL, Service Bus, Blob, Key Vault, Insights, ambientes", "§7; RNF-01..07"),
    ]
    for i, row in enumerate(modules, 2):
        for c, v in enumerate(row, 1):
            ws6.cell(i, c, v).alignment = wrap
    ws6.column_dimensions["A"].width = 26
    ws6.column_dimensions["B"].width = 70
    ws6.column_dimensions["C"].width = 40

    OUT.parent.mkdir(parents=True, exist_ok=True)
    try:
        wb.save(OUT)
        saved = OUT
    except PermissionError:
        wb.save(OUT_FALLBACK)
        saved = OUT_FALLBACK
        print(f"AVISO: '{OUT.name}' está aberto/bloqueado. Salvando cópia revisada.")

    print(f"Gerado: {saved}")
    print(f"Total tarefas: {total}")
    print(f"Estimativa Pleno: {total_h} h (~{total_h/8:.1f} dias-pessoa)")
    print(f"Estimativa SDD (pleno experiente SDD): {total_sdd} h (~{total_sdd/8:.1f} dias-pessoa)")
    print(f"Economia SDD: {economia} h ({100*economia/total_h:.1f}%)")
    print("Por frente (Pleno -> SDD):")
    for frente, _ in sorted(count_by_frente.items(), key=lambda x: -hours_by_frente[x[0]]):
        print(
            f"  {frente}: {count_by_frente[frente]} tar. | "
            f"{hours_by_frente[frente]} h -> {sdd_by_frente[frente]} h"
        )


if __name__ == "__main__":
    build()
