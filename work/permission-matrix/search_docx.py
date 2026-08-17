from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path


def xml_text(xml: str) -> str:
    xml = re.sub(r"</w:(?:p|tr)>", "\n", xml)
    xml = re.sub(r"<[^>]+>", "", xml)
    return re.sub(r"[ \t]+", " ", xml)


def main() -> None:
    root = Path(sys.argv[1]).resolve()
    needles = sys.argv[2:] or ["页面功能权限建设方案", "权限矩阵", "并表驾驶舱"]
    for path in root.rglob("*.docx"):
        try:
            with zipfile.ZipFile(path) as archive:
                raw = archive.read("word/document.xml").decode("utf-8", errors="ignore")
            text = xml_text(raw)
        except Exception as exc:
            print(f"ERROR\t{path}\t{exc}")
            continue
        hits = [needle for needle in needles if needle in text]
        if hits:
            snippets = []
            for needle in hits:
                pos = text.find(needle)
                snippets.append(text[max(0, pos - 80): pos + len(needle) + 180].replace("\n", " "))
            print(f"MATCH\t{path}\t{','.join(hits)}")
            for snippet in snippets:
                print(f"  {snippet}")


if __name__ == "__main__":
    main()
