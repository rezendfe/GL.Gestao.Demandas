# Quickstart — EF-02

Subir a API (`dotnet run --project backend/src/Gl.Demandas.Api --launch-profile http`) e o portal (`npm run dev` em `web`). Swagger: http://localhost:5090/swagger. Portal: http://localhost:5173.

Senha de demonstração: `Demo@2026`. Cessionário `joao.silva@empresaexemplo.com.br`. GL / Administrador `patricia.lima@gleventos.com.br`. Responsável da Área `responsavel.01@gleventos.com.br`.

1. Como GL / Administrador, abrir um chamado Concluído (protocolo de demonstração `GL-2026-00118`) e acionar Encerrar chamado. A situação fica Encerrada.
2. Abrir um chamado em aberto e cancelar com motivo. A situação fica Cancelada e o motivo aparece no histórico.
3. Repetir encerrar ou cancelar como Responsável da Área: a API recusa.

Teste: `Gl_encerra_concluido_e_cancela_em_aberto` em `AceitePocTests`. Nesta máquina o teste precisa de `GL_TEST_SQL` ou LocalDB.
