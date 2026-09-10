import os
from PIL import Image, ImageDraw

def main():
    for d in ['public', 'resources', 'build']:
        os.makedirs(d, exist_ok=True)

    svg_content = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
  <rect width="800" height="800" rx="120" fill="#09090b"/>
  <path fill="#fff" fill-rule="evenodd" d="
    M165.29 165.29
    H517.36
    V400
    H400
    V517.36
    H282.65
    V634.72
    H165.29
    Z
    M282.65 282.65
    V400
    H400
    V282.65
    Z
  "/>
  <path fill="#fff" d="M517.36 400 H634.72 V634.72 H517.36 Z"/>
</svg>
"""

    with open('public/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open('resources/icon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)

    S = 4
    size = 800 * S
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([0, 0, size, size], radius=int(120 * S), fill=(9, 9, 11, 255))

    p1_outer = [
        (165.29 * S, 165.29 * S),
        (517.36 * S, 165.29 * S),
        (517.36 * S, 400.0 * S),
        (400.0 * S, 400.0 * S),
        (400.0 * S, 517.36 * S),
        (282.65 * S, 517.36 * S),
        (282.65 * S, 634.72 * S),
        (165.29 * S, 634.72 * S)
    ]
    draw.polygon(p1_outer, fill=(255, 255, 255, 255))

    p1_inner = [
        (282.65 * S, 282.65 * S),
        (400.0 * S, 282.65 * S),
        (400.0 * S, 400.0 * S),
        (282.65 * S, 400.0 * S)
    ]
    draw.polygon(p1_inner, fill=(9, 9, 11, 255))

    p2 = [
        (517.36 * S, 400.0 * S),
        (634.72 * S, 400.0 * S),
        (634.72 * S, 634.72 * S),
        (517.36 * S, 634.72 * S)
    ]
    draw.polygon(p2, fill=(255, 255, 255, 255))

    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save('public/icon.png', 'PNG')
    img_512.save('resources/icon.png', 'PNG')
    img_512.save('build/icon.png', 'PNG')

    img_256 = img.resize((256, 256), Image.Resampling.LANCZOS)
    img_256.save('resources/icon-256.png', 'PNG')

    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img_256.save('resources/icon.ico', format='ICO', sizes=sizes)
    img_256.save('build/icon.ico', format='ICO', sizes=sizes)

    print('Icon generation complete:')
    for p in ['public/favicon.svg', 'public/icon.png', 'resources/icon.svg', 'resources/icon.png', 'resources/icon.ico', 'build/icon.ico', 'build/icon.png']:
        print(f' - {p}: {os.path.exists(p)} ({os.path.getsize(p)} bytes)')

if __name__ == '__main__':
    main()
