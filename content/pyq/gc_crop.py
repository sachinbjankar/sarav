"""Crop the Marathi part of question n (from its number to the end of its first options row).
usage: python3 -I gc_crop.py <first_page> <last_page> <out_dir> <n> [<n> ...]  (n may be n:full for whole block)
"""
import sys, csv, re, os
from PIL import Image
import os
OCR = os.environ.get('OCR_DIR', '/home/claude/gc/ocr')
a, b, outd = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
want = sys.argv[4:]
os.makedirs(outd, exist_ok=True)
DEV = str.maketrans('०१२३४५६७८९', '0123456789')

def words(p):
    rows = []
    with open(f'{OCR}/{p}.tsv', encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
            if r['level'] == '5' and r['text'].strip():
                rows.append({k: (int(r[k]) if k in ('left', 'top', 'width', 'height', 'block_num', 'par_num', 'line_num') else r[k]) for k in ('left', 'top', 'width', 'height', 'text', 'block_num', 'par_num', 'line_num')})
    return rows

# question starts: first word of a line, near left margin, matching "N."
starts = []  # (n, page, top)
expect = 1
for p in range(a, b + 1):
    if not os.path.exists(f'{OCR}/{p}.tsv'): continue
    W = words(p)
    lines = {}
    for w in W: lines.setdefault((w['block_num'], w['par_num'], w['line_num']), []).append(w)
    for key in sorted(lines, key=lambda k: min(x['top'] for x in lines[k])):
        L = sorted(lines[key], key=lambda x: x['left'])
        m = re.match(r'^[\'"‘“|]?([0-9०-९]{1,3})[.,।:]', L[0]['text'])
        if m and int(m.group(1).translate(DEV)) == expect and L[0]['left'] < 400:
            starts.append((expect, p, L[0]['top'], lines, L[0]['left'])); expect += 1

def first_opt_bottom(lines, top, stop):
    best = None
    for key, L in lines.items():
        t = min(x['top'] for x in L)
        if t <= top or t >= stop: continue
        txt = ' '.join(x['text'] for x in sorted(L, key=lambda x: x['left']))
        if re.search(r'\(\s*[1१]\s*\)', txt):
            if best is None or t < best[0]: best = (t, max(x['top'] + x['height'] for x in L))
    return best

for spec in want:
    full = spec.endswith(':full'); n = int(spec.split(':')[0])
    s = [x for x in starts if x[0] == n]
    if not s: print('not found', n); continue
    _, p, top, lines, left = s[0]
    nxt = [x for x in starts if x[0] == n + 1 and x[1] == p]
    img = Image.open(f'{OCR}/{p}.png')
    stop = nxt[0][2] - 10 if nxt else int(img.height * 0.93)
    if full:
        bottom = stop
    else:
        fo = first_opt_bottom(lines, top, stop)
        bottom = fo[0] - 8 if fo else stop  # stem only (exclude options row)
    crop = img.crop((max(0, left - 20), max(0, top - 18), img.width - 120, min(img.height, bottom)))
    crop.save(f'{outd}/q{n}.png')
    print(n, 'page', p, crop.size)
