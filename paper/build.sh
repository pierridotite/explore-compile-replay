#!/usr/bin/env bash
# Builds the two PDFs of the paper. Needs TeX Live with the acmart class.
#   build/main.pdf       named version (published as ecr-paper.pdf)
#   build/anonymous.pdf  anonymous, in review format
set -euo pipefail
cd "$(dirname "$0")"
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=build main.tex
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=build -jobname=anonymous \
  -usepretex='\def\ECRANON{1}' main.tex
for name in main anonymous; do
  echo "$name.pdf: $(pdfinfo "build/$name.pdf" | awk '/^Pages/ {print $2}') pages"
done
