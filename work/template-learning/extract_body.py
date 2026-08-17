from pathlib import Path
from docx import Document

src = Path(r"C:\Users\Yiheng.jin\Desktop\SHGJ\业务功能说明书\并表系统需求说明书V1.2.docx")
doc = Document(src)
for i, p in enumerate(doc.paragraphs):
    if i < 59:
        continue
    text = p.text.strip()
    drawings = len(p._p.xpath(".//w:drawing")) + len(p._p.xpath(".//w:pict"))
    if text or drawings:
        print(f"{i}\t{p.style.name if p.style else ''}\tdraw={drawings}\t{text[:1000]}")
