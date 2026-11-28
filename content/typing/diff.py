import json, re, difflib, collections
d = json.load(open('/home/claude/tp/passages.json'))
rev = []
total = 0
for i, o in enumerate(d):
    o['text'] = '\n'.join(p for p in o['text'].split('\n') if not re.fullmatch(r'[_\-—. ]+', p))
    if o['lang'] != 'mr': continue
    t2 = open('/home/claude/tp/raw2/' + o['file'], encoding='utf-8').read()
    a = o['text'].split()
    b = t2.split()
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    diffs = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal': continue
        if i2 - i1 > 6 or j2 - j1 > 6: continue  # header/footer junk
        A = ' '.join(a[i1:i2]); B = ' '.join(b[j1:j2])
        if not A: continue
        ctx = ' '.join(a[max(0, i1 - 3):i1])
        diffs.append(f"  [{i1}] {ctx} «{A}» vs «{B}»")
    sus = [w for w in a if re.search(r'[A-Za-z0-9$&@%]', w)]
    if sus: diffs.append('  SUS: ' + ' '.join(sus))
    total += len(diffs)
    rev.append(f"#{i} {o['file']} ({o['words']}w)\n" + '\n'.join(diffs))

open('/home/claude/tp/review.txt', 'w').write('\n'.join(rev))
print('diff items', total)
