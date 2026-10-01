# Arquitetura — EF-01

Monólito hexagonal. A abertura não publica fila.

- Domínio: `Protocolo`, `Demanda.Abrir`, `LeituraSolicitacao`, `ClassificadorPorRegras`.
- Aplicação: `AtendimentoAplicacao` abrir, sugerir e preencher. Portas `IExtratorSolicitacao` e `IClassificadorDemanda`.
- Infraestrutura: `ExtratorOpenAi` com leitura local se o modelo não responder. Classificador lê `app.Regra_Classificacao`.
- API: `POST /api/demandas`, `POST /api/classificacao/sugerir`, `POST /api/solicitacoes/preencher`.
- Portal: `AbrirPage`, `CampoDitado`. O áudio fica no navegador.

Login desta entrega: [seguranca](../seguranca/architecture.md).
