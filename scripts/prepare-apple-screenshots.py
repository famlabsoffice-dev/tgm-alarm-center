from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/tgm-alarm-center/store-assets')
targets = {
    'apple-6.9': (1290, 2796),
    'apple-6.5': (1284, 2778),
}
inputs = [
    ('screenshot-01-dashboard.png', '01-dashboard.png'),
    ('screenshot-02-warnings.png', '02-warnings.png'),
    ('apple-screenshot-03-gw-cycle-clean.png', '03-gw-cycle.png'),
    ('apple-screenshot-04-backup-clean.png', '04-backup.png'),
]
for folder_name, target in targets.items():
    out = root / folder_name
    out.mkdir(exist_ok=True)
    for source_name, output_name in inputs:
        source = Image.open(root / source_name).convert('RGB')
        scale = min(target[0] / source.width, target[1] / source.height)
        size = (round(source.width * scale), round(source.height * scale))
        resized = source.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new('RGB', target, (0, 0, 0))
        offset = ((target[0] - size[0]) // 2, (target[1] - size[1]) // 2)
        canvas.paste(resized, offset)
        canvas.save(out / output_name, format='PNG', optimize=True)
        print(f'created {folder_name}/{output_name}: {target[0]}x{target[1]} RGB')
