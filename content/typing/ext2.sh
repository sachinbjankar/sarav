#!/bin/bash
f="$1"; slug=$(echo "$f" | sed 's|^\./||; s|[ /()]|_|g; s|\.pdf$||')
out=/home/claude/tp/raw2/$slug.txt; [ -s "$out" ] && exit 0
tmp=$(mktemp -d); pdftoppm -r 400 -gray -png "$f" $tmp/p
for p in $tmp/p*.png; do TESSDATA_PREFIX=/home/claude/tess tesseract "$p" - -l mar+eng --psm 4 2>/dev/null; done > "$out"; rm -rf $tmp
