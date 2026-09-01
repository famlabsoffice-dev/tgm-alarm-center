from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/tgm-alarm-center/store-assets')
source = root / 'tgm-alarm-center-icon.png'
image = Image.open(source).convert('RGB')
for filename, size in [('google-play-icon-512.png', 512), ('app-store-icon-1024.png', 1024)]:
    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(root / filename, format='PNG', optimize=True)
    print(f'created {filename}: {size}x{size}')
