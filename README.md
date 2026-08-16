# Protocolos UTI

Suba **o conteúdo desta pasta diretamente na raiz do repositório GitHub**.

Estrutura esperada:

```text
repo/
├─ package.json
├─ package-lock.json
├─ wrangler.toml
├─ README.md
└─ site/
   ├─ index.html
   ├─ styles.css
   └─ app.js
```

## Cloudflare

Build command:

```bash
npm install
```

Deploy command:

```bash
npm run deploy
```

Root directory: vazio ou `/` quando esses arquivos estiverem na raiz do repositório.

Nas versões iniciais, basta substituir a pasta `site/`.
