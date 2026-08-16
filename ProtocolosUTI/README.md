# ProtocolosUTI

Pasta completa pronta para Cloudflare Workers Builds.

Configuração esperada no painel:
- Root directory: `ProtocolosUTI`
- Build command: `exit 0`
- Deploy command: `npx wrangler deploy`

O arquivo `wrangler.toml` já aponta `assets.directory` para `./site`, então não é necessário adicionar `--assets` manualmente no comando de deploy.
