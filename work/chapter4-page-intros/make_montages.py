from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

src = Path(r"C:\Users\Yiheng.jin\demo\work\chapter4-page-intros\qa_pages")
out = Path(r"C:\Users\Yiheng.jin\demo\work\chapter4-page-intros\qa_montages")
out.mkdir(parents=True, exist_ok=True)
files = sorted(src.glob("page-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
target_w = 800
gap = 24
label_h = 36
for group_no in range(0, len(files), 4):
    group = files[group_no:group_no + 4]
    rendered = []
    for path in group:
        image = Image.open(path).convert("RGB")
        target_h = round(image.height * target_w / image.width)
        image = image.resize((target_w, target_h), Image.Resampling.LANCZOS)
        tile = Image.new("RGB", (target_w, target_h + label_h), "white")
        tile.paste(image, (0, label_h))
        draw = ImageDraw.Draw(tile)
        draw.text((10, 8), f"Page {int(path.stem.split('-')[-1])}", fill="black")
        rendered.append(tile)
    tile_h = max(im.height for im in rendered)
    canvas = Image.new("RGB", (target_w * 2 + gap * 3, tile_h * 2 + gap * 3), (210, 210, 210))
    for i, image in enumerate(rendered):
        x = gap + (i % 2) * (target_w + gap)
        y = gap + (i // 2) * (tile_h + gap)
        canvas.paste(image, (x, y))
    canvas.save(out / f"montage-{group_no // 4 + 1:02d}.jpg", quality=90)
print(f"pages={len(files)} montages={(len(files)+3)//4}")
