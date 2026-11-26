# Changelog

## Unreleased

Everything below is a draft: the trace format, the contract and the laws can still change.

- **Trace format, adapter contract and seven laws**: [spec/](spec/). A trace is typed and validated, stores a typed text by its name and never by its value, and can carry evidence on a step or at its top. The format and the mobile vocabulary are also published as JSON Schemas.
- **The `ecr` command**: `validate`, `compile`, `replay`, `repair`, `conformance`. It runs from a clone, and no command calls a model. See [docs/command.md](docs/command.md).
- **Reference adapter**: a to-do list in memory, compiled to a plain `node:test` file that runs without ECR.
- **Conformance kit**: checks an adapter against the laws. On the reference adapter it passes L1, L2, L3, L5 and L7, passes L4 with the network closed (checked in CI), and part of L6.
- **A bug is a test too**: a check recorded with `"observed": "failed"` compiles to a test that is red until the bug is fixed. A replay gives `pass`, `bug`, `fixed` or `FAIL`, and only `FAIL` fails the command.
- **Bounded repair**: `ecr repair` accepts or refuses a new action for the step a replay diverged on. It never accepts a patch on a failed check. On LocalSend, on Android emulators, it accepted an agent's proposal for 25 of the 26 traces broken by a reworded text.
- **Mobile adapter**: a mobile vocabulary and a compiler to [Maestro](https://maestro.dev) flows, replayed with `maestro test` on an Android emulator. A press can say where in the element it lands, and a swipe can keep its two ends. `hideKeyboard` hides the keyboard only while one is on the screen: on Android, Maestro's own command presses Back even when no keyboard is open, which leaves the screen. See [packages/adapter-maestro](packages/adapter-maestro/README.md).
- **Repeated replays**: `ecr replay --times <n> --report <file>` replays each trace several times and keeps every result as JSON, with no message of the system and no parameter value.
- **Evaluation protocol**, written before any measured run: [paper/protocol.md](paper/protocol.md).
- **The README and the docs pages in six more languages**: Chinese, Japanese, Spanish, Portuguese, Vietnamese and Turkish, in [i18n/](i18n/). `pnpm check` checks that every relative link of the Markdown pages points to a file and an anchor that exist.
- **Citing ECR**: a [NOTICE](NOTICE) file, which the Apache-2.0 license requires every copy, fork or package of ECR's code to keep, the short name in [CITATION.cff](CITATION.cff), and a README section with a badge and a button, light or dark, that link back here, for the projects that use ECR.
- **Build with ECR**: a README section with ideas of projects to build on ECR, the repositories built with it, and two issue forms, one to propose an idea and one to ask for a repository to be listed.
- **Evaluation on LocalSend**: the paper, its protocol, its result files and the scripts behind every number, in [paper/](paper/), with the 25 [mutants](drift-bench/mutants/localsend/README.md). The README gives the results and what counts against ECR.
