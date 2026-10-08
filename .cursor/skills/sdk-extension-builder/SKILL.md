---
name: sdk-extension-builder
description: Builds complete Eventz Backstage SDK extensions with plugin-manifest.json, React/PrimeReact/Tailwind widgets, Backstage frame-client logic, connector declarations, and packaged app assets. Use when creating, scaffolding, or updating an extension project or extension widget.
---

# SDK Extension Builder

Build a deployable Backstage extension, not an isolated HTML mockup.

This starter ships one space-settings welcome widget. Customize `src/WelcomeWidget.jsx` and `plugin-manifest.json`, then compile the uploadable package.

Before editing, read:

- [MANIFEST.md](MANIFEST.md) for manifest contracts and mode examples.
- [CLIENT.md](CLIENT.md) for the iframe client API.
- [API.md](API.md) for Backstage v3 query names and response bodies.
- [rules/sdk-extension-html.mdc](rules/sdk-extension-html.mdc)
- [rules/sdk-extension-client.mdc](rules/sdk-extension-client.mdc)
- [rules/sdk-extension-api.mdc](rules/sdk-extension-api.mdc)
- [rules/sdk-extension-manifest.mdc](rules/sdk-extension-manifest.mdc)

This skill consumes existing widget locations. Adding a new host location requires coordinated changes in the Backstage host and is outside this extension-package workflow.

## 1. Establish the extension contract

Determine:

1. User workflow and widget entry point.
2. Existing widget location.
3. Presentation mode: embedded, `sidePane`, `modal`, `popup`, `newTab`, `route`, or background.
4. Compiled widget URL under `app/` (starter: `/app/widget/index.html`).
5. Backstage v3 API operations required.
6. External domains and connector link names required.
7. Host metadata expected at the chosen location.

Ask only for values that cannot be inferred, especially connector IDs, data-center mappings, and external scopes.

## 2. Use the extension package structure

Source (this blueprint):

```text
extension-root/
├── plugin-manifest.json
├── index.html
├── src/
│   ├── WelcomeWidget.jsx
│   ├── main.jsx
│   ├── components/layout/
│   └── theme/
└── public/
```

Compiled widget (`npm run build`):

```text
plugin-manifest.json
app/widget/
├── index.html
└── assets/
```

Packed zip (`npm run pack` → `zet pack`):

```text
dist/<project>.zip
```

- Put every runtime file referenced by the manifest under `app/` in the built package.
- Use relative paths for local images and assets.
- Keep `plugin-manifest.json` at the package root.
- Add only files required at runtime; do not package source notes or secrets.

## 3. Create the manifest

Start from the starter `plugin-manifest.json`, then add one widget entry per surface.

- Use only a supported widget location.
- Give every widget a stable, unique ID.
- Match the manifest mode to what the host location can render.
- Give every widget a non-empty root `url` under `/app/`, including `route` and `newTab`. Use `title` for the widget label. Do not add `labelConfig`.
- When widget code calls `app.request` with a custom URL, add that URL hostname to `whiteListedDomains`.
- When that call includes `connection`, add the link name inside `dcConnectors` using the configured data center and connector ID. Do not invent those mappings.
- Ensure every `/app/...` URL resolves to a packaged file.
- Do not add `functions` or `triggers` unless the requested workflow uses them.

The starter widget uses `backstage.space.settings.left.pane` with `viewMode: "route"`, `title` `Welcome widget`, and both `url` and `navigationConfig.url` set to `/app/widget/index.html`.

## 4. Build the widget UI

Edit `src/WelcomeWidget.jsx` (or replace it) instead of hand-writing packaged HTML.

- Use PrimeReact for interactive controls.
- Use Tailwind and token-backed classes (`bg-body`, `bg-surface`, `text-primary`, `border-border`) for layout.
- Use `PageLayout` and `PageHeader` for the iframe canvas.
- Keep ZSDK and `bs-frame-client.js` in `index.html` in that order. Do not add the legacy ULX editor stylesheet.
- Show loading, empty, success, and actionable error states.
- Initialize with `await ZBackstage.extension.init()` before using host APIs. Local `npm start` may run without the host; keep a visible preview fallback.

```bash
npm start
npm run build
```

`npm run build` writes `app/widget/`. `npm run pack` runs `zet pack`.

## 5. Implement client behavior

Initialize before using host data:

```javascript
const app = await ZBackstage.extension.init();
```

- Use `app.api` for Backstage v3 APIs. Follow [API.md](API.md): pass documented snake_case query names in the final argument and read the raw REST JSON body.
- Use `app.request` for connector-backed external APIs. In the same change, add each request hostname to `whiteListedDomains` and each `connection` name to `dcConnectors` in `plugin-manifest.json`.
- Use `app.storage` for extension state.
- Use `app.ui` for host notifications, dialogs, panes, and modal lifecycle.
- Use `app.widget.render` to open another declared side-pane or modal widget.
- Use `app.action` and `app.event` only for explicit bidirectional contracts.
- Render an actionable initialization error instead of leaving a blank iframe.
- Keep user input and remote values out of `innerHTML` / `dangerouslySetInnerHTML`.

## 6. Verify as one package

Before handoff:

- Run `npm run check && npm run pack`.
- Parse `plugin-manifest.json` as JSON.
- Check widget IDs and full locations are unique.
- Check each mode satisfies [MANIFEST.md](MANIFEST.md), including a root `url` on every widget.
- Check every manifest URL exists under `app/`.
- Check every HTML file loads ZSDK before the Backstage frame client.
- Check every `app.request` hostname is in `whiteListedDomains` and every `connection` name is in `dcConnectors`.
- Check `app.api` calls use documented snake_case query names and read the raw v3 JSON body from [API.md](API.md).
- Check controls have labels, keyboard behavior, pending states, and useful errors.
- Check no credentials or environment-specific secrets are packaged.
- Exercise initialization and the primary success/failure path in a Backstage iframe when available.

Report the widget location, mode, entry file, connector/domain requirements, and verification performed.
