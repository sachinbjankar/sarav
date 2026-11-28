"""Parse OCR'd MPSC bilingual booklet pages into questions.
usage: python3 -I gc_parse.py <first_page> <last_page> <out.json>
Each question: n, mr (stem), mo (4 options), en (stem), eo (4 options), pages, raw
"""
import re, sys, json, csv

import os
OCR = os.environ.get('OCR_DIR', '/home/claude/gc/ocr')
a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
DEV = str.maketrans('०१२३४५६७८९', '0123456789')
dev = lambda s: sum(1 for c in s if 'ऀ' <= c <= 'ॿ')
lat = lambda s: sum(1 for c in s if c.isascii() and c.isalpha())

JUNK = re.compile(r'(SPACE FOR ROUGH|कच्च्या कामासाठी|mpscmaterial|P\.?T\.?O|^\W{0,3}[A-Z]\d{2}\s+\d+\s+[A-Z]?\W*$|^\W{0,3}[A-Z]?\s*\d{1,2}\s+[A-Z]\d{2}\W*$)', re.I)
lines = []  # (page, text)
for p in range(a, b + 1):
    try:
        t = open(f'{OCR}/{p}.txt', encoding='utf-8').read()
    except FileNotFoundError:
        print('missing page', p); continue
    for l in t.split('\n'):
        s = l.strip()
        if not s or JUNK.search(s): continue
        if len(s) <= 3 and not re.match(r'^\(\d\)', s): continue
        lines.append((p, s))

# split by question numbers in sequence
qs, cur, expect = [], None, 1
num_re = re.compile(r'^[\'"‘“|]?\s*([0-9०-९]{1,3})\s*[.,।:]\s*(?:0\s+)?(.*)$')
for p, s in lines:
    m = num_re.match(s)
    k = int(m.group(1).translate(DEV)) if m else -1
    if m and expect <= k <= expect + 1 and (k == expect or len(s) > 25):
        if k == expect + 1: qs.append({'n': expect, 'lines': ['[MISSING]'], 'pages': [p]})
        cur = {'n': k, 'lines': [], 'pages': [p]}
        qs.append(cur); expect = k + 1
        if m.group(2): cur['lines'].append(m.group(2))
        continue
    if cur is None: continue
    if p not in cur['pages']: cur['pages'].append(p)
    cur['lines'].append(s)

opt_re = re.compile(r'\(\s*([1-4१-४])\s*\)')
def split_opts(text):
    parts = opt_re.split(text)
    # parts: [pre, '1', o1, '2', o2, ...]
    res = {}
    for i in range(1, len(parts) - 1, 2):
        k = int(parts[i].translate(DEV))
        res.setdefault(k, parts[i + 1].strip())
    return [res.get(k, '').strip(' ;,') for k in (1, 2, 3, 4)]

for q in qs:
    L = q['lines']
    # find option groups: a line (or two consecutive lines) containing (1) .. up to (4)
    groups = []
    i = 0
    while i < len(L):
        if opt_re.search(L[i]) and re.search(r'\(\s*[1१]\s*\)', L[i]):
            j = i; buf = L[i]
            while not re.search(r'\(\s*[4४]\s*\)', buf) and j + 1 < len(L) and j - i < 4:
                j += 1; buf += ' ' + L[j]
            groups.append((i, j, buf)); i = j + 1
        else:
            i += 1
    q['ngroups'] = len(groups)
    if len(groups) >= 2:
        g1, g2 = groups[0], groups[1]
        stem1 = ' \n'.join(L[:g1[0]]); stem2 = ' \n'.join(L[g1[1] + 1:g2[0]])
        o1 = split_opts(g1[2]); o2 = split_opts(g2[2])
    elif len(groups) == 1:
        g1 = groups[0]; stem1 = ' \n'.join(L[:g1[0]]); stem2 = ''; o1 = split_opts(g1[2]); o2 = ['', '', '', '']
    else:
        stem1 = ' \n'.join(L); stem2 = ''; o1 = o2 = ['', '', '', '']
    # language assignment
    if dev(stem1 + ''.join(o1)) >= lat(stem1 + ''.join(o1)) or not stem2:
        q['mr'], q['mo'], q['en'], q['eo'] = stem1, o1, stem2, o2
    else:
        q['mr'], q['mo'], q['en'], q['eo'] = stem2, o2, stem1, o1
    q['raw'] = '\n'.join(L)
    del q['lines']

json.dump(qs, open(out, 'w'), ensure_ascii=False, indent=1)
bad = [q['n'] for q in qs if q['ngroups'] < 2 or '' in q['mo']]
print(f'questions {len(qs)} / last n {qs[-1]["n"] if qs else None}; need review: {bad}')
