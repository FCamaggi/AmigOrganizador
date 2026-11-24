#!/usr/bin/env python3
"""Seamless yarn and cloth textures for the Knot interface.

Adapted from the brand generator in `Knot-Lana/knot_yarn_generator.py`: a
thread is twisted plies (rotated ellipses with an off-centre radial
gradient) over a dark core, roughened by a fractal-noise "fuzz" filter. Here
the plies run along a straight line and wrap at the tile edges, so a strip
repeats horizontally without a seam; the cloth is a plain weave of
alternating ellipses that wraps in both directions.

Writes SVG files to the output directory; `render.mjs` rasterises them.
Usage: python3 generate.py <out-dir>
"""

import os
import random
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "yarn-svg"
os.makedirs(OUT, exist_ok=True)

THREADS = {
    "indigo": "#2f4fa2",
    "ochre": "#9a6a0a",
    "moss": "#3e7d5a",
    "plum": "#7a4b9c",
    "teal": "#1f7a80",
    "rose": "#a8406e",
    "walnut": "#6b4a2b",
    "ink": "#23263a",
    "madder": "#b8322a",
    "base": "#5f6275",
}


def f(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def hx(c):
    c = c.lstrip("#")
    return [int(c[i : i + 2], 16) for i in (0, 2, 4)]


def mix(c, d, t):
    a, b = hx(c), hx(d)
    return "#" + "".join(f"{round(a[i] + (b[i] - a[i]) * t):02x}" for i in range(3))


def light(c, t):
    return mix(c, "#ffffff", t)


def dark(c, t):
    return mix(c, "#000000", t)


def grad(gid, c, hi=0.26, lo=0.32):
    return (
        f'<radialGradient id="{gid}" cx="0.5" cy="0.36" r="0.64">'
        f'<stop offset="0" stop-color="{light(c, hi)}"/>'
        f'<stop offset="0.55" stop-color="{c}"/>'
        f'<stop offset="1" stop-color="{dark(c, lo)}"/></radialGradient>'
    )


def fuzz(seed, scale, region='x="0" y="-20%" width="100%" height="140%"'):
    # stitchTiles keeps the noise periodic, so the texture has no seam.
    return (
        f'<filter id="fuzz" {region}>'
        f'<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="{seed}" stitchTiles="stitch" result="n"/>'
        f'<feDisplacementMap in="SourceGraphic" in2="n" scale="{scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>'
        f'<feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="1" seed="{seed + 6}" stitchTiles="stitch" result="n2"/>'
        f'<feColorMatrix in="n2" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 1.25" result="speck"/>'
        f'<feComposite in="speck" in2="d" operator="in" result="sp"/>'
        f'<feBlend in="sp" in2="d" mode="soft-light"/></filter>'
    )


def yarn_strip(name, color, plies=2):
    """A horizontal twisted thread, `plies` strands (1 or 2), 96x24 tile."""
    h = 24
    w_ply = 20 if plies == 1 else 10
    step = w_ply * 0.4
    n = round(96 / step)
    width = round(n * step)
    rows = [h / 2] if plies == 1 else [h / 2 - 5.5, h / 2 + 5.5]
    body = []
    for cy in rows:
        body.append(
            f'<rect x="0" y="{f(cy - w_ply * 0.42)}" width="{width}" height="{f(w_ply * 0.84)}" fill="{dark(color, 0.45)}"/>'
        )
        x = -2 * step
        while x < width + 2 * step:
            body.append(
                f'<ellipse cx="{f(x)}" cy="{f(cy)}" rx="{f(w_ply * 0.58)}" ry="{f(w_ply * 0.27)}" '
                f'transform="rotate(52 {f(x)} {f(cy)})" fill="url(#p)"/>'
            )
            x += step
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{h}" viewBox="0 0 {width} {h}">'
        f"<defs>{grad('p', color)}{fuzz(3, 2.2)}</defs>"
        f'<g filter="url(#fuzz)">{"".join(body)}</g></svg>'
    ), f"{name}{'' if plies == 1 else '-ply2'}"


FULL = 'x="0" y="0" width="100%" height="100%"'


def cloth(name, base, warp, weft, cell=8, cells=12, seed=4, fuzz_scale=1.6):
    """Plain weave that wraps in both directions: cells x cells ellipses."""
    size = cell * cells
    rnd = random.Random(seed)
    jitter = [[rnd.uniform(-0.5, 0.5) for _ in range(cells)] for _ in range(cells)]
    shade = [[rnd.random() for _ in range(cells)] for _ in range(cells)]
    items = []
    for j in range(-1, cells + 1):
        for i in range(-1, cells + 1):
            ii, jj = i % cells, j % cells
            cx, cy = i * cell + cell / 2, j * cell + cell / 2
            g = "a" if shade[jj][ii] > 0.3 else "b"
            jit = jitter[jj][ii]
            if (ii + jj) % 2 == 0:
                items.append(
                    f'<ellipse cx="{f(cx + jit)}" cy="{f(cy)}" rx="{f(cell * 0.62)}" ry="{f(cell * 0.4)}" fill="url(#{g})"/>'
                )
            else:
                items.append(
                    f'<ellipse cx="{f(cx)}" cy="{f(cy + jit)}" rx="{f(cell * 0.4)}" ry="{f(cell * 0.62)}" fill="url(#{g})"/>'
                )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f"<defs>{grad('a', warp, 0.18, 0.1)}{grad('b', weft, 0.14, 0.12)}"
        f'{fuzz(seed, fuzz_scale, region=FULL)}</defs>'
        f'<rect width="{size}" height="{size}" fill="{base}"/>'
        f'<g filter="url(#fuzz)">{"".join(items)}</g></svg>'
    ), name


def write(svg_and_name):
    svg, name = svg_and_name
    with open(os.path.join(OUT, f"{name}.svg"), "w") as fh:
        fh.write(svg)


for key, value in THREADS.items():
    write(yarn_strip(key, value, 1))
    write(yarn_strip(key, value, 2))

# Page ground: grey wool, low contrast so text stays readable on it.
write(cloth("cloth-ground", "#dcdfda", "#e9ebe8", "#e2e5e0"))
# Surfaces (cards, panels): lighter and finer, nearly flat.
write(cloth("cloth-surface", "#f3f4f1", "#fbfbfa", "#f6f7f4", cell=6, cells=16, seed=7, fuzz_scale=1.2))
# Ink panel: dark wool for the decision panel.
write(cloth("cloth-ink", "#1c1f30", "#2a2e45", "#252940", cell=8, cells=12, seed=11))
