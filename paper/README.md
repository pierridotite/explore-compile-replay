# The paper

"Explore, Compile, Replay: Turning Persona-Driven Agent Explorations into Deterministic Tests". 8 pages, references included. The named PDF is [`ecr-paper.pdf`](ecr-paper.pdf).

Status: first public version, 26 November 2026. Every result comes from a file in `results/`, from one campaign on LocalSend v1.19.0.

## Files

| File | What it is |
|---|---|
| [`main.tex`](main.tex), [`sections/`](sections), [`refs.bib`](refs.bib) | The source |
| [`protocol.md`](protocol.md) | What the evaluation measures and how, written before any measured run, with dated amendments |
| [`claims.md`](claims.md) | Each number and each fact of the paper, with the file that holds it and the command that reads it |
| [`raw/experimental_log.md`](raw/experimental_log.md) | The log of what was run |
| [`scripts/`](scripts) | The scripts that write the result files and print every number (`summary.py`, `breakeven.py`, `tex_numbers.py`) |
| [`results/`](results) | One file per run, by research question; `results/lines/` holds the public lines of each run page |

## Build

TeX Live with `acmart`, `latexmk` and `bibtex`.

```sh
./build.sh
```

It writes two files from the same source:

- `build/main.pdf`: the named version, the one published as `ecr-paper.pdf`.
- `build/anonymous.pdf`: the review format, for a double-blind submission. It hides the name of the author, the address of the repository and the name of the mobile tool of the case study.

## Rules

1. A number that answers a research question enters the paper only from a file in `results/`.
2. A fact about the code is checked at one commit, the one the paper cites. When the code moves, run `pnpm check` and `pnpm size` again, then update the commit in `main.tex` and the rows of `claims.md`.
3. A reference enters `refs.bib` only after its page was read: authors, title, venue, year and identifier.
