# Google Cloud CLI, Gemini CLI & MCP

This project uses **Google Cloud CLI** and **Google AI (Gemini) CLI** for tooling. Optional MCP servers let Cursor (or Gemini CLI) call Google AI / Google Cloud from the agent.

## Installed CLIs

| CLI | Install | Version check |
|-----|--------|----------------|
| **Google Cloud CLI** (`gcloud`) | `brew install --cask google-cloud-sdk` | `gcloud --version` |
| **Gemini CLI** (Google AI Studio) | `npm install -g @google/gemini-cli` | `gemini --version` |

- **gcloud**: Used for Google Cloud (GCP) projects, auth, and—with Google’s MCP docs—remote MCP servers. First run: `gcloud init` and sign in.
- **Gemini CLI**: Terminal AI that can use MCP servers; auth via `gemini` (Google sign-in or `GEMINI_API_KEY`).

## MCP servers (Cursor / Gemini CLI)

### Cursor MCP config

Cursor reads MCP config from **`~/.cursor/mcp.json`** (global). After editing, **restart Cursor** for changes to apply.

### Gemini MCP (Google AI in Cursor)

To give Cursor tools that call Gemini (e.g. generate text, analyze images):

1. **Option A – Community Gemini MCP**  
   Add a “Gemini MCP” server to `~/.cursor/mcp.json`. Example (stdio; you need the actual server command/package from the provider, e.g. [Gemini MCP for Cursor](https://mcpcursor.com/server/gemini-mcp) or [gemini-context-mcp-server](https://github.com/ogoldberg/gemini-context-mcp-server)):

   ```json
   {
     "mcpServers": {
       "gemini": {
         "command": "npx",
         "args": ["-y", "gemini-mcp-server-or-package-name"],
         "env": {
           "GEMINI_API_KEY": "<your-google-ai-studio-api-key>"
         }
       }
     }
   }
   ```

   Replace `gemini-mcp-server-or-package-name` and any args with the exact package/command from the server’s docs. Set `GEMINI_API_KEY` in `env` or in your environment.

2. **Option B – Gemini CLI as MCP client**  
   Gemini CLI can *use* MCP servers (see [Gemini CLI MCP docs](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html)). Configure servers in Gemini’s `settings.json` (`~/.gemini/settings.json` or project `.gemini/settings.json`), e.g. `mcpServers`. That does not add Gemini *into* Cursor; it adds other tools *into* Gemini CLI.

### Google Cloud MCP

Google Cloud provides **remote** MCP servers (HTTP, on Google’s side). You use **gcloud** for auth and project setup; then AI apps connect to those endpoints. See [Google Cloud MCP overview](https://docs.cloud.google.com/mcp/overview) and [Manage MCP servers](https://docs.cloud.google.com/mcp/manage-mcp-servers). Commands are in the form `gcloud beta services mcp ...` (or as in the latest docs). This is separate from Cursor’s `~/.cursor/mcp.json`; Cursor would need an MCP client that talks to those HTTP endpoints if you want them inside Cursor.

## This repo and deployment

- **Vercel**: The app is set up to deploy to **Vercel** (see README: gorillamaths.com, env vars, domain).
- **Git**: To confirm the GitHub remote: `git remote -v`. If you see an `origin` pointing to `github.com`, the repo is on GitHub; Vercel usually deploys from that connection.

No `vercel.json` is required for a standard Next.js deploy; Vercel detects the framework. The `public/vercel.svg` in the repo is branding only.

## Env used by this app

The app already uses:

- **Google OAuth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (see README).
- **Gemini API**: `GEMINI_API_KEY` for the student explain route (`src/app/api/student/explain/route.ts`).

For local Gemini CLI or a Gemini MCP server, the same `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/)) can be used.
