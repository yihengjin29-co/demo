from pathlib import Path
from PIL import Image, ImageDraw

src = Path(r"C:\Users\Yiheng.jin\demo\work\permission-matrix\pages")
out = Path(r"C:\Users\Yiheng.jin\demo\work\permission-matrix\montages")
out.mkdir(parents=True, exist_ok=True)
files = sorted(src.glob("page-*.png"))
for group_index in range(0, len(files), 6):
    group = files[group_index:group_index + 6]
    thumbs = []
    for path in group:
        page = Image.open(path).convert("RGB")
        target_w = 560
        target_h = round(page.height * target_w / page.width)
        page = page.resize((target_w, target_h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (target_w + 16, target_h + 42), "white")
        canvas.paste(page, (8, 30))
        ImageDraw.Draw(canvas).text((8, 7), path.stem, fill="black")
        thumbs.append(canvas)
    cols = 3
    rows = (len(thumbs) + cols - 1) // cols
    cell_w = max(thumb.width for thumb in thumbs)
    cell_h = max(thumb.height for thumb in thumbs)
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (220, 220, 220))
    for index, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((index % cols) * cell_w, (index // cols) * cell_h))
    sheet.save(out / f"montage-{group_index // 6 + 1}.png")

