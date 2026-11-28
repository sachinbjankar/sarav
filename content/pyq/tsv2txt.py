import csv,sys
for f in sys.argv[1:]:
    lines={}
    with open(f,encoding='utf-8') as h:
        for r in csv.DictReader(h,delimiter='\t',quoting=csv.QUOTE_NONE):
            if r['level']=='5' and r['text'].strip():
                k=(int(r['block_num']),int(r['par_num']),int(r['line_num'])); lines.setdefault(k,[]).append((int(r['left']),int(r['top']),r['text']))
    out=[' '.join(w[2] for w in sorted(v)) for k,v in sorted(lines.items(),key=lambda kv:min(w[1] for w in kv[1]))]
    open(f[:-4]+'.txt','w',encoding='utf-8').write('\n'.join(out))
