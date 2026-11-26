<div align="center">

<img src="assets/logo.svg" alt="" width="96" height="96">

# Explore-Compile-Replay

**An agent explores your app once. What it did becomes a standard test that reruns in CI with no model.**

[![CI](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml/badge.svg)](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/pierridotite/explore-compile-replay?style=flat&label=stars&color=1f883d)](https://github.com/pierridotite/explore-compile-replay/stargazers)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-1f883d)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/pierridotite/explore-compile-replay?color=1f883d)](https://github.com/pierridotite/explore-compile-replay/commits/main)

**[Quick start](#quick-start)** · **[Documentation](docs/command.md)** · **[Paper and specification](#paper-and-specification)** · **[Contributing](CONTRIBUTING.md)** · **[Changelog](CHANGELOG.md)**

<sub>English · [简体中文](i18n/zh-CN/README.md) · [日本語](i18n/ja/README.md) · [Español](i18n/es/README.md) · [Português](i18n/pt-BR/README.md) · [Tiếng Việt](i18n/vi/README.md) · [Türkçe](i18n/tr/README.md)</sub>

<a href="https://www.linkedin.com/in/pierre-raffalli/"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/linkedin-follow-dark.svg"><img src="assets/linkedin-follow-light.svg" alt="Follow Pierre Raffalli on LinkedIn" width="160" height="54"></picture></a>
<a href="https://discord.gg/WuaCANscr8"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/discord-join-dark.svg"><img src="assets/discord-join-light.svg" alt="Join us on Discord" width="160" height="54"></picture></a>
<a href="#paper-and-specification"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/paper-dark.svg"><img src="assets/paper-light.svg" alt="Read about the paper" width="160" height="54"></picture></a>

</div>

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/how-it-works-dark.svg"><img src="assets/how-it-works-light.svg" alt="Explore once with an agent. The trace is compiled to a test file that runs without ECR and is replayed in CI with no model. When the app changes, a bounded repair proposes a patch, which is compiled again." width="900"></picture></p>

AI agents are good at finding what nobody thought to test. They are also slow, they cost money on every run, and they never take the same path twice, so they do not fit in CI. Explore-Compile-Replay (ECR) keeps the first part and removes the rest: the agent runs once, and its path is kept as a plain test file that anyone can read, review and run.

> **Early draft, opened on 24 November 2026.** It runs end to end on a toy system and on a demo mobile app, not yet on a real app: [where it stands](#where-it-stands).

## Quick start

You need Node 22.18 or later and pnpm. Nothing is on npm yet: it runs from a clone.

```sh
git clone https://github.com/pierridotite/explore-compile-replay && cd explore-compile-replay
pnpm install
pnpm check     # types, tests and the conformance report

export ECR_PARAM_ITEM_TITLE="Buy bread" ECR_PARAM_PRIVATE_NOTE="Door code 4821"
pnpm ecr replay packages/adapter-fixture/examples/anna-first-item.trace.json \
  --adapter packages/adapter-fixture/src/index.ts
# pass  anna-first-item (node-test, 80 ms)
```

That replays a recorded trace against a to-do list in memory, the reference system. Every command: [docs/command.md](docs/command.md).

## How it works

1. **Explore.** An agent plays a persona and uses the system once. Each action and each check is recorded in a typed trace.
2. **Compile.** The trace becomes a standard test file, a [Maestro](https://maestro.dev) flow for a mobile app today. It runs without ECR.
3. **Replay.** The file runs in CI. No model, no tokens, the same verdict every time.

When the app changes and a step breaks, your agent proposes a new action for that step, and a bounded **repair** accepts or refuses it. A repair can change how a step finds its target, never what the test checks. A bug the agent found is kept too: it compiles to a test that stays red until the bug is fixed.

<details>
<summary>A step of a trace, and what it compiles to</summary>

```json
{
  "id": "s8",
  "action": { "kind": "tapOn", "target": { "text": "Save" } },
  "checkpoints": [
    { "id": "item-listed", "check": { "kind": "visible", "target": { "text": { "param": "ITEM_TITLE" } } } }
  ]
}
```

```yaml
# Step s8
- tapOn:
    text: "Save"
# Oracle item-listed
- assertVisible:
    text: "${ITEM_TITLE}"
```

The tap is stored by the name of the button, not by its place on the screen. The text that was typed is stored by its name, never by its value. The whole example: [the trace](packages/adapter-maestro/examples/anna-first-item-mobile.trace.json) and [the flow](packages/adapter-maestro/examples/anna-first-item-mobile.flow.yaml).

</details>

<details>
<summary>The four results of a replay</summary>

| Result | Meaning |
|---|---|
| `pass` | Every check holds |
| `bug` | The replay stops on the bug the trace records, and on nothing else |
| `fixed` | The check that was recorded as a bug holds now. It becomes a guard |
| `FAIL` | Anything else: a step no longer finds its target, or a check that held no longer holds |

</details>

## Paper and specification

ECR is meant to be a standard that anyone can implement, not one tool.

- **Specification.** The [trace format](spec/schema.ts), also published as a [JSON Schema](spec/trace.schema.json), the [adapter contract](spec/contract.ts) and [seven laws](spec/laws.md): determinism, fidelity, traceability, no model, state, safe repair, no secret. Drafts that can still change.
- **Conformance kit.** It checks an adapter law by law. An adapter that passes it conforms, whoever wrote it. How to write one: [docs/adapter.md](docs/adapter.md).
- **Paper.** The pattern, the contract and an evaluation on a real app, [LocalSend](https://github.com/localsend/localsend). Its [protocol](paper/protocol.md) was public before the first measured run. Being written: the preprint comes on Zenodo with the first release.
- **Citation.** [CITATION.cff](CITATION.cff), or "Cite this repository" on this page, and a badge for the projects that use ECR: [citing ECR](#citing-ecr).

<details>
<summary>The seven laws in short</summary>

| | Law | In short |
|---|---|---|
| L1 | Determinism | The same trace compiles to the same bytes. The same file gives the same verdict |
| L2 | Fidelity | The file runs the actions and the checks of the trace, in the same order |
| L3 | Traceability | Each step of the trace maps to one distinct range of the file |
| L4 | No model | Compiling and replaying call no model |
| L5 | State | A saved state, once restored, is observed as identical, when the adapter can save one |
| L6 | Safe repair | A patch stays inside the failing step, and removes or weakens no check |
| L7 | No secret | Neither the trace nor the file contains a secret value |

</details>

## Where it stands

- **Works today:** the `ecr` command (`validate`, `compile`, `replay`, `repair`, `conformance`), a reference adapter, and a mobile adapter that compiles to Maestro flows, replayed on an Android emulator.
- **In progress:** a real app, LocalSend, and the first release, with the preprint and a DOI.
- **Not yet:** iOS, a repair on a device, a package on npm.

Part by part: [docs/status.md](docs/status.md).

## Where it comes from

ECR generalizes [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), which gives one phone to each AI tester on GitHub's runners and is the first project that writes ECR traces. The shape of the idea comes from [Remotion](https://www.remotion.dev), where a video is code: an AI writes it once, and every render gives the same video with no model. Here the agent explores once, and the replay is the render.

<details>
<summary>ECR does not claim to be first: the tools that came before</summary>

Several tools already keep or replay what an agent did, each for its own system: [Stagehand](https://github.com/browserbase/stagehand), [Skyvern](https://github.com/Skyvern-AI/skyvern), [workflow-use](https://github.com/browser-use/workflow-use), [Midscene](https://github.com/web-infra-dev/midscene), [Arbigent](https://github.com/takahirom/arbigent), [muscle-mem](https://github.com/pig-dot-dev/muscle-mem) and [autocompile](https://github.com/mirkokiefer/autocompile). What this project adds is a name for the pattern and a written contract for it: one that works across systems, compiles to files that run without the tool, protects what the tests check, and can be verified by a conformance kit.

</details>

## Build with ECR

ECR is a pattern, not a mobile tool: any system that an agent can use can be explored once and then replayed with no model. Below are ideas of projects to build on it. The first repositories that build one properly will be listed here, and anyone can propose a new idea.

**Built with ECR:** [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), for mobile apps, the first project that writes ECR traces.

<details>
<summary>Ideas to build</summary>

- **Security tests of your own app.** An agent looks for access flaws in a test copy of your app: an account that can see the data of another account, a paid screen that opens without paying. Each finding compiles to a test that stays red until the flaw is fixed, then keeps it from coming back. Only on systems that you own or are allowed to test.
- **Web apps.** A browser adapter: the agent explores a site, and the trace compiles to a Playwright test.
- **Accessibility.** The agent uses an app with a screen reader, or with the keyboard only. Each step it cannot get through, such as a button with no label or a focus trap, becomes a test.
- **Command-line tools.** The agent learns a tool from its help, and the trace compiles to a shell test that checks exit codes and outputs.
- **APIs.** The agent explores a REST API from its OpenAPI file, and the trace compiles to contract tests.
- **Games.** The agent plays a level with a fixed seed, and the trace compiles to a replay of the inputs that checks, after each change, that the level can still be finished.
- **Getting started guides.** The agent follows a README on a fresh machine, and the trace becomes a CI job that fails when the guide no longer matches the code.
- **Business apps.** The agent goes through a back-office flow of a CRM or an ERP in a sandbox, such as creating a record and getting it approved, and the trace compiles to the platform's own tests.

</details>

<details>
<summary>How a repository gets listed, and how to propose an idea</summary>

A repository is listed when:

- it is public, under an open-source license;
- its traces pass `ecr validate`, and its adapter, if it brings one, passes `ecr conformance`;
- its compiled tests run in CI with no model, and a green run shows it;
- its README cites ECR, with the [badge or the button](#citing-ecr);
- if it tests security, it tests only systems that its users own or are allowed to test, and it publishes no attack on the systems of others.

To be listed, open a [Built with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=built-with-ecr.yml) issue with the link to your repository, one trace and the green run. Repositories are listed in the order they come in. To propose an idea that is not on the list, open an [Idea to build with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=idea.yml) issue.

</details>

## Citing ECR

If your project uses ECR, show it: add this badge to your README. It links back here, and that is how the next team finds the pattern.

[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)

```md
[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)
```

Or this button, which follows the light or dark theme of the page:

<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/tested-with-ecr-dark.svg"><img src="assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>

```html
<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-dark.svg"><img src="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>
```

In a paper, a talk or a product page, cite the repository: the "Cite this repository" button on GitHub gives the reference, from [CITATION.cff](CITATION.cff). A DOI comes with the first release.

For the code itself, the Apache-2.0 license decides: a copy, a fork or a package of ECR's code, changed or not, must keep the [LICENSE](LICENSE) and [NOTICE](NOTICE) files. NOTICE names ECR and links to this repository.

## Contributing

The contract is the thing to challenge right now: [open an issue](https://github.com/pierridotite/explore-compile-replay/issues/new) and say what would not fit your system. To write code, [CONTRIBUTING.md](CONTRIBUTING.md) lists two open pieces, a web adapter and an MCP server, and smaller tasks to start with.

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

Made by Pierre Raffalli · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Apache-2.0 license](LICENSE)
