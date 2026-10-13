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
npm run build
# → app/widget/index.html
npm run pack
# → dist/<project>.zip via zet pack
```

Upload the zip from **`dist/`** to Backstage.

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
| `npm run pack` | `zet pack` → `dist/*.zip` |
| `npm run preview` | Preview the Vite production build |

---

## Docs

| Doc | Purpose |
|-----|---------|
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
