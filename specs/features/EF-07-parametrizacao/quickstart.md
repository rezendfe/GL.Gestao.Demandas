# Quickstart — EF-07

Subir a API (`dotnet run --project backend/src/Gl.Demandas.Api --launch-profile http`) e o portal (`npm run dev` em `web`). Swagger: http://localhost:5090/swagger. Portal: http://localhost:5173.

Senha de demonstração: `Demo@2026`. Cessionário `joao.silva@empresaexemplo.com.br`. GL / Administrador `patricia.lima@gleventos.com.br`. Responsável da Área `responsavel.01@gleventos.com.br`.

1. Entrar como GL / Administrador e abrir Cadastros. Gravar a meta de prazo de uma categoria e reiniciar a API: o valor permanece.
2. Abrir a cadeia de um tipo e marcar a aprovação automática. O outro tipo não muda.
3. Entrar como Responsável da Área e tentar gravar: a API recusa.
