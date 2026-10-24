# ulx-extension-builder

Starter blueprint for a **Backstage** extension: one space-settings welcome widget built with **React, PrimeReact, and Tailwind**.

Clone it, preview the dummy widget, then use the bundled Cursor skill to replace the page you want to embed.

---

## Quick start

```bash
npm install
npm start
```

The local preview initializes without a Backstage host and shows a fallback state. Upload the built package to see real portal and space metadata.

Build the uploadable extension:

```bash
npm run pack
# → validate, build app/widget/, then create dist/<project>.zip
```

Upload the zip from **`dist/`** to Backstage.

---

## Connect to Sigma

This starter uses the private `zoho-extension-toolkit` 1.5.44+ command set for
Backstage and Sigma synchronization. Authenticate, select a workspace, and
create the cloud app:

```bash
npm run sigma:login
npm run sigma:workspaces
npm run zet:init
```

During `zet:init`, select **BACKSTAGE**. The command creates the Sigma app in an
isolated temporary directory and imports only its encrypted `app_info.json`
link. It does not replace this starter's React source or manifest.
`app_info.json` is account- and machine-specific and is ignored by Git.

Push a fresh build and test it in Sigma:

```bash
npm run sigma:push
npm run sigma:cloud:run
# when finished
npm run sigma:cloud:stop
```

`sigma:push` always validates and rebuilds before invoking `zet push`.
Use `npm run sigma:whoami` to check the active account/workspace.

Pulling is intentionally guarded:

```bash
npm run sigma:pull
```

It requires a clean tracked Git worktree. ZET's downloaded compiled files stay
under ignored `app/`; the cloud manifest is copied to
`dist/sigma-pull/plugin-manifest.json`, and the tracked local manifest is
restored. A pull does **not** reconstruct or update files in `src/`.

For ZET's packaged local server instead of the Vite source preview:

```bash
npm run zet:run
```

This builds first and then delegates to `zet run`.

---

## What you get

- `plugin-manifest.json` — one `backstage.space.settings.left.pane` route widget titled **Welcome widget**, with root `url` `/app/widget/index.html`
- `src/WelcomeWidget.jsx` — dummy page with SDK init, loading, success, and retryable error states
- `.cursor/skills/sdk-extension-builder/` — skill, client/manifest docs, and rules for AI-assisted widget work
- Theme tokens and PrimeReact styling that follow Backstage `ulx-*` body classes

---

## Customize with AI

Ask Cursor to use the `sdk-extension-builder` skill and describe the widget you want. Typical edits:

- `src/WelcomeWidget.jsx` — replace the welcome UI
- `plugin-manifest.json` — location, `title`, root `url`, connectors, and domains
- `public/` — images used by the widget

Then run `npm run check && npm run pack` and upload the zip from `dist/`.

---

## Theme classes

Set on `<body>` (host can inject these into the iframe):

| Mode | Classes |
|------|---------|
| Light | `ulx-default-mode` |
| Dark | `ulx-default-mode ulx-dark-mode` |
| Dark + Cobalt | `ulx-default-mode ulx-dark-mode ulx-cobalt-theme` |
| Light + Cobalt | `ulx-default-mode ulx-cobalt-theme` |

Accent themes: `ulx-cobalt-theme`, `ulx-cardinal-theme`, `ulx-fern-theme`, `ulx-tangerine-theme`

Font classes: `lato`, `lato2`, `roboto`, `manrope`, `zoho-puvi`, `puvi`, `dyslexic`
(CDN `@font-face` URLs match uls_v2 — see `src/theme/fonts.css`)

Parent app can also `postMessage` into the iframe:

```js
iframe.contentWindow.postMessage(
  { type: 'bs-theme', className: 'ulx-default-mode ulx-dark-mode ulx-cobalt-theme' },
  '*'
);
```

---

## Project layout

```
plugin-manifest.json
src/
  WelcomeWidget.jsx
  main.jsx
  config/project.config.js
  components/layout/
  theme/
  styles/index.css
public/
scripts/
  build-extension.mjs
  validate-extension.mjs
.cursor/skills/sdk-extension-builder/
.cursor/rules/
docs/
app/widget/           ← compiled widget (generated)
dist/                 ← zet pack zip
```

---

## Scripts

| Command | What it does |
|---------|----------------|
| `npm start` | Dev server for the welcome widget |
| `npm run validate` | Validate the plugin manifest and SDK script order |
| `npm run build` | Compile the widget into `app/widget/` |
| `npm run check` | Validate then build |
| `npm run pack` | Check, build, and run `zet pack` → `dist/*.zip` |
| `npm run preview` | Preview the Vite production build |
| `npm run zet:init` | Create/link a BACKSTAGE app in Sigma |
| `npm run zet:run` | Build and start the ZET local server |
| `npm run zet:validate` | Check/build and run ZET validation |
| `npm run sigma:push` | Check/build and push to Sigma |
| `npm run sigma:pull` | Guarded pull of cloud package output |
| `npm run sigma:cloud:run` | Start Sigma cloud testing |
| `npm run sigma:cloud:stop` | Stop Sigma cloud testing |
| `npm run zet` | Show all workflow commands |

---

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/ZET-WORKFLOWS.md](docs/ZET-WORKFLOWS.md) | Step-by-step ZET setup, Sigma sync, cloud testing, and packaging |
| [docs/PROJECT-BLUEPRINT.md](docs/PROJECT-BLUEPRINT.md) | Architecture, boundaries, and quality gate |
| [docs/UI-DESIGN-RULES.md](docs/UI-DESIGN-RULES.md) | Spacing, type, colors, form/table/drawer patterns |
| [docs/PRIMEREACT-USAGE.md](docs/PRIMEREACT-USAGE.md) | PrimeReact imports, size classes, screenshot → widget workflow |
| [docs/CLIENT.md](docs/CLIENT.md) | Backstage frame-client APIs |
| [docs/API.md](docs/API.md) | Backstage v3 query names and response bodies |
| [docs/ICONS.md](docs/ICONS.md) | bs-icons1 selection and 24px stroke rules |
| [docs/MANIFEST.md](docs/MANIFEST.md) | Plugin manifest contract |

---

## Requirements

- Node.js 18+
- npm 9+
- Access to the private npm registry that provides
  `zoho-extension-toolkit` 1.5.44+ with BACKSTAGE support
