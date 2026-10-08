#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { projectConfig } from '../src/config/project.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SUPPORTED_LOCATIONS = new Set([
  'backstage.portal.settings.integrations.crm',
  'backstage.site.pre.registration',
  'backstage.event.attendee.menu',
  'backstage.custom.form.response.menu',
  'backstage.background.process',
  'backstage.config.custom.domain',
  'backstage.exhibitor.menu',
  'backstage.portal.settings.left.pane',
  'backstage.space.settings.left.pane',
  'backstage.floorplan.editor.left.menu',
  'backstage.event.settings.left.pane',
  'backstage.portal.settings.payments',
  'backstage.event.ticketing.payments',
  'backstage.event.abstract.editor',
]);

const ROUTE_ONLY_LOCATIONS = new Set([
  'backstage.portal.settings.left.pane',
  'backstage.space.settings.left.pane',
  'backstage.event.settings.left.pane',
  'backstage.event.abstract.editor',
]);

function staticLocation(location) {
  return String(location || '').split('#')[0];
}

function httpsUrl(value, label, errors) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      errors.push(`${label} must use HTTPS.`);
    }
  } catch {
    errors.push(`${label} must be a valid URL.`);
  }
}

function resolveAppPath(url) {
  if (typeof url !== 'string' || !url.startsWith('/app/')) {
    return null;
  }
  return join('app', url.slice('/app/'.length));
}

function packagedTargets(widget) {
  const urls = [];
  if (typeof widget?.url === 'string') urls.push(widget.url);
  if (
    widget?.viewMode === 'route' &&
    typeof widget.navigationConfig?.url === 'string'
  ) {
    urls.push(widget.navigationConfig.url);
  }
  return [...new Set(urls)];
}

function walkSourceFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(fullPath, files);
    } else if (/\.(js|jsx|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function findMatchingParen(source, openIndex) {
  let depth = 0;
  let quote = null;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function readStringLiteral(source, start) {
  const quote = source[start];
  if (quote !== '"' && quote !== "'" && quote !== '`') return null;
  let value = '';
  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];
    if (char === '\\') {
      value += source[index + 1] ?? '';
      index += 1;
      continue;
    }
    if (quote === '`' && char === '$' && source[index + 1] === '{') {
      return { dynamic: true };
    }
    if (char === quote) return { value, dynamic: false };
    value += char;
  }
  return null;
}

function topLevelPropertyValues(argumentSource, propertyName) {
  const objectStart = argumentSource.indexOf('{');
  if (objectStart === -1) return [];
  const values = [];
  let depth = 0;
  let quote = null;

  for (let index = objectStart; index < argumentSource.length; index += 1) {
    const char = argumentSource[index];
    if (quote) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) break;
      continue;
    }
    if (depth !== 1 || !argumentSource.startsWith(propertyName, index)) continue;

    const before = index === 0 ? '' : argumentSource[index - 1];
    const afterIndex = index + propertyName.length;
    if (/[\w$]/.test(before) || /[\w$]/.test(argumentSource[afterIndex] || '')) {
      continue;
    }

    let cursor = afterIndex;
    while (/\s/.test(argumentSource[cursor] || '')) cursor += 1;
    if (argumentSource[cursor] !== ':') continue;
    cursor += 1;
    while (/\s/.test(argumentSource[cursor] || '')) cursor += 1;
    const literal = readStringLiteral(argumentSource, cursor);
    if (literal && !literal.dynamic) values.push(literal.value);
  }

  return values;
}

function requestCalls(source) {
  const calls = [];
  const needle = 'app.request';
  let index = 0;
  while (index < source.length) {
    const found = source.indexOf(needle, index);
    if (found === -1) break;
    const afterName = found + needle.length;
    if (/[\w$]/.test(source[afterName] || '')) {
      index = afterName;
      continue;
    }
    const open = source.slice(afterName).match(/^\s*\(/);
    if (!open) {
      index = afterName;
      continue;
    }
    const openIndex = afterName + open[0].length - 1;
    const closeIndex = findMatchingParen(source, openIndex);
    if (closeIndex === -1) break;
    calls.push(source.slice(openIndex + 1, closeIndex));
    index = closeIndex + 1;
  }
  return calls;
}

function connectorLinkNames(dcConnectors) {
  const names = new Set();
  const walk = (value) => {
    if (typeof value === 'string') names.add(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(dcConnectors);
  return names;
}

function validateRequests(manifest, errors) {
  const domains = new Set(
    (Array.isArray(manifest.whiteListedDomains) ? manifest.whiteListedDomains : []).map(
      (domain) => String(domain).toLowerCase(),
    ),
  );
  const connections = connectorLinkNames(manifest.dcConnectors);
  const seenHosts = new Set();
  const seenConnections = new Set();

  for (const filePath of walkSourceFiles(resolve(root, 'src'))) {
    const source = readFileSync(filePath, 'utf8');
    const label = relative(root, filePath);
    for (const call of requestCalls(source)) {
      for (const url of topLevelPropertyValues(call, 'url')) {
        let hostname = '';
        try {
          hostname = new URL(url).hostname;
        } catch {
          errors.push(`${label}: app.request url must be an absolute URL ("${url}").`);
          continue;
        }
        const key = hostname.toLowerCase();
        if (!seenHosts.has(key) && !domains.has(key)) {
          errors.push(
            `${label}: app.request host "${hostname}" is missing from whiteListedDomains.`,
          );
        }
        seenHosts.add(key);
      }

      for (const connection of topLevelPropertyValues(call, 'connection')) {
        if (!seenConnections.has(connection) && !connections.has(connection)) {
          errors.push(
            `${label}: app.request connection "${connection}" is missing from dcConnectors.`,
          );
        }
        seenConnections.add(connection);
      }
    }
  }
}

export function validateExtension({ packaged = false } = {}) {
  const errors = [];
  const manifestPath = resolve(root, 'plugin-manifest.json');
  const indexPath = resolve(root, 'index.html');

  if (!projectConfig.name?.trim()) {
    errors.push('projectConfig.name is required.');
  }

  httpsUrl(projectConfig.hostSdk?.sdkUrl, 'projectConfig.hostSdk.sdkUrl', errors);
  httpsUrl(
    projectConfig.hostSdk?.frameClientUrl,
    'projectConfig.hostSdk.frameClientUrl',
    errors,
  );

  if (!existsSync(manifestPath)) {
    errors.push('plugin-manifest.json is required at the project root.');
    throw new Error(`Extension validation failed:\n- ${errors.join('\n- ')}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    errors.push('plugin-manifest.json is not valid JSON.');
    throw new Error(`Extension validation failed:\n- ${errors.join('\n- ')}`);
  }

  if (manifest.service !== 'BACKSTAGE') {
    errors.push('plugin-manifest.json service must be BACKSTAGE.');
  }
  if (!Array.isArray(manifest.locale) || manifest.locale.length === 0) {
    errors.push('plugin-manifest.json locale is required.');
  }
  if (!Array.isArray(manifest.whiteListedDomains)) {
    errors.push('plugin-manifest.json whiteListedDomains must be an array.');
  }
  if (!Array.isArray(manifest.modules?.widgets) || manifest.modules.widgets.length === 0) {
    errors.push('plugin-manifest.json must declare at least one widget.');
  }

  const widgets = manifest.modules?.widgets || [];
  const ids = new Set();
  const locations = new Set();
  let backgroundCount = 0;

  for (const [index, widget] of widgets.entries()) {
    const label = `widget ${index + 1}`;
    if (!widget?.id || typeof widget.id !== 'string') {
      errors.push(`${label}: id is required.`);
    } else if (ids.has(widget.id)) {
      errors.push(`${label}: duplicate id "${widget.id}".`);
    }
    ids.add(widget.id);

    if (!widget.location) {
      errors.push(`${label}: location is required.`);
      continue;
    }
    if (locations.has(widget.location)) {
      errors.push(`${label}: duplicate location "${widget.location}".`);
    }
    locations.add(widget.location);

    const location = staticLocation(widget.location);
    if (!SUPPORTED_LOCATIONS.has(location)) {
      errors.push(`${label}: unsupported location "${location}".`);
    }
    if (location === 'backstage.background.process') {
      backgroundCount += 1;
    }
    if (ROUTE_ONLY_LOCATIONS.has(location) && widget.viewMode !== 'route') {
      errors.push(`${label}: ${location} requires viewMode "route".`);
    }

    if (typeof widget.url !== 'string' || !widget.url.trim()) {
      errors.push(`${label}: url is required.`);
    } else if (!resolveAppPath(widget.url)) {
      errors.push(`${label}: url must start with /app/.`);
    }

    if (widget.viewMode === 'route') {
      if (!widget.navigationConfig?.customPath) {
        errors.push(`${label}: route widgets require navigationConfig.customPath.`);
      }
      if (!widget.navigationConfig?.url) {
        errors.push(`${label}: route widgets require navigationConfig.url.`);
      } else if (!resolveAppPath(widget.navigationConfig.url)) {
        errors.push(`${label}: route navigationConfig.url must start with /app/.`);
      }
    } else if (widget.viewMode === 'popup') {
      if (!widget.popupConfig?.position) {
        errors.push(`${label}: popup widgets require popupConfig.position.`);
      }
      if (!widget.popupConfig?.action) {
        errors.push(`${label}: popup widgets require popupConfig.action.`);
      }
    } else if (widget.viewMode === 'newTab') {
      const urlType = widget.navigationConfig?.urlType;
      if (urlType !== 'static' && urlType !== 'dynamic') {
        errors.push(`${label}: newTab widgets require navigationConfig.urlType.`);
      }
      if (urlType === 'static' && !widget.navigationConfig?.url) {
        errors.push(`${label}: static newTab widgets require navigationConfig.url.`);
      }
      if (urlType === 'dynamic' && !widget.navigationConfig?.method) {
        errors.push(`${label}: dynamic newTab widgets require navigationConfig.method.`);
      }
    }
  }

  if (backgroundCount > 1) {
    errors.push('Only one backstage.background.process widget is allowed.');
  }

  validateRequests(manifest, errors);

  if (!existsSync(indexPath)) {
    errors.push('index.html is required.');
  } else {
    const html = readFileSync(indexPath, 'utf8');
    const sdkIndex = html.indexOf(projectConfig.hostSdk.sdkUrl);
    const clientIndex = html.indexOf(projectConfig.hostSdk.frameClientUrl);
    if (sdkIndex === -1) {
      errors.push('index.html must load the Backstage ZSDK script.');
    }
    if (clientIndex === -1) {
      errors.push('index.html must load the Backstage frame client.');
    }
    if (sdkIndex !== -1 && clientIndex !== -1 && sdkIndex > clientIndex) {
      errors.push('index.html must load ZSDK before the Backstage frame client.');
    }
  }

  if (packaged) {
    for (const widget of widgets) {
      for (const url of packagedTargets(widget)) {
        const relativePath = resolveAppPath(url);
        if (!relativePath) continue;
        const packagedFile = resolve(root, relativePath);
        if (!existsSync(packagedFile)) {
          errors.push(`Packaged file missing for ${widget.id}: ${relativePath}`);
          continue;
        }
        if (relativePath.endsWith('.html')) {
          const html = readFileSync(packagedFile, 'utf8');
          const sdkIndex = html.indexOf(projectConfig.hostSdk.sdkUrl);
          const clientIndex = html.indexOf(projectConfig.hostSdk.frameClientUrl);
          if (sdkIndex === -1 || clientIndex === -1 || sdkIndex > clientIndex) {
            errors.push(
              `${relativePath} must load ZSDK before the Backstage frame client.`,
            );
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Extension validation failed:\n- ${errors.join('\n- ')}`);
  }

  return {
    widgetCount: widgets.length,
    ids: [...ids],
  };
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  try {
    const result = validateExtension();
    console.log(
      `✓ Extension is valid (${result.widgetCount} widget${
        result.widgetCount === 1 ? '' : 's'
      })`,
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
