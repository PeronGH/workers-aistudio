# Workers AI Studio

A local-first, AI-Studio-style playground built on Cloudflare Workers AI. The Worker is a thin stateless proxy; conversation history and run settings live in your browser.

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/PeronGH/workers-aichat"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

## Features

- **Full control over run settings** — system prompt, temperature, top-p, max completion tokens, stop sequences, frequency/presence penalty, seed, response format, thinking effort, web search.
- **Unset by default** — anything you haven't touched is omitted from the request, so the model uses its provider defaults.
- **Stateless server** — single `POST /api/chat` endpoint that streams OpenAI-style SSE straight back. No Durable Objects, no SQLite, no WebSockets.
- **Local-first** — messages and settings persist in `localStorage`. Clearing them is one click and reaches no farther than your browser.
- **Image input** — drag-drop, paste, or click to attach images; sent as native `image_url` parts.
- **Reasoning display** — streaming chain-of-thought collapses into a `<details>` block when complete.

## Quick start

```bash
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project structure

```
src/
  server/
    index.ts        # POST /api/chat → env.AI.run, streaming pass-through
    chat.ts         # validate + build the payload
  shared/
    settings.ts     # RunSettings Zod schema, bounds constants
    messages.ts     # ChatMessage Zod schema
  client/
    App.tsx, Chat.tsx
    components/     # Header, SettingsPanel, Composer, MessageList, Message, ThemeToggle
    hooks/          # useChat, useRunSettings, useAttachments, useTheme
    utils/          # sse parser, attachment helpers, message-shape helpers
```

## Deploy

```bash
bun run deploy
```

The Worker reads the `AI` binding declared in `wrangler.jsonc`. No secrets or env vars required.

## Scripts

| Command          | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `bun run dev`    | Vite dev server                                      |
| `bun run deploy` | Build and deploy                                     |
| `bun run types`  | Regenerate `env.d.ts` from `wrangler.jsonc` bindings |
| `bun run check`  | Format check + lint + typecheck                      |
| `bun run format` | Apply formatter                                      |

## License

MIT
