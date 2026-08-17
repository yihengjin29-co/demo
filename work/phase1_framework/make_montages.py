from pathlib import Path
from PIL import Image, ImageDraw

src = Path(r"C:\Users\Yiheng.jin\demo\work\phase1_framework\final_pages")
out = Path(r"C:\Users\Yiheng.jin\demo\work\phase1_framework\montages")
out.mkdir(exist_ok=True)
files = sorted(src.glob("page-*.png"))
for group_index in range(0, len(files), 6):
    group = files[group_index:group_index + 6]
    thumbs = []
    for p in group:
        img = Image.open(p).convert("RGB")
        target_w = 420
        target_h = round(img.height * target_w / img.width)
        img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (target_w + 16, target_h + 42), "white")
        canvas.paste(img, (8, 30))
        ImageDraw.Draw(canvas).text((8, 7), p.stem, fill="black")
        thumbs.append(canvas)
    cols = 3
    rows = (len(thumbs) + cols - 1) // cols
    cw = max(t.width for t in thumbs)
    ch = max(t.height for t in thumbs)
    sheet = Image.new("RGB", (cols * cw, rows * ch), (220, 220, 220))
    for i, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((i % cols) * cw, (i // cols) * ch))
    sheet.save(out / f"montage-{group_index // 6 + 1}.png")
