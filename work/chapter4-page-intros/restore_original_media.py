from __future__ import annotations

import os
import tempfile
import zipfile
from pathlib import Path


SOURCE = Path(r"C:\Users\Yiheng.jin\demo\work\chapter4-page-intros\source.docx")
TARGET = Path(r"C:\Users\Yiheng.jin\demo\deliverables\金控并表系统业务功能需求说明书（一期）_页面说明精简版_格式优化版.docx")

with zipfile.ZipFile(SOURCE) as source_zip:
    source_media = {
        name: source_zip.read(name)
        for name in source_zip.namelist()
        if name.startswith("word/media/") and not name.endswith("/")
    }

fd, temp_name = tempfile.mkstemp(suffix=".docx", dir=TARGET.parent)
os.close(fd)
temp_path = Path(temp_name)

try:
    with zipfile.ZipFile(TARGET) as input_zip, zipfile.ZipFile(temp_path, "w") as output_zip:
        for item in input_zip.infolist():
            data = source_media.get(item.filename, input_zip.read(item.filename))
            output_zip.writestr(item, data)
    os.replace(temp_path, TARGET)
finally:
    if temp_path.exists():
        temp_path.unlink()

print(f"restored_media={len(source_media)}")
print(f"target={TARGET}")
