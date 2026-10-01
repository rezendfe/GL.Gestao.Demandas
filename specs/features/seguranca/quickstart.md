# Quickstart — Segurança

Subir a API (`dotnet run --project backend/src/Gl.Demandas.Api --launch-profile http`) e o portal (`npm run dev` em `web`). Swagger: http://localhost:5090/swagger. Portal: http://localhost:5173.

Senha de demonstração: `Demo@2026`. Cessionário `joao.silva@empresaexemplo.com.br`. GL / Administrador `patricia.lima@gleventos.com.br`. Responsável da Área `responsavel.01@gleventos.com.br`.

1. Abrir http://localhost:5173/central sem sessão: o portal mostra o login.
2. Entrar como Responsável da Área e tentar aprovar um chamado: acesso negado, situação inalterada.
3. Não procurar senha de banco nem chave de API no repositório.
