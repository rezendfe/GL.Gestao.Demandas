# Portal GL Eventos / Riocentro

React 19.3. A interface não chama `fetch` direto: os hooks em `src/application` usam `src/infrastructure/api`.

```bash
cd web
npm ci
npm run dev
```

Abre em http://localhost:5173 e espera a API em http://localhost:5090. Em outro host, defina `VITE_API_BASE_URL`.

O build de produção:

```bash
npm run build
```
