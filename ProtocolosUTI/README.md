# Protocolos UTI

Projeto completo dentro de uma única subpasta para facilitar substituição.

Estrutura:

ProtocolosUTI/
- site/
  - index.html
  - styles.css
  - app.js
- package.json
- wrangler.toml
- README.md

## Cloudflare

Root directory: ProtocolosUTI
Build command: npm install
Deploy command: npm run deploy

O Wrangler está fixado em 4.123.0 no package.json.

O package-lock.json antigo foi removido porque estava incompleto e fazia o Cloudflare executar `npm ci` com um lockfile inválido. Após rodar `npm install` localmente, um package-lock.json válido poderá ser commitado.
