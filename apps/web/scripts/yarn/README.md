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
