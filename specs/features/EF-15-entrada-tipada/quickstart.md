# Quickstart — EF-15

Subir a API (`dotnet run --project backend/src/Gl.Demandas.Api --launch-profile http`) e o portal (`npm run dev` em `web`). Swagger: http://localhost:5090/swagger. Portal: http://localhost:5173.

Senha de demonstração: `Demo@2026`. Cessionário `joao.silva@empresaexemplo.com.br`. GL / Administrador `patricia.lima@gleventos.com.br`. Responsável da Área `responsavel.01@gleventos.com.br`.

1. Em Cadastros, tentar gravar letra na meta de prazo: o campo fica só com dígitos.
2. Enviar pela API uma descrição acima de 2000 caracteres: a API recusa.
