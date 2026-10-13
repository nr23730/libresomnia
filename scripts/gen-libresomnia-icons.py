#!/usr/bin/env python3
# LOCAL BUILD: this file was modified relative to upstream Kong/insomnia (core@13.3.1) - see README.md
"""Generate Libresomnia icon set from the brand spec (C° mark on night gradient)."""
import math
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
C = (512, 512)          # arc center
R = 200                # arc radius (stroke centerline)
W = 76                 # stroke width
GAP = 35               # gap half-angle, opening to the right
SPLIT = 120            # white->mint boundary angle
DOT = (690, 342)
DOT_R = 23
BG_TOP = (58, 62, 92)      # #3A3E5C slate
BG_BOT = (59, 29, 77)      # #3B1D4D deep purple
MINT = (155, 240, 214)     # #9BF0D6
WHITE = (233, 251, 246)    # #E9FBF6
CORNER = 230

def polar(cx, cy, r, deg):
    a = math.radians(deg)
    return (cx + r * math.cos(a), cy - r * math.sin(a))

def arc_points(cx, cy, r, a0, a1, steps=200):
    return [polar(cx, cy, r, a0 + (a1 - a0) * i / steps) for i in range(steps + 1)]

def draw_arc_stroke(draw, pts, width, color):
    draw.line(pts, fill=color, width=width, joint="curve")
    for p in (pts[0], pts[-1]):
        draw.ellipse([p[0]-width/2, p[1]-width/2, p[0]+width/2, p[1]+width/2], fill=color)

def gradient_bg(size):
    img = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        # diagonal blend: top-left lighter, bottom-right darker
        col = tuple(int(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * t) for i in range(3)) + (255,)
        d.line([(0, y), (size, y)], fill=col)
    return img

def rounded_mask(size, corner):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=corner, fill=255)
    return m

def render_icon(size, transparent_bg=False):
    scale = size / SIZE
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if not transparent_bg:
        bg = gradient_bg(size).resize((size, size))
        mask = rounded_mask(size, int(CORNER * scale))
        img.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(img)
    cx, cy = C[0] * scale, C[1] * scale
    r, w = R * scale, max(2, W * scale)
    # glow: blurred mint copy of the full arc
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    full = arc_points(cx, cy, r, -GAP, 360 - GAP)
    draw_arc_stroke(gd, full, int(w * 1.6), MINT + (90,))
    glow = glow.filter(ImageFilter.GaussianBlur(max(2, 18 * scale)))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    # mint segment: 120deg -> 325deg (through left/bottom)
    draw_arc_stroke(d, arc_points(cx, cy, r, SPLIT, 360 - GAP), int(w), MINT)
    # white segment: 35deg -> 120deg (top)
    draw_arc_stroke(d, arc_points(cx, cy, r, GAP, SPLIT), int(w), WHITE)
    # dot
    dr = DOT_R * scale
    dx, dy = DOT[0] * scale, DOT[1] * scale
    d.ellipse([dx - dr, dy - dr, dx + dr, dy + dr], fill=(242, 251, 248, 255))
    return img

if __name__ == "__main__":
    import sys, os
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out, exist_ok=True)
    # PNG sizes for linux hicolor + electron-builder
    for s in (16, 24, 32, 48, 64, 128, 256, 512, 1024):
        render_icon(s).save(os.path.join(out, f"icon_{s}.png"))
    big = render_icon(1024)
    big.save(os.path.join(out, "icon.png"))
    # ICO (windows)
    big.resize((256, 256), Image.Resampling.LANCZOS).save(
        os.path.join(out, "icon.ico"),
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    # NSIS installer sidebar 164x400 (bmp)
    side = render_icon(400).resize((164, 400), Image.Resampling.LANCZOS).convert("RGB")
    side.save(os.path.join(out, "nsis-sidebar.bmp"))
    print("generated:", sorted(os.listdir(out)))
