# Arquitetura — EF-05

Hoje: `ObrasAplicacao` só lista e obtém. Portal `ObrasPage` é leitura. Aprovação do chamado usa `Demanda.Decidir` (EF-02), exclusiva do GL / Administrador.

Alvo do gate: a abertura da subcategoria Obras recusa o envio sem os quatro documentos. Versão nova não apaga a anterior. Alerta de seguro sai por outbox, no mesmo padrão de [EF-04](../EF-04-whatsapp/architecture.md).
