from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

size = 1024
scale = 4
canvas_size = size * scale
image = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

radius = 224 * scale
draw.rounded_rectangle((0, 0, canvas_size - 1, canvas_size - 1), radius=radius, fill='#c91f35')
triangle = [(512 * scale, 160 * scale), (824 * scale, 744 * scale), (200 * scale, 744 * scale)]
draw.polygon(triangle, fill='#ffffff')
draw.rounded_rectangle((472 * scale, 336 * scale, 552 * scale, 560 * scale), radius=40 * scale, fill='#c91f35')
draw.ellipse((472 * scale, 608 * scale, 552 * scale, 688 * scale), fill='#c91f35')
image.resize((size, size), Image.Resampling.LANCZOS).save(Path(__file__).resolve().parents[1] / 'icon.png', optimize=True)
