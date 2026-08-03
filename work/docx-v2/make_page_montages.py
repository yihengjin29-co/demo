from pathlib import Path
import os
from PIL import Image, ImageDraw, ImageFont, ImageStat, ImageChops
import json

ROOT = Path(os.environ.get("MONTAGE_ROOT", r"C:\Users\Yiheng.jin\demo\work\docx-v2\final-render"))
PAGES = sorted((ROOT / "pages").glob("page-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
OUT = ROOT / "montages"
OUT.mkdir(exist_ok=True)
font = ImageFont.truetype(r"C:\Windows\Fonts\msyhbd.ttc", 24)

records = []
for index, path in enumerate(PAGES, start=1):
    image = Image.open(path).convert("L")
    inverted = ImageChops.invert(image)
    bbox = inverted.point(lambda value: 255 if value > 18 else 0).getbbox()
    stat = ImageStat.Stat(image)
    dark_pixels = sum(1 for value in image.resize((120, 170)).getdata() if value < 245)
    records.append({
        "page": index,
        "path": str(path),
        "size": image.size,
        "mean": round(stat.mean[0], 2),
        "stddev": round(stat.stddev[0], 2),
        "ink_ratio_sample": round(dark_pixels / (120 * 170), 4),
        "bbox": bbox,
    })

for group_index in range(0, len(PAGES), 4):
    group = PAGES[group_index:group_index + 4]
    opened = [Image.open(path).convert("RGB") for path in group]
    width = max(image.width for image in opened)
    height = max(image.height for image in opened)
    canvas = Image.new("RGB", (width * 2 + 30, (height + 42) * 2 + 30), "#777777")
    draw = ImageDraw.Draw(canvas)
    for offset, (path, image) in enumerate(zip(group, opened)):
        x = (offset % 2) * (width + 30)
        y = (offset // 2) * (height + 42)
        page_no = int(path.stem.split("-")[-1])
        draw.rectangle((x, y, x + width, y + 40), fill="#222222")
        draw.text((x + 12, y + 6), f"Page {page_no}", fill="white", font=font)
        canvas.paste(image, (x, y + 42))
    out_path = OUT / f"montage-{group_index // 4 + 1:02d}.png"
    canvas.save(out_path, "PNG")

(ROOT / "image-audit.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
sparse = [record for record in records if record["ink_ratio_sample"] < 0.02]
print(json.dumps({"pages": len(PAGES), "montages": len(list(OUT.glob('montage-*.png'))), "sparse_pages": sparse}, ensure_ascii=False, indent=2))
