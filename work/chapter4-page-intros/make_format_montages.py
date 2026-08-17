from pathlib import Path
from PIL import Image, ImageDraw

src = Path(r"C:\Users\Yiheng.jin\demo\work\chapter4-page-intros\qa_format_opt_word_v2")
out = Path(r"C:\Users\Yiheng.jin\demo\work\chapter4-page-intros\qa_format_opt_montages_v2")
out.mkdir(parents=True, exist_ok=True)
files = sorted(src.glob("page-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
target_w, gap, label_h = 800, 24, 36
for start in range(0, len(files), 4):
    tiles = []
    for path in files[start:start + 4]:
        image = Image.open(path).convert("RGB")
        target_h = round(image.height * target_w / image.width)
        image = image.resize((target_w, target_h), Image.Resampling.LANCZOS)
        tile = Image.new("RGB", (target_w, target_h + label_h), "white")
        tile.paste(image, (0, label_h))
        ImageDraw.Draw(tile).text((10, 8), f"Page {int(path.stem.split('-')[-1])}", fill="black")
        tiles.append(tile)
    tile_h = max(t.height for t in tiles)
    canvas = Image.new("RGB", (target_w * 2 + gap * 3, tile_h * 2 + gap * 3), (210, 210, 210))
    for i, tile in enumerate(tiles):
        canvas.paste(tile, (gap + (i % 2) * (target_w + gap), gap + (i // 2) * (tile_h + gap)))
    canvas.save(out / f"montage-{start // 4 + 1:02d}.jpg", quality=90)
print(f"pages={len(files)} montages={(len(files) + 3) // 4}")
