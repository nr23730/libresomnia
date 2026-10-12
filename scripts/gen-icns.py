#!/usr/bin/env python3
"""Build a PNG-container .icns from the generated icon set."""
import io
import struct
from PIL import Image

SIZES = {b"ic07": 128, b"ic08": 256, b"ic09": 512, b"ic10": 1024,
         b"ic11": 16, b"ic12": 32, b"ic13": 64, b"ic14": 32}

img = Image.open("/tmp/libresomnia-icons/icon_1024.png")
entries = []
for tag, s in SIZES.items():
    im = img.resize((s, s), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    data = buf.getvalue()
    entries.append(tag + struct.pack(">I", len(data) + 8) + data)
body = b"".join(entries)
out = "/home/nreimer/insomnia-build/packages/insomnia/src/icons/icon.icns"
with open(out, "wb") as f:
    f.write(b"icns" + struct.pack(">I", len(body) + 8) + body)
print("icns bytes:", len(body) + 8)
