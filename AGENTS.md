# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Package manager

This project uses **bun**. Use `bun install`, `bun add`, `bun run <script>`, and `bunx` (not `npm`/`npx`). The lockfile is `bun.lock`.

## Commands

| Command               | Purpose                   |
| --------------------- | ------------------------- |
| `bun run dev`         | Local development         |
| `bun run deploy`      | Deploy to Cloudflare      |
| `bun run types`       | Generate TypeScript types |
| `bunx wrangler <cmd>` | Ad-hoc Wrangler commands  |

Run `bun run types` after changing bindings in wrangler.jsonc.

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

## Preferences

- **Use the component library, not raw HTML.** This project uses `@cloudflare/kumo`. If a component exists in kumo (`Button`, `Select`, `InputArea`, `Switch`, `Loader`, etc.), use it — never reach for raw `<select>`, `<button>`, `<input type="text">`, etc. Hidden/structural elements (`<form>`, hidden `<input type="file">`) are fine when no library equivalent exists.
- **Verify APIs, don't speculate.** For Workers AI and Cloudflare bindings, the authoritative source is `node_modules/@cloudflare/workers-types` (typed input/output schemas per model). Read it before writing code. Doc pages and LLM summaries may be wrong or out of date.
- **Be precise about standards.** Don't label something "ISO 639-1" (or any other standard) unless it actually conforms. State what the upstream actually accepts, and cite the source.
- **Curated lists over exhaustive ones.** For user-facing pickers, prefer a short curated set (≈4–5 entries) unless the user asks for the full list.
- **Separate local-only state from server-bound state.** Settings/preferences that should never leave the browser belong in a distinct slice (own `localStorage` key, own hook), not mixed into payloads sent to the server or persisted on conversations.

## Best Practices (conditional)

If the application uses Durable Objects or Workflows, refer to the relevant best practices:

- Durable Objects: https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- Workflows: https://developers.cloudflare.com/workflows/build/rules-of-workflows/
