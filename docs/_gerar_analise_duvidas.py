# -*- coding: utf-8 -*-
"""Gera docs/Analise-Funcional-Pontos-Atencao.docx — dúvidas de negócio GBL Demandas."""
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path(__file__).resolve().parent / "Analise-Funcional-Pontos-Atencao.docx"


def set_run_font(run, size=11, bold=False, color=None):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = color


def add_heading_styled(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        set_run_font(run, size=16 if level == 1 else 13, bold=True)
    return p


def add_para(doc, text, bold=False, italic=False, size=11):
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)
    run.italic = italic
    p.paragraph_format.space_after = Pt(6)
    return p


def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style="List Bullet")
    if bold_prefix:
        r1 = p.add_run(bold_prefix)
        set_run_font(r1, bold=True)
        r2 = p.add_run(text)
        set_run_font(r2)
    else:
        r = p.add_run(text)
        set_run_font(r)
    return p


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ""
        p = hdr[i].paragraphs[0]
        run = p.add_run(h)
        set_run_font(run, bold=True, size=10)
    for ri, row in enumerate(rows):
        cells = table.rows[ri + 1].cells
        for ci, val in enumerate(row):
            cells[ci].text = ""
            p = cells[ci].paragraphs[0]
            run = p.add_run(str(val))
            set_run_font(run, size=10)
    doc.add_paragraph()
    return table


def main():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("ANÁLISE FUNCIONAL")
    set_run_font(r, size=18, bold=True, color=RGBColor(0x1F, 0x4E, 0x79))

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run(
        "Pontos de Atenção, Dúvidas de Negócio, Regras e Ciclo de Vida"
    )
    set_run_font(r, size=12, bold=True)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = meta.add_run(
        "Sistema de Gestão de Demandas (GBL)\n"
        "Fonte: Fluxo de Demandas.docx  |  Spec: PDR.md  |  Stack: .NET + React + Azure\n"
        "Perfis (somente): Cessionário · GL / Administrador · Responsável da Área"
    )
    set_run_font(r, size=10, color=RGBColor(0x59, 0x59, 0x59))
    doc.add_paragraph()

    # --- 1. Pontos de atenção ---
    add_heading_styled(doc, "1. Pontos de atenção", 1)

    add_heading_styled(doc, "1.1 Taxonomia vs fluxo de Manutenção/Obras", 2)
    add_para(
        doc,
        "Fato do documento: a seção 3 lista sob Manutenção apenas Refrigeração, "
        "Elétrica e Civil; as seções 6–9 tratam Obras como ramo próprio com "
        "formulário e aprovação.",
    )
    add_para(
        doc,
        "Interpretação: Obras deve ser subcategoria oficial de Manutenção, "
        "ainda que omitida na taxonomia textual da seção 3.",
        italic=True,
    )
    add_para(
        doc,
        "Risco: desenvolvimento ou parametrização omitirem Obras como "
        "subcategoria — divergência com o PDR §3 e §6–9.",
    )

    add_heading_styled(doc, "1.2 Civil versus Obras", 2)
    add_para(
        doc,
        "Fato: Civil cobre reparos, pintura, hidráulica e infraestrutura; "
        "Obras exige Projeto, ART, Seguro e Cronograma + gate de aprovação do GL.",
    )
    add_para(
        doc,
        "Atenção: o critério de fronteira entre “serviço civil” e “obra” não "
        "está explícito — impacta formulário, SLA, notificação e aprovação.",
    )

    add_heading_styled(doc, "1.3 Visibilidade e ownership", 2)
    add_para(
        doc,
        "GL vê todas as demandas; Responsável da Área vê só a sua área; "
        "Cessionário vê as próprias. O documento não detalha se o Responsável "
        "pode transferir demanda entre áreas ou se só o GL redistribui.",
    )

    add_heading_styled(doc, "1.4 Parametrização (seção 14)", 2)
    add_para(
        doc,
        "O software deve ser parametrizável (categorias, WhatsApp, documentos, "
        "prazos, status, aprovação). “Alterar fluxos de aprovação” sem motor de "
        "workflow pode virar escopo infinito — delimitar configuração vs. customização.",
    )

    add_heading_styled(doc, "1.5 Notificações WhatsApp", 2)
    add_para(
        doc,
        "Canal outbound está claro; não há especificação de templates, opt-in, "
        "falha de entrega, retry ou resposta do responsável pelo WhatsApp. "
        "GL deve manter visibilidade da comunicação — exige registro no sistema, "
        "não apenas mensagem externa.",
    )

    add_heading_styled(doc, "1.6 Identidade Azure AD", 2)
    add_para(
        doc,
        "Login do portal via Azure AD (Entra ID). O mapeamento de grupos AD → "
        "os três perfis precisa ser definido com o cliente (quem é Cessionário "
        "no diretório; um usuário pode ter mais de um perfil?).",
    )

    # --- 2. Dúvidas (núcleo do pedido) ---
    add_heading_styled(doc, "2. Dúvidas de negócio (workshop)", 1)
    add_para(
        doc,
        "Perguntas priorizadas para validação com o cliente. Cada item separa "
        "fato / interpretação / pergunta, conforme análise Spec-Driven.",
    )

    duvidas = [
        (
            "Q-01",
            "Alta",
            "Ciclo de vida",
            "Seção 10 lista status; não define quem move cada transição.",
            "Sistema pode automatizar Aberta→Recebida; execução fica com Responsável; GL sobrescreve.",
            "Quem pode alterar cada status (sistema automático × Responsável da Área × GL / Administrador)?",
        ),
        (
            "Q-02",
            "Alta",
            "SLA / prazo",
            "Documento cita controle de prazos e GL acompanha prazos.",
            "Prazos seriam parametrizáveis por categoria (RN-16).",
            "Existe SLA/prazo padrão por categoria/subcategoria? Quem define e quem pode estender?",
        ),
        (
            "Q-03",
            "Alta",
            "Cancelamento",
            "Status Cancelada existe; perfis não dizem se Cessionário cancela.",
            "Cancelamento pelo Cessionário só em status iniciais, com parâmetro.",
            "Cessionário pode cancelar demanda? Em quais status?",
        ),
        (
            "Q-04",
            "Alta",
            "Comunicação",
            "Há “comunicação entre Cessionário, GL e áreas” e WhatsApp outbound.",
            "Comentários in-app seriam o canal oficial; WhatsApp só alerta.",
            "Há comunicação in-app (comentários/mensagens) além do WhatsApp, ou o WhatsApp é só alerta?",
        ),
        (
            "Q-05",
            "Média",
            "WhatsApp",
            "RN-07 exige envio e registro; não trata falha.",
            "Falha não bloqueia demanda; retry + DLQ + registro no histórico.",
            "Falha no WhatsApp bloqueia o fluxo da demanda ou apenas registra erro com retry?",
        ),
        (
            "Q-06",
            "Alta",
            "Multi-unidade",
            "Campos local/loja/unidade; login AD único.",
            "Um login pode representar várias lojas/cessionários com seletor de contexto.",
            "Um usuário AD pode representar múltiplas lojas/unidades/cessionários? Como escolhe o contexto?",
        ),
        (
            "Q-07",
            "Alta",
            "Obras",
            "Seções 8–9 exigem Projeto + ART + Seguro + Cronograma no envio.",
            "Os quatro docs são gate obrigatório no primeiro envio para análise.",
            "Em Obras, os quatro documentos são sempre obrigatórios no primeiro envio, ou algum pode ser complementar depois?",
        ),
        (
            "Q-08",
            "Média",
            "Obras / versão",
            "Projeto controla versão; reenvio após ajuste não detalha escopo.",
            "Sobe versão só do documento reprovado; demais permanecem.",
            "Reenvio após ajuste: sobe versão de todos os docs ou só do que foi reprovado/ajustado?",
        ),
        (
            "Q-09",
            "Alta",
            "Encerramento",
            "Fluxo termina em Encerrada; Responsável “conclui”; GL acompanha.",
            "Concluída = operacional; Encerrada = formal pelo GL.",
            "Quem encerra a demanda após Concluída — só GL / Administrador?",
        ),
        (
            "Q-10",
            "Média",
            "Responsáveis",
            "WhatsApp(s) por categoria; “gerenciar responsáveis”.",
            "Responsável pode ser pessoa ou grupo; vários WhatsApps por categoria.",
            "Responsável da Área é pessoa ou fila/grupo? Podem existir vários WhatsApps por categoria?",
        ),
        (
            "Q-11",
            "Alta",
            "Aprovação",
            "Aprovação/reprovação detalhada só em Obras; GL “aprovar/reprovar” no perfil.",
            "Gate de aprovação GL só para Obras na v1; demais categorias sem gate.",
            "GL aprova só Obras ou outras categorias também podem ter gate de aprovação?",
        ),
        (
            "Q-12",
            "Média",
            "Reclassificação",
            "Roteamento automático por categoria; erro de classificação não tratado.",
            "GL reclassifica com recálculo de responsável e histórico.",
            "Como tratar demanda aberta na categoria errada — reclassificar ou cancelar/reabrir?",
        ),
        (
            "Q-13",
            "Média",
            "Civil × Obras",
            "Civil e Obras coexistentes sob Manutenção sem regra de fronteira.",
            "Critério por valor, tipo de intervenção ou decisão do Cessionário/GL.",
            "Qual o critério objetivo que separa Manutenção → Civil de Manutenção → Obras?",
        ),
        (
            "Q-14",
            "Média",
            "Transferência",
            "Ownership por área; redistribuição não descrita.",
            "Só GL redistribui entre áreas.",
            "Responsável da Área pode transferir demanda para outra área, ou apenas o GL?",
        ),
        (
            "Q-15",
            "Baixa",
            "Abertura pelo GL",
            "Perfis: abertura é do Cessionário; GL não está explícito como solicitante.",
            "v1: só Cessionário abre; GL em nome de cessionário fica fora.",
            "GL / Administrador pode abrir demanda em nome de um Cessionário?",
        ),
        (
            "Q-16",
            "Média",
            "Azure AD",
            "Login Azure AD no PDR; organograma não mapeia grupos.",
            "Grupos AD 1:1 com os três perfis; Cessionário via grupo ou atributo de loja.",
            "Como os grupos/atributos do Azure AD mapeiam para Cessionário, GL / Administrador e Responsável da Área?",
        ),
        (
            "Q-17",
            "Baixa",
            "Seguro de obra",
            "Alertas de validade da apólice (seção 8 / RN-13).",
            "Alerta X dias antes do vencimento para GL e Responsável.",
            "Com quantos dias de antecedência o alerta de vencimento do seguro deve disparar? Para quem?",
        ),
        (
            "Q-18",
            "Baixa",
            "Parametrização",
            "Seção 14 permite criar status e alterar fluxos de aprovação.",
            "v1: parametrizar categorias, docs, prazos e WhatsApp; fluxos avançados em fase 2.",
            "Na v1, o GL pode criar novos status e fluxos de aprovação livres, ou só parametrizar dentro do modelo fixo do PDR?",
        ),
        (
            "Q-19",
            "Alta",
            "Tarefas da cadeia",
            "O documento prevê documentos obrigatórios, anexos/evidências, decisões, ajustes e acompanhamento, mas não especifica essas tarefas nó a nó para cada tipo.",
            "GL configura cada nó com campos e ações existentes (por exemplo, upload de foto como evidência), sem criar código ou ações arbitrárias.",
            "A parametrização deve limitar-se às tarefas e ações disponíveis no sistema? Uma alteração deve afetar apenas novas demandas ou também as que estão em andamento?",
        ),
    ]

    add_table(
        doc,
        ["ID", "Prioridade", "Tema", "Pergunta ao cliente"],
        [[d[0], d[1], d[2], d[5]] for d in duvidas],
    )

    add_heading_styled(doc, "2.1 Detalhamento (fato · interpretação · pergunta)", 2)
    for d in duvidas:
        add_para(doc, f"{d[0]} — {d[2]} ({d[1]})", bold=True)
        add_bullet(doc, d[3], bold_prefix="Fato: ")
        add_bullet(doc, d[4], bold_prefix="Interpretação: ")
        add_bullet(doc, d[5], bold_prefix="Pergunta: ")

    add_heading_styled(doc, "2.2 Condução sugerida (provisória até validação)", 2)
    add_bullet(doc, "Cessionário.", bold_prefix="Abertura: ")
    add_bullet(
        doc,
        "Responsável da Área (GL pode atuar em qualquer demanda).",
        bold_prefix="Recebimento / execução / conclusão operacional: ",
    )
    add_bullet(
        doc,
        "exclusivamente GL / Administrador.",
        bold_prefix="Aprovação / reprovação / ajustes de Obras: ",
    )
    add_bullet(
        doc,
        "GL / Administrador.",
        bold_prefix="Parametrização e cadastro de WhatsApp: ",
    )
    add_bullet(
        doc,
        "GL / Administrador (recomendação até Q-09).",
        bold_prefix="Encerramento formal: ",
    )

    # --- 3. RN ---
    add_heading_styled(doc, "3. Regras de negócio consolidadas (PDR)", 1)
    rns = [
        ("RN-01", "Protocolo único gerado no envio da demanda."),
        ("RN-02", "Categoria obrigatória; Manutenção exige subcategoria."),
        ("RN-03", "Direcionamento automático à área responsável parametrizada."),
        ("RN-04", "GL visualiza todas as demandas."),
        ("RN-05", "Responsável da Área visualiza apenas demandas da sua área."),
        ("RN-06", "WhatsApp(s) cadastrado(s) por categoria/subcategoria."),
        (
            "RN-07",
            "Na criação: identificar responsável, notificar WhatsApp, disponibilizar acesso e registrar envio.",
        ),
        ("RN-08", "GL mantém visibilidade da comunicação e andamento."),
        (
            "RN-09",
            "Obras exige formulário específico + Projeto, ART, Seguro e Cronograma.",
        ),
        ("RN-10", "Aprovar/reprovar/solicitar ajustes de Obras é exclusivo do GL."),
        ("RN-11", "Ajuste/reprovação registra motivo; Cessionário pode reenviar."),
        ("RN-12", "Projeto controla versão, data, status e observações do GL."),
        ("RN-13", "Seguro permite alertas de validade."),
        ("RN-14", "Cronograma permite acompanhamento e identificação de atrasos."),
        ("RN-15", "Histórico completo e rastreável de alterações."),
        (
            "RN-16",
            "Categorias, responsáveis, WhatsApp, docs, prazos, status e fluxos parametrizáveis pelo GL.",
        ),
        ("RN-17", "Autenticação do portal via Azure AD."),
        ("RN-18", "Anexos validados e armazenados de forma segura."),
    ]
    add_table(doc, ["ID", "Regra"], rns)

    # --- 4. Ciclo de vida ---
    add_heading_styled(doc, "4. Ciclo de vida da demanda", 1)
    add_heading_styled(doc, "4.1 Status padronizados", 2)
    add_para(
        doc,
        "Aberta → Recebida → Em análise → Aguardando informação/documentação → "
        "Aprovada → Em execução → Aguardando conclusão → Concluída → Encerrada",
    )
    add_para(doc, "Terminais negativos: Reprovada | Cancelada")

    add_heading_styled(doc, "4.2 Fluxo principal (não-Obras)", 2)
    for step in [
        "Login Azure AD (Cessionário)",
        "Abertura e seleção de categoria",
        "Preenchimento e envio → protocolo",
        "Roteamento à área + visibilidade GL",
        "Evento em fila Azure → WhatsApp dos responsáveis",
        "Atendimento / atualização de status",
        "Conclusão → histórico → encerramento",
    ]:
        add_bullet(doc, step)

    add_heading_styled(doc, "4.3 Fluxo Obras", 2)
    for step in [
        "Manutenção → Obras → formulário + anexos obrigatórios",
        "Envio para análise",
        "GL: Aprova | Reprova | Solicita ajustes",
        "Se ajustes: motivo → correção Cessionário → reanálise",
        "Se aprovado: execução + cronograma → conclusão → encerramento",
    ]:
        add_bullet(doc, step)

    add_heading_styled(doc, "4.4 Matriz de ações por perfil", 2)
    add_table(
        doc,
        ["Ação", "Cessionário", "Responsável da Área", "GL / Administrador"],
        [
            ("Abrir demanda", "Sim", "—", "Sim*"),
            ("Ver próprias / da área / todas", "Próprias", "Área", "Todas"),
            ("Atualizar status operacional", "—", "Sim", "Sim"),
            ("Aprovar Obras", "—", "—", "Sim"),
            ("Solicitar documentos / ajustes", "—", "Limitado", "Sim"),
            ("Anexar evidências", "Sim", "Sim", "Sim"),
            ("Cadastrar WhatsApp / parâmetros", "—", "—", "Sim"),
            ("Encerrar demanda", "—", "A confirmar (Q-09)", "Sim (sugestão)"),
        ],
    )
    add_para(
        doc,
        "* Abertura pelo GL em nome de cessionário: fora do texto atual — ver Q-15.",
        italic=True,
        size=10,
    )

    add_heading_styled(doc, "4.5 Status do documento Projeto (Obras)", 2)
    add_para(
        doc,
        "Aguardando análise → Em análise → Aprovado | Reprovado / Necessita ajustes",
    )

    # --- 5. Implicações ---
    add_heading_styled(doc, "5. Implicações para condução da solução", 1)
    add_para(
        doc,
        "Sem prescrever implementação detalhada — apenas implicações de produto "
        "para arquitetura Azure / AD / filas:",
    )
    add_bullet(doc, "Arquitetura hexagonal por microsserviço (.NET).")
    add_bullet(
        doc,
        "SQL Server para consistência transacional do ciclo de vida e documentos.",
    )
    add_bullet(
        doc,
        "Azure Service Bus/Queue para DemandaCriada, mudanças de status, "
        "aprovação de obra e disparo WhatsApp.",
    )
    add_bullet(
        doc,
        "Portal React com MSAL (Azure AD); RBAC nos três perfis do documento.",
    )
    add_bullet(
        doc,
        "Outbox + consumidores idempotentes + DLQ para falhas de notificação (ligado a Q-05).",
    )
    add_bullet(
        doc,
        "Storage de anexos em Azure Blob; metadados e versões no SQL Server (ligado a Q-08).",
    )

    # --- 6. Próximos passos ---
    add_heading_styled(doc, "6. Próximos passos recomendados", 1)
    add_bullet(doc, "Workshop de 1–2h para responder Q-01 a Q-18 (priorizar Alta).")
    add_bullet(doc, "Congelar taxonomia (incluir Obras) e matriz de transição de status.")
    add_bullet(doc, "Validar mapeamento AD → perfis com TI do cliente (Q-16).")
    add_bullet(
        doc,
        "Atualizar PDR.md com decisões; só então iniciar implementação SDD.",
    )

    foot = doc.add_paragraph()
    r = foot.add_run(
        "Documento gerado para apoio Spec-Driven e workshop com o cliente. "
        "Não substitui o PDR.md como fonte de aceite."
    )
    set_run_font(r, size=9, color=RGBColor(0x70, 0x70, 0x70))
    r.italic = True

    doc.save(OUT)
    print(f"Gerado: {OUT}")


if __name__ == "__main__":
    main()
