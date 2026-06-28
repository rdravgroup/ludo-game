# One-time utility script that generates polished placeholder app icon,
# splash screen, adaptive icon, and favicon. Not part of the app's runtime.
# Requires Pillow: pip install Pillow
#
# These are deliberately nicer than "flat colored shapes" — gradient dice
# face, soft shadow, rounded depth — so they look production-acceptable
# until you swap in final branded art (see README "Replacing Assets").

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math

BG_TOP = (45, 27, 78)      # matches Colors.backgroundGradient[0]
BG_BOTTOM = (26, 17, 53)   # matches Colors.backgroundGradient[1]
PRIMARY = (124, 92, 252)
ACCENT = (255, 181, 71)
RED = (229, 62, 62)
GREEN = (56, 161, 105)
YELLOW = (214, 158, 46)
BLUE = (49, 130, 206)
WHITE = (255, 255, 255)


def vertical_gradient(size, top, bottom):
    img = Image.new('RGB', (1, size[1]), color=0)
    for y in range(size[1]):
        t = y / max(size[1] - 1, 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        img.putpixel((0, y), (r, g, b))
    return img.resize(size)


def radial_highlight(size, color, strength=60):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = size * 0.35, size * 0.3
    r = size * 0.5
    for i in range(int(r), 0, -2):
        alpha = int(strength * (1 - i / r))
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(255, 255, 255, alpha))
    return img


def draw_shaded_pip(draw, cx, cy, r, color):
    draw.ellipse([cx - r + r*0.08, cy - r + r*0.12, cx + r + r*0.08, cy + r + r*0.12],
                 fill=(0, 0, 0, 40))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)


def draw_die(size, pip_quad=True, border_color=PRIMARY):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pad = size * 0.10
    radius = size * 0.20

    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [pad + size*0.03, pad + size*0.05, size - pad + size*0.03, size - pad + size*0.05],
        radius=radius, fill=(0, 0, 0, 90)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.025))
    img = Image.alpha_composite(img, shadow)

    face_grad = vertical_gradient((size, size), (255, 255, 255), (236, 233, 250))
    face_mask = Image.new('L', (size, size), 0)
    fmd = ImageDraw.Draw(face_mask)
    fmd.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius, fill=255)
    img.paste(face_grad, (0, 0), face_mask)

    d = ImageDraw.Draw(img)
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius,
                         outline=border_color, width=max(2, int(size * 0.018)))

    if pip_quad:
        cx, cy = size / 2, size / 2
        r = size * 0.082
        offset = size * 0.165
        positions = [
            (cx - offset, cy - offset, RED),
            (cx + offset, cy - offset, GREEN),
            (cx + offset, cy + offset, YELLOW),
            (cx - offset, cy + offset, BLUE),
        ]
        for (px, py, color) in positions:
            draw_shaded_pip(d, px, py, r, color)

    gloss = radial_highlight(size, WHITE, strength=50)
    img = Image.alpha_composite(img, gloss)
    return img


def make_icon(path, size=1024):
    img = vertical_gradient((size, size), BG_TOP, BG_BOTTOM).convert('RGBA')
    die = draw_die(int(size * 0.86))
    offset = (size - die.width) // 2
    img.alpha_composite(die, (offset, offset))
    img.convert('RGB').save(path, 'PNG')


def make_adaptive_icon(path, size=1024):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    die = draw_die(int(size * 0.60))
    offset = (size - die.width) // 2
    img.alpha_composite(die, (offset, offset))
    img.save(path, 'PNG')


def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


TITLE_FONT_PATH = '/mnt/skills/examples/canvas-design/canvas-fonts/BigShoulders-Bold.ttf'
BODY_FONT_PATH = '/mnt/skills/examples/canvas-design/canvas-fonts/BricolageGrotesque-Regular.ttf'


def draw_centered_text(img, text, font, fill, center_x, top_y):
    """Draws text centered horizontally at center_x, top edge at top_y.
    Returns the height consumed."""
    d = ImageDraw.Draw(img)
    bbox = d.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = center_x - text_w / 2 - bbox[0]
    y = top_y - bbox[1]
    d.text((x, y), text, font=font, fill=fill)
    return text_h


def make_splash(path, w=1284, h=2778):
    img = vertical_gradient((w, h), BG_TOP, BG_BOTTOM).convert('RGBA')

    glow_size = int(w * 0.75)
    glow = Image.new('RGBA', (glow_size, glow_size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([0, 0, glow_size, glow_size], fill=(124, 92, 252, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(glow_size * 0.12))

    die_size = int(w * 0.46)
    die = draw_die(die_size)

    gx = (w - glow_size) // 2
    gy = (h - glow_size) // 2 - int(h * 0.06)
    img.alpha_composite(glow, (gx, gy))

    dx = (w - die_size) // 2
    dy = (h - die_size) // 2 - int(h * 0.06)
    img.alpha_composite(die, (dx, dy))

    title_font = get_font(TITLE_FONT_PATH, int(w * 0.105))
    body_font = get_font(BODY_FONT_PATH, int(w * 0.038))

    title_top = dy + die_size + int(h * 0.035)
    title_h = draw_centered_text(img, "LUDO ROYALE", title_font, WHITE, w / 2, title_top)

    sub_top = title_top + title_h + int(h * 0.018)
    draw_centered_text(img, "Roll. Race. Rule the Board.", body_font, (184, 174, 219, 255), w / 2, sub_top)

    img.convert('RGB').save(path, 'PNG')


def make_favicon(path, size=196):
    img = vertical_gradient((size, size), BG_TOP, BG_BOTTOM).convert('RGBA')
    die = draw_die(int(size * 0.86))
    offset = (size - die.width) // 2
    img.alpha_composite(die, (offset, offset))
    img.convert('RGB').save(path, 'PNG')


make_icon('/home/claude/ludo-game/assets/icon.png')
make_adaptive_icon('/home/claude/ludo-game/assets/adaptive-icon.png')
make_splash('/home/claude/ludo-game/assets/splash.png')
make_favicon('/home/claude/ludo-game/assets/favicon.png')
print("Generated polished placeholder image assets successfully.")
