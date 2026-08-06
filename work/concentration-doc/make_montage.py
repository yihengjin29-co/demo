from pathlib import Path
import sys

from PIL import Image, ImageDraw


pages_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("pages")
selected = list(range(int(sys.argv[2]), int(sys.argv[3]) + 1)) if len(sys.argv) > 3 else list(range(64, 77))
columns = 4
thumb_width = 496
label_height = 28
images = []
for page_number in selected:
    image = Image.open(pages_dir / f"page-{page_number:03d}.png").convert("RGB")
    height = round(image.height * thumb_width / image.width)
    images.append((page_number, image.resize((thumb_width, height))))

thumb_height = images[0][1].height
rows = (len(images) + columns - 1) // columns
montage = Image.new("RGB", (columns * thumb_width, rows * (thumb_height + label_height)), "#d9dee7")
draw = ImageDraw.Draw(montage)
for index, (page_number, image) in enumerate(images):
    x = index % columns * thumb_width
    y = index // columns * (thumb_height + label_height)
    draw.rectangle((x, y, x + thumb_width, y + label_height), fill="#26364f")
    draw.text((10, y + 6), f"Page {page_number}", fill="white")
    montage.paste(image, (x, y + label_height))

output = Path(sys.argv[4]) if len(sys.argv) > 4 else Path(__file__).with_name("concentration-pages-montage.png")
montage.save(output)
print(output)
