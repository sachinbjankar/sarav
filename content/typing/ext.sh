#!/bin/bash
# $1 = pdf path; writes raw/<slug>.txt
f="$1"; slug=$(echo "$f" | sed 's|^\./||; s|[ /()]|_|g; s|\.pdf$||')
out=/home/claude/tp/raw/$slug.txt
[ -s "$out" ] && exit 0
case "$f" in
 *English*) w=$(pdftotext -layout "$f" - 2>/dev/null | wc -w)
   if [ "$w" -gt 120 ]; then pdftotext -layout "$f" "$out"; echo "#SRC text" >> "$out"; exit 0; fi; lang=eng;;
 *) lang=mar;;
esac
tmp=$(mktemp -d); pdftoppm -r 300 -png "$f" $tmp/p
for p in $tmp/p*.png; do TESSDATA_PREFIX=/home/claude/tess tesseract "$p" - -l $lang --psm 6 2>/dev/null; done > "$out"
echo "#SRC ocr-$lang" >> "$out"; rm -rf $tmp
