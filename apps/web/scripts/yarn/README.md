# Yarn and cloth textures

The interface draws free threads with a twisted-wool texture and lays the
pages on woven cloth. These raster tiles live in `public/yarn/` and are
generated, not hand-made: the plies, gradients and fuzz filter follow the
brand generator in `Knot-Lana/knot_yarn_generator.py`.

Regenerate (from `apps/web`, Python 3 with Pillow, Playwright's Chromium):

```sh
python3 scripts/yarn/generate.py /tmp/yarn-svg
node scripts/yarn/render.mjs /tmp/yarn-svg /tmp/yarn-png
python3 -c "from PIL import Image; import os; [Image.open('/tmp/yarn-png/'+f).convert('RGBA').save('public/yarn/'+f[:-4]+'.webp', quality=86, method=6) for f in os.listdir('/tmp/yarn-png')]"
```

- `<colour>.webp` / `<colour>-ply2.webp`: seamless horizontal strips (96x24
  CSS px at 2x) for each thread colour; `base` is the busy under-thread.
- `cloth-ground.webp`, `cloth-surface.webp`, `cloth-ink.webp`: weaves that
  wrap in both directions (96x96 CSS px at 2x).

`globals.css` maps each thread colour to its strip (`.yarn[style*=...]`),
so components keep passing only `threadColor(index).value`.

## Link preview assets

`src/assets/og/` holds the same material for the invite link preview
(`app/g/[code]/opengraph-image.tsx`, which renders plain `img` elements):
the ground and ink cloth tiled at 96 px into JPEGs, the lockup as PNG and
four yarn strips as PNG. Rebuild them from `public/` after regenerating:

```sh
python3 - <<'PY'
from PIL import Image
def tile(src, w, h, size=96):
    t = Image.open(src).convert("RGB").resize((size, size), Image.LANCZOS)
    c = Image.new("RGB", (w, h))
    for y in range(0, h, size):
        for x in range(0, w, size):
            c.paste(t, (x, y))
    return c
o = "src/assets/og/"
tile("public/yarn/cloth-ground.webp", 1200, 630).save(o + "cloth-ground.jpg", quality=80, optimize=True)
tile("public/yarn/cloth-ink.webp", 1200, 400).save(o + "cloth-ink.jpg", quality=80, optimize=True)
Image.open("public/brand/knot-lockup.webp").convert("RGBA").save(o + "knot-lockup.png", optimize=True)
for c in ["indigo", "ochre", "moss", "rose"]:
    Image.open(f"public/yarn/{c}.webp").convert("RGBA").save(o + f"yarn-{c}.png", optimize=True)
PY
```

Inline styles on a `.yarn` element must set `backgroundColor`, never the
`background` shorthand: the shorthand resets `background-image` and the
thread turns flat (`e2e/yarn.spec.ts` guards the home page).
