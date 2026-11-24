# Fonts for generated images

Figtree 600 and Bricolage Grotesque 800, static TTF, downloaded from Google
Fonts (`fonts.gstatic.com`, v9) on 2026-11-24. Both are licensed under the
SIL Open Font License 1.1 (https://openfontlicense.org).

`next/og` (`ImageResponse`) only reads TTF, OTF or WOFF, so the Open Graph
image loads these files; the pages themselves use `next/font/google`.
