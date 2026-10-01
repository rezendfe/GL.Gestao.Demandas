# Contrato — EF-22

Autenticado. Responsável da Área recebe 403.

- `GET /api/comunicados` — Cessionário vê os vigentes. GL / Administrador vê todos.
- `GET /api/comunicados/{id}` — texto, situação, leitura e histórico. Cessionário não abre encerrado.
- `POST /api/comunicados` — título, texto e `avisarCelular`. Só GL / Administrador.
- `POST /api/comunicados/{id}/encerramento` — só GL / Administrador. Registra o encerramento.
- `POST /api/comunicados/{id}/leitura` — só Cessionário, uma vez, em comunicado vigente.

O aviso de celular, quando pedido, abre `/comunicados/{id}`.
