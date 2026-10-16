"""
app-icon-forge para CronoCash.

Genera, a partir del render maestro `public/app-icon.png` (JPEG opaco 1024x1024 con el icono
sobre un fondo oscuro), los activos de escritorio/web con transparencia real:

  public/app.ico               7 capas RGBA 32-bit: 16, 24, 32, 48, 64, 128, 256
  public/icon-192.png          192x192 RGBA, margen seguro transparente del 9 %
  public/icon-32.png           32x32 RGBA
  public/apple-touch-icon.png  180x180 opaco (iOS aplica su propia máscara)

Reglas aplicadas:
- El azulejo se recorta con una máscara de esquinas redondeadas suavizada (supermuestreo 4x),
  de modo que el fondo oscuro del render nunca aparece como un cuadrado en la barra de tareas.
- Margen seguro transparente del 9 % en todas las capas.
- LOD óptico: en 16 y 24 px se usa el interior del azulejo sin el doble marco exterior,
  que a ese tamaño solo aporta ruido, y se aplica SHARPEN a las capas <= 32 px.

Uso:  python scripts/build_multi_res_ico.py
"""

import io
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC = os.path.join(ROOT, "public")
SOURCE = os.path.join(PUBLIC, "app-icon.png")

ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
SAFE_MARGIN = 0.09
MASTER_SIZE = 1024
SUPERSAMPLE = 4

# Geometría del azulejo medida sobre el render maestro (coordenadas en 1024x1024)
TILE_BOX = (134, 134, 890, 890)  # borde exterior del marco, con 2 px de holgura
TILE_RADIUS = 220
INNER_BOX = (178, 178, 846, 846)  # interior del azulejo, sin el doble marco (LOD micro)
INNER_RADIUS = 150


def rounded_mask(size: int, radius: int) -> Image.Image:
    """Máscara alfa de esquinas redondeadas con bordes suavizados por supermuestreo."""
    big = size * SUPERSAMPLE
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, big - 1, big - 1), radius=radius * SUPERSAMPLE, fill=255
    )
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def cut_tile(source: Image.Image, box: tuple, radius: int) -> Image.Image:
    tile = source.crop(box).convert("RGBA")
    tile.putalpha(rounded_mask(tile.width, radius))
    return tile


def place_with_margin(tile: Image.Image, canvas_size: int) -> Image.Image:
    """Centra el azulejo en un lienzo transparente dejando el margen seguro."""
    content = round(canvas_size * (1 - 2 * SAFE_MARGIN))
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    scaled = tile.resize((content, content), Image.Resampling.LANCZOS)
    offset = (canvas_size - content) // 2
    canvas.alpha_composite(scaled, (offset, offset))
    return canvas


def sharpen_rgb_keep_alpha(frame: Image.Image) -> Image.Image:
    """SHARPEN sobre el color sin tocar el canal alfa (evita halos en el borde transparente)."""
    alpha = frame.getchannel("A")
    rgb = frame.convert("RGB").filter(ImageFilter.SHARPEN)
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def build() -> None:
    if not os.path.exists(SOURCE):
        raise SystemExit(f"[ERROR] No se encuentra el render maestro: {SOURCE}")

    source = Image.open(SOURCE).convert("RGB")
    if source.size != (MASTER_SIZE, MASTER_SIZE):
        source = source.resize((MASTER_SIZE, MASTER_SIZE), Image.Resampling.LANCZOS)

    full_tile = cut_tile(source, TILE_BOX, TILE_RADIUS)
    micro_tile = cut_tile(source, INNER_BOX, INNER_RADIUS)

    master = place_with_margin(full_tile, MASTER_SIZE)
    micro_master = place_with_margin(micro_tile, MASTER_SIZE)

    frames = []
    for size in ICO_SIZES:
        base = micro_master if size <= 24 else master
        frame = base.resize((size, size), Image.Resampling.LANCZOS)
        if size <= 32:
            frame = sharpen_rgb_keep_alpha(frame)
        frames.append(frame)

    ico_path = os.path.join(PUBLIC, "app.ico")
    frames[-1].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in ICO_SIZES],
        append_images=frames[:-1],
    )

    outputs = {
        "icon-192.png": master.resize((192, 192), Image.Resampling.LANCZOS),
        "icon-32.png": frames[ICO_SIZES.index(32)],
    }
    for name, img in outputs.items():
        img.save(os.path.join(PUBLIC, name), format="PNG", optimize=True)

    # iOS no admite transparencia en apple-touch-icon: azulejo completo opaco, iOS redondea las esquinas
    apple = source.crop(INNER_BOX).resize((180, 180), Image.Resampling.LANCZOS)
    apple.save(os.path.join(PUBLIC, "apple-touch-icon.png"), format="PNG", optimize=True)

    print(f"[OK] {os.path.relpath(ico_path, ROOT)} ({os.path.getsize(ico_path) // 1024} KB) capas {ICO_SIZES}")
    for name in [*outputs.keys(), "apple-touch-icon.png"]:
        path = os.path.join(PUBLIC, name)
        print(f"[OK] public/{name} ({os.path.getsize(path) // 1024} KB)")


if __name__ == "__main__":
    build()
