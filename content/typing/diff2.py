import json,re,difflib
d=json.load(open('/home/claude/tp/passages.json'))
def N(w): return re.sub(r'[\u200d\u200c"“”\'‘’()\[\],.?!;]','',w).replace('ः',':').replace('र्‍','ऱ्')
dev=re.compile(r'^[\u0900-\u097f:\-/]+$')
odd=re.compile(r'््|स्स|छृ|छट|कृटुंब|कूृ|कृठे|कूठे|क्रश|क्रह|त््व|ह॒|ढ॒|व॒|^ॅ|ुु|ाा|ेे|ंं|ॅट|ल्रि|े्|[०-९][\u0900-\u097f]')
out=[]
for i,o in enumerate(d):
  if o['lang']!='mr':continue
  a=o['text'].split(); b=open('/home/claude/tp/raw2/'+o['file'],encoding='utf-8').read().split()
  sm=difflib.SequenceMatcher(None,[N(x) for x in a],[N(x) for x in b],autojunk=False)
  items=[]
  for tag,i1,i2,j1,j2 in sm.get_opcodes():
    if tag=='equal' or i2-i1>4 or j2-j1>4 or i1==i2: continue
    A=' '.join(a[i1:i2]);B=' '.join(b[j1:j2])
    if not all(dev.match(N(x) or 'क') for x in b[j1:j2]) or re.search(r'\d{2}-\d{3}',B): 
      if not any(odd.search(x) for x in a[i1:i2]): continue
    items.append(f"{A}|{B}")
  for w in a:
    if odd.search(w) and not any(w in it for it in items): items.append(w+'|?')
  if items: out.append(f"#{i} "+' ; '.join(items))
open('/home/claude/tp/review2.txt','w').write('\n'.join(out)); print(len(out), sum(x.count(';')+1 for x in out))
