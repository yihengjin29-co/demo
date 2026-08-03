import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Yiheng.jin\demo")
APP = (ROOT / "src" / "App.tsx").read_text(encoding="utf-8")


def unique(items):
    seen = set()
    result = []
    for item in items:
        item = re.sub(r"\s+", " ", item).strip()
        if item and item not in seen:
            seen.add(item)
            result.append(item)
    return result


starts = list(re.finditer(r"(?m)^function\s+([A-Za-z0-9_]+)\s*\(", APP))
components = {}
for index, match in enumerate(starts):
    start = match.start()
    end = starts[index + 1].start() if index + 1 < len(starts) else len(APP)
    block = APP[start:end]
    name = match.group(1)
    components[name] = {
        "page_titles": unique(re.findall(r'<Page\s+title="([^"]+)"', block)),
        "sections": unique(re.findall(r'<Section\s+title="([^"]+)"', block)),
        "fields": unique(re.findall(r'<Field\s+label="([^"]+)"', block)),
        "columns": unique(re.findall(r'<th(?:\s[^>]*)?>([^<>{]+)</th>', block)),
        "buttons": unique(re.findall(r'<Button(?:\s[^>]*)?>([^<>{]+)</Button>', block)),
        "text_actions": unique(re.findall(r'<TextAction(?:\s[^>]*)?>([^<>{]+)</TextAction>', block)),
        "tabs": unique(re.findall(r'className="tab[^\"]*"[^>]*>([^<>{]+)<', block)),
        "select_options": unique(re.findall(r"options=\{\[([^\]]+)\]\}", block)),
        "navigate_paths": [],
        "status_literals": unique(re.findall(r"(?:status|result|level|currentLightStatus)\s*(?:===|=|:)\s*['\"]([^'\"]+)['\"]", block)),
    }
    components[name]["navigate_paths"] = unique(
        next((x for x in group if x), "") for group in re.findall(r"navigate\((?:`([^`]+)`|'([^']+)'|\"([^\"]+)\")\)", block)
    )

menu_match = re.search(r"const menus: MenuItem\[\] = \[(.*?)\n\];", APP, re.S)
menu_text = menu_match.group(1) if menu_match else ""
menu_entries = []
for root in re.finditer(r"\{\s*label:\s*'([^']+)'\s*,\s*(?:path:\s*'([^']+)'\s*,\s*)?icon:\s*'([^']+)'(.*?)(?=\n\s*\{\s*label:|\Z)", menu_text, re.S):
    label, path, icon, rest = root.groups()
    children = [
        {"label": child[0], "path": child[1], "roles": re.findall(r"'([^']+)'", child[2] or "")}
        for child in re.findall(r"\{ label: '([^']+)', path: '([^']+)'(?:, roles: \[([^\]]+)\])? \}", rest)
    ]
    menu_entries.append({"label": label, "path": path or None, "icon": icon, "children": children})

route_pairs = []
for pattern in [
    r"if \(path === '([^']+)'\) return <([A-Za-z0-9_]+)",
    r"if \(path\.startsWith\('([^']+)'\)\) return <([A-Za-z0-9_]+)",
    r"if \(path\.match\(/([^/]+)/\)\) return <([A-Za-z0-9_]+)",
]:
    route_pairs += [{"route_test": a, "component": b} for a, b in re.findall(pattern, APP)]

service_files = {}
for path in sorted((ROOT / "src" / "services").glob("*.ts")):
    text = path.read_text(encoding="utf-8")
    service_files[path.name] = {
        "exports": unique(re.findall(r"export\s+(?:const|function|class|type)\s+([A-Za-z0-9_]+)", text)),
        "methods": unique(re.findall(r"\b([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{", text)),
        "status_literals": unique(re.findall(r"(?:status|result|level|currentLightStatus)\s*(?:===|=|:)\s*['\"]([^'\"]+)['\"]", text)),
    }

types_text = (ROOT / "src" / "types.ts").read_text(encoding="utf-8")
type_defs = {}
for match in re.finditer(r"export type\s+([A-Za-z0-9_]+)\s*=\s*\{(.*?)\n\};", types_text, re.S):
    name, body = match.groups()
    type_defs[name] = [
        {"field": field, "type": re.sub(r"\s+", " ", value).strip()}
        for field, value in re.findall(r"(?m)^\s*([A-Za-z0-9_]+\??):\s*([^;]+);", body)
    ]

payload = {
    "menus": menu_entries,
    "routes": route_pairs,
    "components": components,
    "services": service_files,
    "types": type_defs,
}
(ROOT / "work" / "docx-v2" / "project-inventory.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(json.dumps({
    "menu_count": len(menu_entries),
    "component_count": len(components),
    "route_count": len(route_pairs),
    "type_count": len(type_defs),
    "service_count": len(service_files),
}, ensure_ascii=False))
