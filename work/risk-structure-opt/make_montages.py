from pathlib import Path
import sys

from PIL import Image, ImageDraw


src = Path(sys.argv[1])
out = Path(sys.argv[2])
group_size = int(sys.argv[3]) if len(sys.argv) > 3 else 2
out.mkdir(parents=True, exist_ok=True)
files = sorted(src.glob("page-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
for group_index in range(0, len(files), group_size):
    group = files[group_index:group_index + group_size]
    panels = []
    for path in group:
        page = Image.open(path).convert("RGB")
        target_w = 760
        target_h = round(page.height * target_w / page.width)
        page = page.resize((target_w, target_h), Image.Resampling.LANCZOS)
        panel = Image.new("RGB", (target_w + 20, target_h + 48), "white")
        panel.paste(page, (10, 38))
        ImageDraw.Draw(panel).text((10, 10), path.stem, fill="black")
        panels.append(panel)
    sheet = Image.new(
        "RGB",
        (sum(panel.width for panel in panels), max(panel.height for panel in panels)),
        (220, 220, 220),
    )
    offset = 0
    for panel in panels:
        sheet.paste(panel, (offset, 0))
        offset += panel.width
    sheet.save(out / f"montage-{group_index // group_size + 1:02d}.png")
