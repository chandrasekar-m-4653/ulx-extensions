# Icon selection

While building an extension, choose icons for that project and update its `plugin-manifest.json` in the same edit. Search the [bs-icons1 catalog](https://cdn.zicons.in/21598000000025464/latest/bs-icons1.js) before drawing anything. The file is a `svg_icons` map of 273 keys. It is not produced by `npm run build`.

Two families are in that file:

- About 122 icons are the current stroke set: `viewBox="0 0 24 24"`, `fill="none"`, round caps and joins, `stroke-width` 1.2 or 1.4 (a few checks use 2).
- About 121 icons are an older filled set: 32px art on `viewBox="0 0 1024 1024"` with `fill="currentColor"`.

Prefer a 24px stroke key whose name matches the action. Leave the filled 1024 set unused for new work.

## Choose a catalog key

1. Search icon keys for the action name (`ticket`, `user`, `tick`, `search`, and similar words).
2. Keep the match when it is a 24px stroke icon.
3. Record the key. In the same edit, set that widget's manifest field to `bs-icons1` plus the key:

```json
"icon": "bs-icons1 tick-thick-icon"
```

4. The second token must be a key that exists in the sprite. `add-icon-01` is not in this catalog. Nearby keys are `add-user-icon` and `add-on-icon`.

The widget iframe does not load `bs-icons1.js`. The manifest `icon` styles the host menu. Inside the widget, copy the chosen artwork into `public/icons/<action>.svg` with `stroke="currentColor"` so theme tokens apply. PrimeIcons remain available on PrimeReact controls (`icon="pi pi-plus"`).

## Draw a missing icon

Draw a new SVG only when no 24px stroke key matches the action in this project. Save it at `public/icons/<action>.svg`. These files belong to the extension being built. The samples under `docs/icon-samples/` are references, not the project icons.

- `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.2"`.
- `stroke-linecap="round"` and `stroke-linejoin="round"`.
- One color. No gradients, shadows, or extra fills.
- Keep the artwork inside a small inset, in the same sparse stroke style as `utilities-icon` and `canvas-icon`.

A drawn file is not in the CDN sprite. Use it in the widget. Leave the manifest `icon` unset for that action rather than inventing a `bs-icons1` class. Set `icon` only when step 3 found a real key for the widget itself.

## Check-in test

Requirement: “check-in desk: scan a badge, mark attended, and search an attendee.”

| Action | Catalog search | Choice | Manifest `icon` |
|--------|----------------|--------|-----------------|
| Scan a badge | `scan`, `badge`, `qr` | No key. Reference [scan-badge.svg](icon-samples/scan-badge.svg). A project build saves `public/icons/scan-badge.svg`. | Leave unset |
| Mark attended | `tick`, `check`, `mark` | `tick-thick-icon`, a 24px stroke check | `bs-icons1 tick-thick-icon` |
| Search an attendee | `search`, `find`, `magnif` | No key. `User-info-icon-01` and `add-user-icon` are people, not search. Reference [search-attendee.svg](icon-samples/search-attendee.svg). A project build saves `public/icons/search-attendee.svg`. | Leave unset |
| Analytics | `analytic`, `chart`, `graph`, `report`, `dashboard` | No 24px stroke key. `view-delivery-report` is filled and `dashboard-icon` is the 1024 set. Reference [analytics.svg](icon-samples/analytics.svg). A project build saves `public/icons/analytics.svg`. | Leave unset |

`tick-thick-icon` uses `stroke-width` 2. Reuse it anyway, because the host already ships that check. For a check-in widget, set the manifest icon to `bs-icons1 tick-thick-icon` and keep the drawn scan and search files in `public/icons/`.
