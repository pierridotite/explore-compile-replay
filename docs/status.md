# What exists today

English · [简体中文](../i18n/zh-CN/docs/status.md) · [日本語](../i18n/ja/docs/status.md) · [Español](../i18n/es/docs/status.md) · [Português](../i18n/pt-BR/docs/status.md) · [Tiếng Việt](../i18n/vi/docs/status.md) · [Türkçe](../i18n/tr/docs/status.md)

Part by part, with what is a draft and what is not started. Updated with the code.

| Part | Status |
|---|---|
| Trace schema, [`spec/schema.ts`](../spec/schema.ts) | Draft. Type-checked, with a validated example and a generated [JSON Schema](../spec/trace.schema.json). A step may carry evidence (a screenshot, where the finger landed) for tools that show a trace |
| Adapter contract, [`spec/contract.ts`](../spec/contract.ts) | Draft. Type-checked |
| Seven laws, [`spec/laws.md`](../spec/laws.md) | Draft |
| Core, [`packages/core`](../packages/core/src/index.ts) | First slice: record a trace through a driver, validate it, hash it, resolve parameters, check a source map, tell a recorded bug from a regression |
| `ecr` command, [`packages/cli`](../packages/cli/src/run.ts) | Runs from this repository: `validate`, `compile`, `replay`, `repair`, `conformance`. Not on npm yet. See [the command](command.md) |
| MCP server, for an agent to explore | Not started. Open to contributions: [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Reference adapter, [`packages/adapter-fixture`](../packages/adapter-fixture/src/adapter.ts) | Runs. A to-do list in memory, compiled to a plain `node:test` file |
| Conformance kit, [`packages/conformance`](../packages/conformance/src/index.ts) | Checks L1, L2, L3, L4 (with the network closed), L5 and L7, and part of L6 |
| Repair, [`packages/core`](../packages/core/src/repair.ts) | First slice: `ecr repair` accepts or refuses a new action for the step that diverged. It calls no model and proposes nothing itself. On LocalSend, on Android emulators, it accepted an agent's proposal for 25 of the 26 traces broken by a reworded text, every check unchanged, and refused every proposal on a failed check. A change that needs two steps is refused |
| Mobile adapter, [`packages/adapter-maestro`](../packages/adapter-maestro/README.md) | Draft. A mobile vocabulary and a compiler to [Maestro](https://maestro.dev) flows. On an Android emulator, against the demo app of mobile-agent-testers: two flows written by hand replay in a [run started by hand](../.github/workflows/device.yml), and of four paths explored by an agent, two stopped on a step and two, of 37 and 25 steps, replayed in full with no model. A failure names its step or its oracle. No driver. Not tried on iOS. On LocalSend, a real app: 7 traces kept from 20 explorations of an agent, and 137 of 140 replays on the unchanged app gave what the trace records, with no model ([results](../README.md#results-on-localsend)). 20 of the 24 paths of a robot with no model replayed in full |
| Web adapter, compiling to Playwright tests | Not started. Open to contributions: [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Drift benchmark: does a replay break, repair, or stay red when it should? | Run on LocalSend: 25 changes in five classes, the [mutants](../drift-bench/mutants/localsend/README.md) written after the traces were frozen, as the [protocol](../paper/protocol.md) asks. No change of behaviour ended green. Results by class: [README](../README.md#results-on-localsend), files in [`paper/results/`](../paper/results/) |
| Paper | Written: [the PDF](../paper/ecr-paper.pdf), 8 pages, with the evaluation on LocalSend. The preprint will be published on Zenodo with the first release |
