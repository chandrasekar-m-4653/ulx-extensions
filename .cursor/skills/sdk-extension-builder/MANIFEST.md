# Plugin manifest reference

This starter’s root `plugin-manifest.json` declares one `backstage.space.settings.left.pane` route widget. Its root `url` and `navigationConfig.url` are both `/app/widget/index.html`, and its `title` is `Welcome widget`. Use the examples below when adding or changing surfaces.

## Base manifest

```json
{
  "whiteListedDomains": [],
  "service": "BACKSTAGE",
  "cspDomains": [],
  "dcConnectors": {},
  "storage": false,
  "locale": ["en"],
  "modules": {
    "widgets": []
  }
}
```

`service`, `locale`, `whiteListedDomains`, and `modules.widgets` are required. `storage` and `dcConnectors` are optional until the widget calls `app.request`. Extra packaging fields such as `cspDomains` do not replace `whiteListedDomains`.

`modules.functions` and `modules.triggers` are optional. Omit them when unused.

## Shared widget rules

- `location`: required and must resolve to a supported static location.
- `id`: required, non-empty, and unique across all widgets.
- `url`: required on every widget, including `route` and `newTab`, and must be a non-empty `/app/` path.
- `title`: the widget label consumed by menu and navigation hosts. Do not add `labelConfig`.
- A full location may appear only once.
- A suffix such as `backstage.exhibitor.menu#crm-search` creates a distinct full location; validation removes the suffix when checking support and background count.
- Only one `backstage.background.process` widget is allowed, including suffixed variants.
- `icon` may be consumed by menu hosts.

## Side pane or modal

```json
{
  "icon": "bs-icons1 add-icon-01",
  "location": "backstage.exhibitor.menu",
  "id": "exhibitor-crm-search",
  "title": "Add exhibitor from CRM",
  "viewMode": "sidePane",
  "url": "/app/widget.html"
}
```

Every widget requires a non-empty root `url`. `sidePane`, `modal`, embedded widgets, background widgets, and widgets with no `viewMode` render that `url`.

## Popup

```json
{
  "location": "backstage.site.pre.registration",
  "id": "pre-registration-popup",
  "title": "Pre-registration",
  "viewMode": "popup",
  "url": "/app/pre-registration.html",
  "popupConfig": {
    "position": "bottom",
    "action": "click"
  }
}
```

A popup requires root `url`, `popupConfig.position`, and `popupConfig.action`.

## New tab

Static target:

```json
{
  "location": "backstage.event.attendee.menu",
  "id": "attendee-help",
  "title": "Attendee help",
  "viewMode": "newTab",
  "url": "/app/attendee-help.html",
  "navigationConfig": {
    "urlType": "static",
    "url": "https://example.com/help"
  }
}
```

Dynamic target:

```json
{
  "location": "backstage.event.attendee.menu",
  "id": "attendee-dynamic-link",
  "title": "Attendee link",
  "viewMode": "newTab",
  "url": "/app/attendee-link.html",
  "navigationConfig": {
    "urlType": "dynamic",
    "method": "resolveAttendeeUrl"
  }
}
```

`newTab` requires a root widget `url`. Its `urlType` must be exactly `static` or `dynamic`. A static `navigationConfig.url` may be an external HTTPS address. A dynamic target uses `navigationConfig.method`.

## Route

```json
{
  "location": "backstage.event.settings.left.pane",
  "id": "event-settings-extension",
  "title": "Extension settings",
  "viewMode": "route",
  "url": "/app/settings.html",
  "navigationConfig": {
    "customPath": "extension-settings",
    "url": "/app/settings.html"
  }
}
```

Route validation requires a root `url`, plus non-empty `navigationConfig.customPath` and `navigationConfig.url`. Both URL fields must point at packaged `/app/` files.

These locations are route-only:

- `backstage.portal.settings.left.pane`
- `backstage.space.settings.left.pane`
- `backstage.event.settings.left.pane`
- `backstage.event.abstract.editor`

## Widget title

Use `title` for the label shown by menu and navigation hosts:

```json
{
  "title": "Extension settings"
}
```

Do not add `labelConfig`. The host does not use it.

## Connector declaration

When widget code calls `app.request`, update this manifest in the same change:

- Add each absolute request URL hostname to `whiteListedDomains`.
- If that call includes `connection`, add the link name inside `dcConnectors`.

The package format maps data centers and connector IDs to service/link names:

```json
{
  "whiteListedDomains": ["zohoapis.com"],
  "dcConnectors": {
    "US": {
      "CONNECTOR_ID": ["backstage", "readzcrm"]
    }
  }
}
```

Do not invent connector IDs or data-center mappings. Obtain them from the extension configuration. The link name used by client code must match the `connection` value:

```javascript
await app.request({
  apiType: "api",
  url: "https://zohoapis.com/crm/v8/Contacts",
  connection: "readzcrm"
});
```

`app.api` calls are host-backed and do not add `whiteListedDomains` entries.

## Supported locations

- `backstage.portal.settings.integrations.crm`
- `backstage.site.pre.registration`
- `backstage.event.attendee.menu`
- `backstage.custom.form.response.menu`
- `backstage.background.process`
- `backstage.config.custom.domain`
- `backstage.exhibitor.menu`
- `backstage.portal.settings.left.pane`
- `backstage.space.settings.left.pane`
- `backstage.floorplan.editor.left.menu`
- `backstage.event.settings.left.pane`
- `backstage.portal.settings.payments`
- `backstage.event.ticketing.payments`
- `backstage.event.abstract.editor`

Confirm the supported-location list against current Backstage extension documentation when the host platform may have changed.
