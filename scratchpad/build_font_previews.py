"""
Builds three typographic previews of the homepage next to the real one, so the
type can be judged on the actual page before anything sitewide changes.

    python3 scratchpad/build_font_previews.py

Writes fonts-a.html / fonts-b.html / fonts-c.html in the project root, each a
copy of index.html with one extra stylesheet that swaps --font-display (and
re-tunes the sizes that were set against Fraunces's light, narrow forms).
Nothing in style.css or index.html is touched. Delete the generated files and
this script once a decision has been made.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'index.html').read_text(encoding='utf-8')

FONTS = ('https://fonts.googleapis.com/css2'
         '?family=Work+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400'
         '&family=Instrument+Serif:ital@0;1'
         '&family=Jost:ital,wght@0,300;0,400;0,500;1,300'
         '&display=swap')

# Each variant: label, family stack, and the tuning that family needs.
VARIANTS = {
    'a': dict(
        name='A Work Sans',
        css="""
:root { --font-display: 'Work Sans', system-ui, sans-serif; }
.display, h1, h2 { font-weight: 300; letter-spacing: -0.04em; line-height: 1.05; font-variation-settings: normal; }
h1 { font-size: clamp(2.4rem, 6.4vw, 5.6rem); }
h2 { font-size: clamp(1.9rem, 4.4vw, 3.7rem); }
h3 { font-weight: 400; letter-spacing: -0.02em; }
.hero h1 { font-size: clamp(2.3rem, 6vw, 5.2rem); letter-spacing: -0.045em; }
.hero__tagline { font-weight: 300; letter-spacing: -0.02em; }
.rs__h { font-weight: 300; letter-spacing: -0.035em; font-variation-settings: normal; }
.quote blockquote { letter-spacing: -0.025em; }
""",
    ),
    'b': dict(
        name='B Instrument',
        css="""
:root { --font-display: 'Instrument Serif', Georgia, serif; }
.display, h1, h2 { font-weight: 400; letter-spacing: -0.015em; line-height: 1.0; font-variation-settings: normal; }
h1 { font-size: clamp(3rem, 9.4vw, 8.4rem); }
h2 { font-size: clamp(2.4rem, 6.4vw, 5.4rem); }
h3 { font-weight: 400; letter-spacing: 0; font-size: clamp(1.5rem, 2.8vw, 2.4rem); }
.hero h1 { font-size: clamp(2.8rem, 8.2vw, 7.2rem); }
.hero__tagline { font-weight: 400; font-size: clamp(1.4rem, 3.6vw, 3.1rem); }
.rs__h { font-weight: 400; letter-spacing: -0.01em; font-variation-settings: normal; }
.quote blockquote { font-weight: 400; }
""",
    ),
    'c': dict(
        name='C Jost',
        css="""
:root { --font-display: 'Jost', system-ui, sans-serif; }
.display, h1, h2 { font-weight: 300; letter-spacing: -0.03em; line-height: 1.02; font-variation-settings: normal; }
h1 { font-size: clamp(2.6rem, 7.6vw, 6.6rem); }
h2 { font-size: clamp(2rem, 5vw, 4.2rem); }
h3 { font-weight: 400; letter-spacing: -0.01em; }
.hero h1 { font-size: clamp(2.5rem, 6.8vw, 5.9rem); }
.hero__tagline { font-weight: 300; }
.rs__h { font-weight: 300; letter-spacing: -0.025em; font-variation-settings: normal; }
""",
    ),
}

# The hand-lettered map labels name Fraunces directly (not via the variable),
# so they are overridden here for every variant.
COMMON_CSS = """
.hand { font-family: var(--font-display); font-style: italic; font-weight: 300; font-variation-settings: normal; font-size: 28px; }

/* Preview switcher — preview pages only, never in style.css. */
.fontpick { position: fixed; left: 12px; bottom: 12px; z-index: 2000; display: flex; gap: 2px;
  background: rgba(43,41,38,0.92); border-radius: 999px; padding: 4px; font: 500 12px/1 'Work Sans', system-ui, sans-serif; }
.fontpick { max-width: calc(100vw - 24px); overflow-x: auto; }
.fontpick a { color: #F8F6F1; padding: 9px 12px; border-radius: 999px; letter-spacing: 0.02em; white-space: nowrap; }
.fontpick a[aria-current="page"] { background: #F8F6F1; color: #2B2926; }
"""

for key, v in VARIANTS.items():
    html = src
    head_add = (f'<link rel="stylesheet" href="{FONTS}">\n'
                f'<style>{v["css"]}{COMMON_CSS}</style>\n')
    html = html.replace('<link rel="stylesheet" href="style.css">',
                        '<link rel="stylesheet" href="style.css">\n' + head_add, 1)

    links = ['<a href="index.html">Nu</a>']
    for k2, v2 in VARIANTS.items():
        here = ' aria-current="page"' if k2 == key else ''
        links.append('<a href="fonts-%s.html"%s>%s</a>' % (k2, here, v2['name']))
    # A preview must not count as a visit: neutralise both trackers after
    # script.js has defined them, whatever the consent state.
    tail = ('<nav class="fontpick" aria-label="Font preview">' + ''.join(links) + '</nav>\n'
            '<script>window.loadGoogleAnalytics = function () {}; window.loadMetaPixel = function () {};</script>\n')
    html = html.replace('<script src="script.js"></script>',
                        '<script src="script.js"></script>\n' + tail, 1)
    assert 'fontpick' in html and 'fonts.googleapis.com/css2?family=Work+Sans:ital' in html
    out = ROOT / f'fonts-{key}.html'
    out.write_text(html, encoding='utf-8')
    print('wrote', out.name, '-', v['name'])
