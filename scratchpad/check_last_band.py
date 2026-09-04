#!/usr/bin/env python3
"""
Hard rule: the last band on every page must be warm-white.

The footer illustration's sky is --warm-white and its dune runs straight into
.footer. Any other colour in the section directly above draws a hard horizon
across the page a few hundred pixels above the dune. It has now been shipped
by mistake twice (getting-here.html on 4 Sep, book.html the same afternoon),
both times after the rule was already written in CLAUDE.md. A rule in a
document does not stop a hand; this does. Run before committing — the local
pre-commit hook does.

Exit 1 with the offending page and class; exit 0 when every page closes on
warm-white.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
COLOURED = {'band--sand', 'band--ink', 'band--sage', 'cta-band', 'reveal-img', 'route', 'rev'}
LIGHT_OK = {'rev--light'}   # a coloured family that has an explicit warm-white variant

bad = []
for page in sorted(ROOT.glob('*.html')):
    s = page.read_text(encoding='utf-8')
    if '<footer class="footer">' not in s:
        continue
    head = s[:s.index('<footer class="footer">')]
    m = list(re.finditer(r'<(section|aside)\b([^>]*)>', head))
    if not m:
        continue
    tag, attrs = m[-1].group(1), m[-1].group(2)
    cls = set((re.search(r'class="([^"]*)"', attrs) or [None, ''])[1].split())
    inline_bg = 'background' in (re.search(r'style="([^"]*)"', attrs) or [None, ''])[1]
    coloured = cls & COLOURED
    if (coloured and not (cls & LIGHT_OK)) or inline_bg:
        why = ', '.join(sorted(coloured)) or 'inline background'
        bad.append(f'  {page.name:22s} <{tag} class="{" ".join(sorted(cls))}">  ← {why}')

if bad:
    print('LAST BAND MUST BE WARM-WHITE — it meets the footer illustration\'s sky.')
    print('\n'.join(bad))
    sys.exit(1)
print(f'ok — every page closes on warm-white ({len(list(ROOT.glob("*.html")))} pages)')
