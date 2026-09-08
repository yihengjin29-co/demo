import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const styleFiles = [
  'base.css',
  'screen-layout.css',
  'executive-view.css',
  'detail-layout.css',
  'flag-layout.css',
  'custom-panels.css',
  'report-dialogs.css',
];
export const scriptFiles = [
  'base-runtime.js',
  'detail-data.js',
  'continuous-feed.js',
  'metric-selection.js',
  'warning-list.js',
  'org-monitoring.js',
  'event-reports.js',
  'executive-view.js',
];

function inline(template, marker, value) {
  if (template.split(marker).length !== 2) {
    throw new Error(`Expected exactly one template marker: ${marker}`);
  }
  return template.replace(marker, () => value);
}

export function buildHtml() {
  const read = (file) => fs.readFileSync(path.join(root, 'src', file), 'utf8');
  // Preserve CSS cascade and shared-script execution order for offline use.
  const css = styleFiles.map((file) => read(path.join('styles', file))).join('\n');
  const js = scriptFiles.map((file) => read(path.join('scripts', file))).join('\n');
  let html = read('page.html');
  html = inline(html, '/* COCKPIT_STYLES */', css);
  return inline(html, '/* COCKPIT_SCRIPT */', js);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = path.join(root, 'index.html');
  fs.writeFileSync(target, buildHtml(), 'utf8');
  console.log(`Built ${target}`);
}
